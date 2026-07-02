import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { deliverSchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import {
  resolveUsageIdentity,
  enforceDailyQuota,
  checkLegislatorCooldown,
  getRecentMessages,
} from '@/lib/usage-quota';
import { runComplianceCheck, ComplianceVerdict } from '@/lib/compliance/check';
import { submitToCWC, isCWCConfigured } from '@/lib/delivery/cwc';

/**
 * POST /api/deliver
 *
 * Server-side delivery of a constituent message to a congressional office via
 * the official CWC system. Every message passes the pre-send compliance gate
 * first; the verdict is always recorded in `message_compliance` as an audit
 * trail. Outcomes:
 *   - pass   → delivered via CWC, message stored 'sent'          (200)
 *   - review → held, message stored 'pending_review', queued     (202)
 *   - block  → refused, no deliverable row, verdict logged        (422)
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = writeLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const parsed = parseBody(deliverSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;

  // Fail closed if delivery isn't configured for this environment.
  if (!isCWCConfigured()) {
    return NextResponse.json(
      { error: 'Congressional delivery is not available right now.' },
      { status: 503 },
    );
  }

  // Identity is the source of truth — we never trust a client-supplied user_id.
  const identity = await resolveUsageIdentity(ip);
  const verifiedUserId = identity.userId;

  // Bot protection: strict for anonymous senders, lenient for signed-in ones.
  const captchaOk = await verifyTurnstile(body.turnstileToken ?? '', {
    strict: !verifiedUserId,
  });
  if (!captchaOk) {
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 403 });
  }

  // Durable per-identity daily delivery cap.
  const quota = await enforceDailyQuota(ip, 'deliver', identity);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'Daily delivery limit reached. Please try again tomorrow.' },
      { status: 429 },
    );
  }

  // Per-legislator cooldown for signed-in users (prevents spamming one office).
  if (verifiedUserId) {
    const cooldown = await checkLegislatorCooldown(verifiedUserId, body.legislator_id);
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          error: `You already contacted this official on ${cooldown.lastContactDate}. Please wait before sending another message to the same representative.`,
        },
        { status: 429 },
      );
    }
  }

  const supabase = createAdminClient();

  // --- Pre-send compliance gate ---
  const recent = await getRecentMessages(identity);
  const verdict = await runComplianceCheck({
    message: body.message_body,
    topic: body.issue_subtopic || body.issue_area,
    legislatorName: body.legislator_name,
    sender: {
      name: body.advocate_name,
      email: body.advocate_email,
      city: body.advocate_city,
      state: body.advocate_state,
      zip: body.advocate_zip,
      street: body.advocate_street,
    },
    recentMessages: recent.map((m) => ({
      legislatorName: m.legislator_name ?? undefined,
      issueArea: m.issue_area ?? undefined,
      body: m.message_body ?? undefined,
      createdAt: m.created_at,
    })),
  });

  // Shared fields for the messages row on any path that stores one.
  const baseMessage = {
    advocate_name: body.advocate_name,
    advocate_email: body.advocate_email,
    advocate_city: body.advocate_city,
    advocate_state: body.advocate_state,
    advocate_district: body.advocate_district || null,
    legislator_name: body.legislator_name,
    legislator_id: body.legislator_id,
    legislator_party: body.legislator_party,
    legislator_level: body.legislator_level,
    legislator_chamber: body.legislator_chamber,
    issue_area: body.issue_area,
    issue_subtopic: body.issue_subtopic,
    // Delivery requires the body (CWC needs it), so unlike track-send we store
    // it for signed-in users. Anonymous sends keep the body only transiently:
    // it was just delivered, but we do not retain anonymous message text.
    message_body: verifiedUserId ? body.message_body : '',
    delivery_method: 'cwc',
    user_id: verifiedUserId,
    ip_hash: identity.ipHash,
    campaign_id: body.campaign_id || null,
    compliance_decision: verdict.decision,
  };

  // --- BLOCK: never delivered, log the verdict only ---
  if (verdict.decision === 'block') {
    await recordVerdict(supabase, null, verdict, body, identity);
    return NextResponse.json(
      {
        decision: 'block',
        error:
          'This message could not be submitted. Please revise it to be a genuine message from you, with your real name and details, and try again.',
        reasons: verdict.reasons,
      },
      { status: 422 },
    );
  }

  // --- REVIEW: hold for a human, do not deliver yet ---
  if (verdict.decision === 'review') {
    const { data: msg, error } = await supabase
      .from('messages')
      // A held message must retain its body (even for anonymous senders) so a
      // reviewer can approve and deliver it; it's cleared/never-delivered on reject.
      .insert({
        ...baseMessage,
        message_body: body.message_body,
        // Retained ONLY while held, so approval can deliver; cleared on resolve.
        advocate_street: body.advocate_street,
        advocate_zip: body.advocate_zip,
        delivery_status: 'pending_review',
        cwc_status: 'pending',
      })
      .select('id')
      .single();
    if (error) {
      console.error('[deliver] Failed to store pending message:', error);
      return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 });
    }
    await recordVerdict(supabase, msg?.id ?? null, verdict, body, identity);
    return NextResponse.json(
      {
        decision: 'review',
        shareId: msg?.id,
        message:
          'Your message has been received and is undergoing a quick review before delivery. It will be sent to the office shortly.',
      },
      { status: 202 },
    );
  }

  // --- PASS: deliver via CWC ---
  const result = await submitToCWC({
    office: body.legislator_id,
    sender: {
      name: body.advocate_name,
      email: body.advocate_email,
      street: body.advocate_street,
      city: body.advocate_city,
      state: body.advocate_state,
      zip: body.advocate_zip,
      phone: body.advocate_phone,
    },
    topic: body.issue_subtopic || body.issue_area,
    messageBody: body.message_body,
    campaignId: body.campaign_id || undefined,
  });

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      ...baseMessage,
      delivery_status: result.ok ? 'sent' : 'error',
      cwc_status: result.status,
      cwc_message_id: result.cwcMessageId ?? null,
      cwc_error: result.ok ? null : `${result.errorCode ?? ''}: ${result.errorMessage ?? ''}`.trim(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[deliver] Failed to store delivered message:', error);
    // Still record the verdict so the audit trail is complete.
    await recordVerdict(supabase, null, verdict, body, identity);
    return NextResponse.json({ error: 'Failed to record delivery' }, { status: 500 });
  }

  await recordVerdict(supabase, msg?.id ?? null, verdict, body, identity, recent.map((m) => m.id));

  if (!result.ok) {
    return NextResponse.json(
      {
        decision: 'pass',
        delivered: false,
        shareId: msg?.id,
        error: 'We could not reach the congressional office just now. Please try again shortly.',
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ decision: 'pass', delivered: true, success: true, shareId: msg?.id });
}

/** Persist a compliance verdict to the audit trail. Best-effort; never throws. */
async function recordVerdict(
  supabase: ReturnType<typeof createAdminClient>,
  messageId: string | null,
  verdict: ComplianceVerdict,
  body: { message_body: string; legislator_name: string; user_id?: string },
  identity: { userId: string | null; ipHash: string | null },
  recentIds: string[] = [],
): Promise<void> {
  const { error } = await supabase.from('message_compliance').insert({
    message_id: messageId,
    user_id: identity.userId,
    ip_hash: identity.ipHash,
    decision: verdict.decision,
    reasons: verdict.reasons,
    categories: verdict.categories,
    message_excerpt: body.message_body.slice(0, 500),
    legislator_name: body.legislator_name,
    recent_message_ids: recentIds,
    model: verdict.model,
    prompt_version: verdict.promptVersion,
    raw_verdict: verdict,
  });
  if (error) {
    console.error('[deliver] Failed to record compliance verdict:', error);
  }
}
