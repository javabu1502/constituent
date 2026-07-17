import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { campaignParticipateSchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { resolveUsageIdentity } from '@/lib/usage-quota';

/**
 * POST /api/campaigns/[slug]/participate
 * Record a participation action (public, no auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(request);
  const { success, retryAfter } = writeLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  const { slug } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseBody(campaignParticipateSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { participant_name, participant_city, participant_state, messages_sent, stance, action_id, turnstileToken } = parsed.data;
  const identity = await resolveUsageIdentity(ip);
  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(turnstileToken || '', { strict: !identity.userId });
    if (!valid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
    }
  }

  const admin = createAdminClient();

  // Look up campaign by slug
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Follow-up engagement: the same participant engaged another official.
  // Each official engaged counts as an action publicly, but stays on the
  // participant's single row (stance was already counted on the insert).
  if (action_id) {
    const { data: existing, error: findError } = await admin
      .from('campaign_actions')
      .select('id, messages_sent')
      .eq('id', action_id)
      .eq('campaign_id', campaign.id)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Mirrors the schema's messages_sent cap
    if ((existing.messages_sent || 0) < 20) {
      const { error: updateError } = await admin
        .from('campaign_actions')
        .update({ messages_sent: (existing.messages_sent || 0) + 1 })
        .eq('id', action_id);

      if (updateError) {
        console.error('[participate] Update error:', updateError);
        return NextResponse.json({ error: 'Failed to record participation' }, { status: 500 });
      }

      const { error: rpcError } = await admin.rpc('increment_campaign_action_count', {
        campaign_slug: slug,
      });
      if (rpcError) {
        console.error('[participate] RPC error:', rpcError);
      }
    }

    return NextResponse.json({ success: true, campaign_id: campaign.id, action_id });
  }

  // Insert campaign action (stance is stored here but never exposed
  // individually — reads go through the service-role client only)
  const { data: inserted, error: actionError } = await admin
    .from('campaign_actions')
    .insert({
      campaign_id: campaign.id,
      participant_name,
      participant_city,
      participant_state,
      messages_sent: messages_sent || 0,
      stance: stance || null,
    })
    .select('id')
    .single();

  if (actionError) {
    console.error('[participate] Insert error:', actionError);
    return NextResponse.json({ error: 'Failed to record participation' }, { status: 500 });
  }

  // Increment action count
  const { error: rpcError } = await admin.rpc('increment_campaign_action_count', {
    campaign_slug: slug,
  });

  if (rpcError) {
    console.error('[participate] RPC error:', rpcError);
  }

  // Roll the stance into the public aggregate counters (atomic RPC)
  if (stance) {
    const { error: stanceRpcError } = await admin.rpc('increment_campaign_stance_count', {
      campaign_slug: slug,
      stance_value: stance,
    });
    if (stanceRpcError) {
      console.error('[participate] stance RPC error:', stanceRpcError);
    }
  }

  return NextResponse.json({ success: true, campaign_id: campaign.id, action_id: inserted?.id ?? null });
}
