import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { resolveHeldMessage } from '@/lib/cwc/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdmin(user: { id: string; email?: string }): boolean {
  const ids = process.env.ADMIN_USER_IDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (ids.includes(user.id)) return true;
  const emails = process.env.ADMIN_EMAILS?.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];
  return !!user.email && emails.includes(user.email.toLowerCase());
}

/**
 * GET /api/admin/compliance — the pending review queue: messages the content
 * gate flagged 'review' and held before CWC delivery. Admin only.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('message_compliance')
    .select('id, message_key, decision, reasons, categories, message_excerpt, model, created_at')
    // Blocked messages are listed too. A block means a person's message to
    // their representative was refused outright, and until now that produced
    // a database row nobody was told about and nobody could see, so a false
    // positive was unappealable and a real threat went unreported.
    .in('decision', ['review', 'block'])
    .is('reviewed_at', null)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) {
    console.error('[admin/compliance] queue fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch review queue' }, { status: 500 });
  }

  // Held messages whose verdict was never recorded.
  //
  // This page listed verdicts, so a message held *because* its verdict could
  // not be written was invisible on the one screen that can release it. That
  // happened for three weeks from 2026-10-25, when a partial unique index
  // made every audit write fail: the queue held the mail and this page said
  // "Nothing waiting for review".
  //
  // The queue is the source of truth for what is actually stuck, so anything
  // held with no verdict row is listed here too, and plainly labelled.
  const rows = data ?? [];
  const known = new Set(rows.map((r) => r.message_key as string));
  const { data: heldRows } = await admin
    .from('cwc_send_queue')
    .select('id, message_key, office_code, official_name, created_at')
    .eq('status', 'held')
    .order('created_at', { ascending: true })
    .limit(100);

  const orphans = (heldRows ?? [])
    .filter((h) => !known.has(h.message_key as string))
    .map((h) => ({
      id: `queue-${h.id}`,
      message_key: h.message_key,
      decision: 'review',
      reasons: ['Held before delivery, but the screener verdict was never recorded, so there is nothing to read here.'],
      categories: [],
      message_excerpt: `To ${h.official_name ?? h.office_code ?? 'an office'}. The message text is in the queue row, not in an audit record.`,
      model: 'none',
      created_at: h.created_at,
    }));

  return NextResponse.json([...rows, ...orphans]);
}

/**
 * PATCH /api/admin/compliance — resolve one held message.
 * Body: { complianceId: string, action: 'approve' | 'reject' }.
 * approve → held queue rows become 'queued' (the drainer sends them);
 * reject  → held queue rows become 'refused' (terminal).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { complianceId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { complianceId, action } = body;
  if (!complianceId || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'complianceId and action (approve|reject) required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // A held message whose verdict was never recorded. The GET above lists
  // these as `queue-<row id>` so they are visible; releasing one goes
  // straight to the queue, because there is no verdict row to mark reviewed
  // and waiting for one would leave the mail stuck forever.
  if (complianceId.startsWith('queue-')) {
    const queueId = Number(complianceId.slice('queue-'.length));
    if (!Number.isFinite(queueId)) return NextResponse.json({ error: 'Review item not found' }, { status: 404 });

    const { data: row } = await admin
      .from('cwc_send_queue')
      .select('id, message_key, status')
      .eq('id', queueId)
      .maybeSingle();
    if (!row) return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
    if (row.status !== 'held') return NextResponse.json({ error: `Already ${row.status}` }, { status: 409 });

    const { updated } = await resolveHeldMessage(row.message_key as string, action);
    if (updated === 0) {
      return NextResponse.json(
        { error: 'Nothing was released, so this was left in the queue.' },
        { status: 409 },
      );
    }
    // The audit trail still gets its row, written now rather than never, so
    // the decision is on the record even though the screener's own verdict
    // was lost.
    await admin.from('message_compliance').insert({
      message_key: row.message_key,
      decision: 'review',
      reasons: ['Verdict was never recorded; released by an administrator from the queue.'],
      categories: [],
      message_excerpt: '',
      model: 'none',
      prompt_version: 'none',
      raw_verdict: {},
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_decision: action === 'approve' ? 'approved' : 'rejected',
    });
    return NextResponse.json({ ok: true, released: updated, action });
  }

  const { data: verdict, error: vErr } = await admin
    .from('message_compliance')
    .select('id, message_key, reviewed_at, decision')
    .eq('id', complianceId)
    .single();
  if (vErr || !verdict) return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
  if (verdict.reviewed_at) return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
  if (!verdict.message_key) return NextResponse.json({ error: 'Verdict has no message_key to release' }, { status: 422 });

  // A blocked message was never enqueued, so there is no held row to release
  // and approving it cannot deliver anything. Say so instead of reporting a
  // silent success: the card used to disappear from the queue on any 2xx and
  // the message was then unreachable forever.
  const wasBlocked = verdict.decision === 'block';

  // The queue moves FIRST. Writing `reviewed_at` before releasing meant a
  // failure here left the verdict marked reviewed and the queue untouched,
  // so the message was dropped from the review loop without being sent.
  const { updated } = await resolveHeldMessage(verdict.message_key as string, action);
  if (action === 'approve' && updated === 0 && !wasBlocked) {
    return NextResponse.json(
      { error: 'Nothing was released, so this was left in the queue. Check the delivery rows for this message.' },
      { status: 409 },
    );
  }

  const { error: updErr } = await admin
    .from('message_compliance')
    .update({
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_decision: action === 'approve' ? 'approved' : 'rejected',
    })
    .eq('id', complianceId)
    .is('reviewed_at', null);
  if (updErr) {
    console.error('[admin/compliance] review update failed:', updErr);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    releasedRows: updated,
    action,
    decision: verdict.decision,
    ...(wasBlocked && action === 'approve'
      ? { note: 'This message was refused before it was queued, so approving it here does not deliver it. The sender has to send it again.' }
      : {}),
  });
}
