import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';
import { submitToCWC } from '@/lib/delivery/cwc';

/**
 * GET /api/admin/compliance
 * The pending pre-send review queue: messages the compliance gate flagged as
 * 'review' and held before delivery. Admin only.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('message_compliance')
    .select(
      'id, message_id, decision, reasons, categories, message_excerpt, legislator_name, created_at, ' +
        'messages ( id, advocate_name, advocate_city, advocate_state, issue_area, issue_subtopic, delivery_status )',
    )
    .eq('decision', 'review')
    .is('reviewed_at', null)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('[admin/compliance] Failed to fetch queue:', error);
    return NextResponse.json({ error: 'Failed to fetch review queue' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * PATCH /api/admin/compliance
 * Approve (→ deliver via CWC) or reject (→ mark blocked, discard body) a held
 * message. Admin only. Body: { complianceId: string, action: 'approve' | 'reject' }.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { complianceId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { complianceId, action } = body;
  if (!complianceId || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: 'complianceId and action (approve|reject) required' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: verdictData, error: vErr } = await admin
    .from('message_compliance')
    .select('id, message_id, reviewed_at')
    .eq('id', complianceId)
    .single();
  const verdict = verdictData as { id: string; message_id: string | null; reviewed_at: string | null } | null;
  if (vErr || !verdict) {
    return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
  }
  if (verdict.reviewed_at) {
    return NextResponse.json({ error: 'This item has already been reviewed.' }, { status: 409 });
  }

  const stamp = {
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    review_decision: action === 'approve' ? 'approved' : 'rejected',
  };

  // --- REJECT: mark blocked, discard the held body ---
  if (action === 'reject') {
    if (verdict.message_id) {
      await admin
        .from('messages')
        // Discard the held body + retained street/zip on rejection (privacy).
        .update({
          delivery_status: 'blocked',
          message_body: '',
          advocate_street: null,
          advocate_zip: null,
          cwc_status: 'error',
          cwc_error: 'rejected in review',
        })
        .eq('id', verdict.message_id);
    }
    await admin.from('message_compliance').update(stamp).eq('id', complianceId);
    return NextResponse.json({ complianceId, action: 'reject', status: 'blocked' });
  }

  // --- APPROVE: deliver the held message via CWC ---
  if (!verdict.message_id) {
    return NextResponse.json({ error: 'No message associated with this review item.' }, { status: 400 });
  }

  const { data: msgData, error: mErr } = await admin
    .from('messages')
    .select(
      'id, advocate_name, advocate_email, advocate_street, advocate_city, advocate_state, advocate_zip, ' +
        'advocate_district, legislator_id, legislator_name, issue_area, issue_subtopic, message_body, campaign_id, delivery_status',
    )
    .eq('id', verdict.message_id)
    .single();
  const msg = msgData as {
    id: string;
    advocate_name: string;
    advocate_email: string | null;
    advocate_street: string | null;
    advocate_city: string;
    advocate_state: string;
    advocate_zip: string | null;
    advocate_district: string | null;
    legislator_id: string;
    legislator_name: string;
    issue_area: string;
    issue_subtopic: string;
    message_body: string;
    campaign_id: string | null;
    delivery_status: string;
  } | null;

  if (mErr || !msg) {
    return NextResponse.json({ error: 'Held message not found' }, { status: 404 });
  }
  if (msg.delivery_status !== 'pending_review') {
    return NextResponse.json({ error: `Message is not pending review (status: ${msg.delivery_status}).` }, { status: 409 });
  }

  // Street + ZIP were retained on the held row precisely so we can deliver now.
  const result = await submitToCWC({
    office: msg.legislator_id,
    sender: {
      name: msg.advocate_name,
      email: msg.advocate_email ?? '',
      street: msg.advocate_street ?? '',
      city: msg.advocate_city,
      state: msg.advocate_state,
      zip: msg.advocate_zip ?? '',
    },
    topic: msg.issue_subtopic || msg.issue_area,
    messageBody: msg.message_body,
    campaignId: msg.campaign_id ?? undefined,
  });

  await admin
    .from('messages')
    .update({
      delivery_status: result.ok ? 'sent' : 'error',
      cwc_status: result.status,
      cwc_message_id: result.cwcMessageId ?? null,
      cwc_error: result.ok ? null : `${result.errorCode ?? ''}: ${result.errorMessage ?? ''}`.trim(),
      // Delivered (or hard-failed) — drop the retained street/zip either way.
      advocate_street: null,
      advocate_zip: null,
    })
    .eq('id', msg.id);

  await admin.from('message_compliance').update(stamp).eq('id', complianceId);

  return NextResponse.json({
    complianceId,
    action: 'approve',
    delivered: result.ok,
    error: result.ok ? undefined : result.errorMessage,
  });
}
