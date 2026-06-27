import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { submitStorySchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { applyAttribution } from '@/lib/story-attribution';
import { deDash } from '@/lib/claude';

/**
 * POST /api/stories
 * Submit a story to a storytelling campaign.
 *
 * We never store the story itself — not even for signed-in users. We only:
 *   1. Validate consent + attribution.
 *   2. Enforce the chosen attribution on our end (named / first-name / anonymous).
 *   3. Increment the campaign's running story_count.
 *   4. Store ONLY a short, scrubbed title ("subject") — never the body, the name,
 *      or who wrote it — so a creator can see what subjects came in.
 *   5. Return the attribution-applied body so the storyteller can email it to the
 *      campaign from their own client. Their own sent email is their record of it.
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

  const { campaignSlug, title, body, attribution_level, storyteller_name } = parsed.data;

  const admin = createAdminClient();
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id, slug, headline, recipient_email, approval_status, campaign_type')
    .eq('slug', campaignSlug)
    .eq('approval_status', 'approved')
    .eq('campaign_type', 'storytelling')
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

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

  // Store ONLY a short, scrubbed title — no body, no name, no link to the person.
  const subjectTitle = sanitizeTitle(title, storyteller_name);
  if (subjectTitle) {
    const { error: subjectError } = await admin
      .from('story_subjects')
      .insert({ campaign_id: campaign.id, title: subjectTitle });
    if (subjectError) {
      console.error('[stories] subject insert error:', subjectError);
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
