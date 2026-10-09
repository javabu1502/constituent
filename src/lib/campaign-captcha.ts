/**
 * Where the CAPTCHA applies (Jared, 2026-10-09): the bot check stays ON for
 * the general website (contact flow, official weigh-ins, tools) and comes
 * OFF for an organization's own campaigns, whose supporters arrive from the
 * org's link and whose offices sometimes sit on networks that never produce
 * a Turnstile token. Signed-in users are always lenient.
 *
 * "Lenient" means a MISSING token is allowed; a token that is present but
 * invalid is still rejected by verifyTurnstile. Rate limits, daily quotas,
 * and the CWC compliance gate apply either way.
 */
import { createAdminClient } from './supabase';

/**
 * Whether the CAPTCHA check should be strict for this request: true for an
 * anonymous request that is not on an organization's campaign.
 */
export async function captchaStrictFor(opts: {
  userId: string | null | undefined;
  campaignSlug?: string | null;
  campaignId?: string | null;
}): Promise<boolean> {
  if (opts.userId) return false;
  if (!opts.campaignSlug && !opts.campaignId) return true;
  try {
    const admin = createAdminClient();
    let q = admin.from('campaigns').select('is_official').limit(1);
    q = opts.campaignId ? q.eq('id', opts.campaignId) : q.eq('slug', opts.campaignSlug as string);
    const { data } = await q.maybeSingle();
    // Unknown campaign: fall back to strict; the route will 404 anyway.
    if (!data) return true;
    return data.is_official === true;
  } catch {
    return true;
  }
}
