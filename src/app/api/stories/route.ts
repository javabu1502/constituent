import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { submitStorySchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { applyAttribution } from '@/lib/story-attribution';

/**
 * POST /api/stories
 * Submit a story to a storytelling campaign.
 *
 * Pipeline:
 *   1. Validate consent + attribution.
 *   2. Enforce the chosen attribution on our end (named / first-name / anonymous).
 *   3. Always increment the campaign's running story_count.
 *   4. Persist the story ONLY for a logged-in storyteller (with a consent
 *      snapshot). Anonymous-of-account submissions are counted, never stored.
 *   5. Return the attribution-applied body so the storyteller can email it to
 *      the campaign from their own client (we never send on their behalf).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = writeLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseBody(submitStorySchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { campaignSlug, title, body, attribution_level, storyteller_name, granted_uses } = parsed.data;

  // Optional auth — drives whether we persist the story.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id, slug, headline, usage_statement, recipient_email, approval_status, campaign_type')
    .eq('slug', campaignSlug)
    .eq('approval_status', 'approved')
    .eq('campaign_type', 'storytelling')
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Attribution is entirely the storyteller's choice (any of the three levels).
  // Enforce it on our end before the story ever leaves us.
  const { final_body, flagged } = await applyAttribution(body, attribution_level, storyteller_name);

  // Always count the submission.
  const { error: rpcError } = await admin.rpc('increment_campaign_story_count', {
    campaign_slug: campaignSlug,
  });
  if (rpcError) {
    console.error('[stories] story-count RPC error:', rpcError);
  }

  // Persist only for logged-in storytellers, with a consent snapshot.
  let persisted = false;
  if (user) {
    const { error: insertError } = await admin.from('stories').insert({
      campaign_id: campaign.id,
      user_id: user.id,
      title: title || null,
      body: final_body,
      attribution_level,
      consent_usage_snapshot: {
        usage_statement: campaign.usage_statement ?? null,
        granted_uses,
      },
      status: 'active',
    });
    if (insertError) {
      console.error('[stories] Insert error:', insertError);
    } else {
      persisted = true;
    }
  }

  return NextResponse.json({
    success: true,
    persisted,
    final_body,
    flagged,
    recipient_email: campaign.recipient_email ?? null,
    subject: `My story for: ${campaign.headline}`,
  });
}
