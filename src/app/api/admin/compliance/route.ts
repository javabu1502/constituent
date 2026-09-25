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
    .eq('decision', 'review')
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
    .select('id, message_key, reviewed_at')
    .eq('id', complianceId)
    .single();
  if (vErr || !verdict) return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
  if (verdict.reviewed_at) return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
  if (!verdict.message_key) return NextResponse.json({ error: 'Verdict has no message_key to release' }, { status: 422 });

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

  const { updated } = await resolveHeldMessage(verdict.message_key as string, action);
  return NextResponse.json({ ok: true, releasedRows: updated, action });
}
