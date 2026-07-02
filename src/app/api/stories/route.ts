import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { submitStorySchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { hashIp } from '@/lib/usage-quota';
import { applyAttribution } from '@/lib/story-attribution';
import { deDash } from '@/lib/claude';

/**
 * POST /api/stories
 * Submit a story to a storytelling campaign.
 *
 * Flow:
 *   1. Validate consent + attribution.
 *   2. Enforce the chosen attribution on our end (named / first-name / anonymous).
 *   3. Increment the campaign's running story_count.
 *   4. Store a short, scrubbed topic title in `story_subjects` (aggregate view).
 *   5. Persist the story to the campaign organizer's dashboard (store-by-default;
 *      the storyteller can opt out with `store: false`). Identity is saved ONLY at
 *      the attribution level chosen — anonymous stories carry no name/contact/city.
 *   6. Return the attribution-applied body so the storyteller can also email it
 *      to the campaign from their own client.
 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Keep a topical title only; strip the storyteller's name and dashes. */
function sanitizeTitle(title: string | null | undefined, name: string | null | undefined): string {
  let t = deDash((title || '').trim());
  const nm = (name || '').trim();
  if (nm && t) {
    for (const part of [nm, nm.split(/\s+/)[0]].filter(Boolean)) {
      t = t.replace(new RegExp(`\\b${escapeRegExp(part)}(?:['’]s)?\\b`, 'gi'), '').trim();
    }
    t = t.replace(/\s{2,}/g, ' ').replace(/^[\s,–—-]+|[\s,]+$/g, '').trim();
  }
  return t.slice(0, 120);
}

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

  const {
    campaignSlug,
    title,
    body,
    attribution_level,
    storyteller_name,
    granted_uses,
    store,
    city,
    state,
    storyteller_email,
  } = parsed.data;

  const admin = createAdminClient();
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id, slug, headline, recipient_email, approval_status, campaign_type, usage_statement')
    .eq('slug', campaignSlug)
    .eq('approval_status', 'approved')
    .eq('campaign_type', 'storytelling')
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Resolve the storyteller identity: signed-in user (if any) + a hashed IP for
  // anonymous submissions. Used for the "my stories" dashboard and abuse-tracing.
  let userId: string | null = null;
  let userEmail: string | null = null;
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    userId = user?.id ?? null;
    userEmail = user?.email ?? null;
  } catch {
    // anonymous
  }
  const ipHash = userId ? null : hashIp(ip);

  // Attribution is entirely the storyteller's choice (any of the three levels).
  // Enforce it on our end before the story ever leaves us. de-dash so the sent
  // text reads like a person wrote it (the anonymous redaction pass can add them).
  const applied = await applyAttribution(body, attribution_level, storyteller_name);
  const final_body = deDash(applied.final_body);
  const flagged = applied.flagged;

  // Running count.
  const { error: rpcError } = await admin.rpc('increment_campaign_story_count', {
    campaign_slug: campaignSlug,
  });
  if (rpcError) {
    console.error('[stories] story-count RPC error:', rpcError);
  }

  // Store a short, scrubbed topic title in the aggregate subjects view.
  const subjectTitle = sanitizeTitle(title, storyteller_name);
  if (subjectTitle) {
    const { error: subjectError } = await admin
      .from('story_subjects')
      .insert({ campaign_id: campaign.id, title: subjectTitle });
    if (subjectError) {
      console.error('[stories] subject insert error:', subjectError);
    }
  }

  // Persist the full story to the campaign organizer's dashboard (store-by-default).
  // Identity is written ONLY at the chosen attribution level — anonymous stories
  // carry no name, contact, or location.
  if (store !== false) {
    const isAnon = attribution_level === 'anonymous';
    const trimmedName = (storyteller_name || '').trim();
    const nameToStore = isAnon
      ? null
      : attribution_level === 'first_name_only'
        ? trimmedName.split(/\s+/)[0] || null
        : trimmedName || null;

    const { error: storyError } = await admin.from('stories').insert({
      campaign_id: campaign.id,
      user_id: userId,
      ip_hash: ipHash,
      // Body is the attribution-applied version — anonymous bodies are redacted.
      body: final_body,
      // For anonymous, store the name-scrubbed topic title; otherwise the AI title.
      title: isAnon ? subjectTitle || null : title ? deDash(title).slice(0, 120) : null,
      attribution_level,
      storyteller_name: nameToStore,
      storyteller_email: isAnon ? null : storyteller_email?.trim() || userEmail || null,
      city: isAnon ? null : city?.trim() || null,
      state: isAnon ? null : state?.trim() || null,
      consent_usage_snapshot: {
        usage_statement: campaign.usage_statement ?? null,
        granted_uses,
      },
      status: 'active',
    });
    if (storyError) {
      console.error('[stories] story insert error:', storyError);
    }
  }

  return NextResponse.json({
    success: true,
    final_body,
    flagged,
    recipient_email: campaign.recipient_email ?? null,
    subject: `My story for: ${campaign.headline}`,
  });
}
