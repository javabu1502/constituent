/**
 * Reposter — trusted-source amplification. A repost puts someone else's post in
 * front of our audience UNDER OUR BRAND, so unlike a like it carries real
 * neutrality/accuracy risk. We manage that two ways:
 *
 *   1. Source allowlist of SELF-AUTHENTICATING domain handles. A Bluesky domain
 *      handle (e.g. "govtrack.us") proves DNS control of that domain, so it can
 *      only be the real organization — no squatter risk, no guessing. Handles
 *      that don't resolve (org not on Bluesky, or uses a different handle) are
 *      simply skipped.
 *   2. Per-post neutrality gate: even a trusted source's occasional pointed post
 *      is dropped (isPartisan / skip discipline) before we amplify it.
 *
 * Conservative by design: a low per-run cap, one post per source, recent posts
 * only, and full dedup. Honors SOCIAL_DRY_RUN and the killswitch.
 */
import { createAdminClient } from '@/lib/supabase';
import { getKillSwitch } from './config';
import { resolveHandle, getAuthorFeed, repost, type BlueskySession } from './bluesky';
import { isPartisan, replyShouldSkip } from './guardrails';

// Nonpartisan civic-info organizations, addressed by their official domain
// handle so resolution alone proves authenticity. Curated for the mission:
// legislative tracking, public-affairs, elections/voter info, government data.
const TRUSTED_SOURCES = [
  'govtrack.us', // nonpartisan legislative tracking
  'cspan.org', // public-affairs coverage
  'ballotpedia.org', // nonpartisan elections encyclopedia
  'usafacts.org', // nonpartisan government data
  'pewresearch.org', // nonpartisan research
  'ncsl.org', // National Conference of State Legislatures
  'lwv.org', // League of Women Voters (voter info)
  'vote.org', // nonpartisan voter registration/info
];

const REPOST_CAP = 2; // per run — amplification stays deliberately rare
const FRESH_HOURS = 36; // only reshare genuinely recent posts
const MIN_LEN = 40; // skip one-liners / link-only cards

export interface ReposterResult {
  reposted: number;
  scanned: number;
  resolvedSources: number;
  skipped: 'paused' | null;
}

export async function runReposter(session: BlueskySession, opts: { maxPerRun?: number } = {}): Promise<ReposterResult> {
  const cap = opts.maxPerRun ?? REPOST_CAP;
  const result: ReposterResult = { reposted: 0, scanned: 0, resolvedSources: 0, skipped: null };

  const kill = await getKillSwitch();
  if (kill.is_paused) return { ...result, skipped: 'paused' };

  const dryRun = process.env.SOCIAL_DRY_RUN === 'true';
  const cutoff = Date.now() - FRESH_HOURS * 60 * 60_000;

  // One newest qualifying post per resolved trusted source.
  const candidates: Array<{ uri: string; cid: string; text: string; source: string }> = [];
  for (const handle of TRUSTED_SOURCES) {
    const did = await resolveHandle(handle);
    if (!did) continue; // org not on Bluesky under this domain — skip, never guess
    result.resolvedSources++;
    let feed;
    try {
      feed = await getAuthorFeed(session, did, 10);
    } catch {
      continue;
    }
    for (const p of feed) {
      if (!p.uri || !p.cid) continue;
      if (p.text.trim().length < MIN_LEN) continue;
      if (p.indexedAt && new Date(p.indexedAt).getTime() < cutoff) continue;
      if (isPartisan(p.text) || replyShouldSkip(p.text).skip) continue;
      candidates.push({ uri: p.uri, cid: p.cid, text: p.text, source: handle });
      break; // newest qualifying only — don't flood from one source
    }
  }
  result.scanned = candidates.length;
  if (!candidates.length) return result;

  // Dedup: never repost something we've reposted before.
  const admin = createAdminClient();
  const uris = candidates.map((c) => c.uri);
  const { data: existing } = await admin.from('social_posts').select('link_url').eq('lane', 'repost').in('link_url', uris);
  const have = new Set((existing ?? []).map((r) => r.link_url));

  for (const c of candidates) {
    if (result.reposted >= cap) break;
    if (have.has(c.uri)) continue;
    try {
      let externalId: string | undefined;
      if (!dryRun) {
        const res = await repost(session, { uri: c.uri, cid: c.cid });
        externalId = res.uri;
      }
      await admin.from('social_posts').insert({
        platform: 'bluesky',
        lane: 'repost',
        body: `↻ @${c.source}: ${c.text.slice(0, 200)}`,
        link_url: c.uri,
        content_hash: `repost:${c.uri}`,
        status: 'posted',
        dry_run: dryRun,
        external_post_id: externalId,
        guardrail_report: { repostOf: c.source, sourceText: c.text.slice(0, 280) },
      });
      result.reposted++;
    } catch {
      /* transient — try the next */
    }
  }
  return result;
}
