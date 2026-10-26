import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isCampaignClosed } from '@/lib/campaign-close';
import { createClient } from '@/lib/supabase/server';
import { submitStorySchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { enforceDailyQuota, hashIp, resolveUsageIdentity } from '@/lib/usage-quota';
import { verifyTurnstile } from '@/lib/turnstile';
import { storyRevokeToken } from '@/lib/story-revoke';
import { applyAttribution, type AttributionResult } from '@/lib/story-attribution';
import { deDash } from '@/lib/claude';
import { renderStoryEnglish } from '@/lib/language';

// Redaction plus translation can run past the default function limit.
export const maxDuration = 60;

/** Stories one campaign may receive in a day. A durable backstop against a
 *  script that rotates addresses past the per-IP quota; real collection
 *  sessions are tens of stories, not hundreds. */
const CAMPAIGN_DAILY_STORY_CEILING = 500;

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

/** Replace any name the storyteller typed with a neutral phrase. Pure string
 *  work, no model; used when the model redaction already ran at preview. */
function stripName(body: string, name: string | null | undefined): string {
  const nm = (name || '').trim();
  let out = body.trim();
  if (!nm) return out;
  for (const part of [nm, ...nm.split(/\s+/)].filter((p) => p.length >= 2)) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(part)}(?:['’]s)?\\b`, 'gi'), 'a community member');
  }
  return out;
}

/**
 * Proof that an anonymous story went through the redaction preview.
 *
 * `preview_confirmed` is a claim made by the browser, and this route is
 * public and unauthenticated. On its own it meant one POST with
 * `attribution_level: 'anonymous'` and `preview_confirmed: true` stored the
 * body verbatim and labelled it anonymous, with nothing on the server
 * showing a redaction pass had ever run. The named backstop could not catch
 * it either: the client sends no name for an anonymous story, so the
 * deterministic strip had nothing to strip.
 *
 * So the preview step now returns a token over the text it produced, and the
 * store step honours `preview_confirmed` only if that token verifies. The
 * token is scoped to the campaign and to the previewed text, so it cannot be
 * replayed against another campaign. A hand-edit is still accepted: the
 * token proves the preview happened, which is the part the server cannot
 * otherwise know, and re-running the model would discard the edits the
 * storyteller just made.
 */
function previewSecret(): string {
  return process.env.STORY_PREVIEW_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.IP_HASH_SALT || '';
}

function previewToken(campaignId: string, previewedBody: string): string {
  return createHmac('sha256', previewSecret())
    .update(`${campaignId}:${previewedBody.trim()}`)
    .digest('hex')
    .slice(0, 32);
}

function previewTokenValid(token: unknown, campaignId: string, previewedBody: string): boolean {
  if (typeof token !== 'string' || token.length !== 32) return false;
  const expected = previewToken(campaignId, previewedBody);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
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
    shared_reps,
    preview,
    preview_confirmed,
    preview_token,
    previewed_body,
    turnstileToken,
  } = parsed.data;

  const identity = await resolveUsageIdentity(ip);
  // Durable per-identity cap (no CAPTCHA on this flow since 10-15). Counts
  // preview and store alike; sized for a room on one Wi-Fi, not a person.
  const { allowed: quotaOk } = await enforceDailyQuota(ip, 'story_submit', identity);
  if (!quotaOk) {
    return NextResponse.json({ error: 'Daily story limit reached. Try again tomorrow.' }, { status: 429 });
  }
  if (process.env.TURNSTILE_SECRET_KEY) {
    // Storytelling is lenient on a MISSING token: an organization's testers hit
    // "CAPTCHA verification failed" on 2026-10-09 because their network never
    // produced a Turnstile token. These routes are rate limited per IP and
    // daily-quota'd, and the org reviews every story, so a missing token is
    // allowed; a token that is present but invalid is still rejected.
    const valid = await verifyTurnstile(turnstileToken || '', { strict: false });
    if (!valid) return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id, slug, headline, recipient_email, approval_status, status, campaign_type, usage_statement')
    .eq('slug', campaignSlug)
    .eq('approval_status', 'approved')
    .eq('campaign_type', 'storytelling')
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // A closed campaign stops collecting. The advocacy participate route
  // already required an active campaign; stories never checked, so a page
  // left open in a tab could still write to a campaign that had ended.
  if (isCampaignClosed(campaign.status)) {
    return NextResponse.json(
      { error: 'This campaign is closed and is no longer collecting stories.' },
      { status: 409 }
    );
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
  //
  // Anonymous + preview_confirmed: the body IS the redacted text the
  // storyteller just reviewed (and may have hand-edited) on the preview step.
  // It is stored exactly as given; a second model pass would change it and
  // throw away their edits (confirmed live, 2026-10-23). Only the
  // deterministic safety checks run: strip any name they typed, and de-dash.
  //
  // `preview_confirmed` alone is not enough: it is a claim from the browser,
  // and this route is public. `preview_token` is the server's own evidence
  // that the redaction pass ran on this campaign's preview step. Without a
  // valid one, the full redaction pass runs here instead.
  const previewProven =
    preview_confirmed === true && previewTokenValid(preview_token, campaign.id as string, previewed_body ?? body);
  const confirmedAnonymous = attribution_level === 'anonymous' && previewProven && !preview;
  const applied: AttributionResult = confirmedAnonymous
    ? { final_body: stripName(body, storyteller_name), flagged: [] }
    : await applyAttribution(body, attribution_level, storyteller_name);
  const final_body = deDash(applied.final_body);
  const flagged = applied.flagged;

  // An anonymous story is never stored unless the redaction pass actually ran.
  if (attribution_level === 'anonymous' && applied.failed) {
    return NextResponse.json(
      { error: 'We could not anonymize your story just now, so nothing was saved. Please try again in a moment.' },
      { status: 503 },
    );
  }

  // Preview: show the storyteller exactly what the organization will receive
  // (anonymous redaction applied), without saving anything.
  if (preview) {
    // The token travels with the previewed text. The store step replays it to
    // prove this story passed through redaction.
    return NextResponse.json({
      preview: true,
      final_body,
      flagged,
      preview_token: previewToken(campaign.id as string, final_body),
    });
  }

  // Store a short, scrubbed topic title in the aggregate subjects view.
  //
  // An anonymous story's title never went through the anonymization pass.
  // `sanitizeTitle` strips the name the storyteller typed, and an anonymous
  // story sends no name, so for those rows it did nothing but remove dashes.
  // A title like "My son Diego's wait at the clinic" was then stored on an
  // anonymous row, exported with no masking, and copied into `story_subjects`
  // where it is shown in aggregate. The redaction prompt is explicitly
  // responsible for third parties, so the title goes through it too; if that
  // pass cannot run, the title is dropped rather than stored unredacted.
  let subjectTitle = sanitizeTitle(title, storyteller_name);
  if (attribution_level === 'anonymous' && subjectTitle) {
    const titlePass = await applyAttribution(subjectTitle, 'anonymous', storyteller_name);
    subjectTitle = titlePass.failed ? '' : sanitizeTitle(titlePass.final_body, storyteller_name);
  }
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
  let storyId: string | null = null;
  if (store !== false) {
    // Per-campaign daily ceiling. Fails open on a query error so an
    // infrastructure hiccup never blocks a real storyteller.
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count, error: countError } = await admin
        .from('stories')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .gte('created_at', startOfDay.toISOString());
      if (!countError && typeof count === 'number' && count >= CAMPAIGN_DAILY_STORY_CEILING) {
        console.warn('[stories] campaign daily ceiling reached:', campaignSlug, count);
        return NextResponse.json({ error: 'This campaign has received as many stories as it can take today. Please try again tomorrow.' }, { status: 429 });
      }
    } catch (err) {
      console.error('[stories] campaign ceiling check failed:', err);
    }

    const isAnon = attribution_level === 'anonymous';
    const trimmedName = (storyteller_name || '').trim();
    const nameToStore = isAnon
      ? null
      : attribution_level === 'first_name_only'
        ? trimmedName.split(/\s+/)[0] || null
        : trimmedName || null;

    // Share the storyteller's email with the collector ONLY if they granted the
    // "They may contact me about it" use (and aren't anonymous). Otherwise never.
    // Only an address the storyteller typed. Never the account email by default.
    const canContact = !isAnon && granted_uses.includes('contact_me_followup');
    const emailToStore = canContact ? storyteller_email?.trim() || null : null;
    void userEmail;

    // Spanish stories get an English rendering for the organization. The
    // body itself stays in the storyteller's language.
    const rendered = await renderStoryEnglish(final_body);

    const { data: inserted, error: storyError } = await admin.from('stories').insert({
      campaign_id: campaign.id,
      user_id: userId,
      ip_hash: ipHash,
      // Body is the attribution-applied version — anonymous bodies are redacted.
      body: final_body,
      language: rendered.language,
      body_en: rendered.body_en,
      // For anonymous, store the name-scrubbed topic title; otherwise the AI title.
      title: isAnon ? subjectTitle || null : title ? deDash(title).slice(0, 120) : null,
      attribution_level,
      storyteller_name: nameToStore,
      storyteller_email: emailToStore,
      city: isAnon ? null : city?.trim() || null,
      state: isAnon ? null : state?.trim() || null,
      shared_reps: isAnon ? null : shared_reps?.length ? shared_reps : null,
      consent_usage_snapshot: {
        usage_statement: campaign.usage_statement ?? null,
        granted_uses,
        consent_usage: true,
        consent_adult: true,
        consented_at: new Date().toISOString(),
      },
      status: 'active',
    }).select('id').single();
    if (storyError) {
      console.error('[stories] story insert error:', storyError);
      return NextResponse.json({ error: 'Could not save your story. Please try again.' }, { status: 500 });
    }
    storyId = (inserted?.id as string) ?? null;

    // Running count, only once the story is actually saved (a failed insert
    // used to leave the count one too high; audit 2026-10-23).
    const { error: rpcError } = await admin.rpc('increment_campaign_story_count', { campaign_slug: campaignSlug });
    if (rpcError) console.error('[stories] story-count RPC error:', rpcError);
  }

  return NextResponse.json({
    success: true,
    final_body,
    flagged,
    story_id: storyId,
    // Lets a guest withdraw the story later without an account.
    revoke_token: storyId ? storyRevokeToken(storyId) : null,
    signed_in: !!userId,
  });
}
