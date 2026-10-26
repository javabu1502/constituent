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
  return NextResponse.json(data ?? []);
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
