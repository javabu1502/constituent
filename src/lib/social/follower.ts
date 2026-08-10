/**
 * Follower — network growth. The account was following 0 accounts and posting
 * into the void (10 followers, ~0 engagement after 249 posts). Broadcasting
 * alone doesn't grow on Bluesky; participating does. This follows, on each run:
 *   1. Everyone who follows us that we don't follow back (reciprocal, safe).
 *   2. The real people we've actually replied to (social_replies status=posted) —
 *      civic-minded folks we've had an exchange with, so our following stays
 *      relevant and neutral (we never cold-follow partisan targets).
 * Capped per run, killswitch-aware, and skips anyone we already follow.
 */
import { createAdminClient } from '@/lib/supabase';
import { getKillSwitch } from './config';
import { follow, getFollowing, getFollowers, resolveHandle, type BlueskySession } from './bluesky';

const OWN_HANDLE = process.env.BLUESKY_HANDLE ?? '';

export interface FollowerResult {
  followed: number;
  followedBack: number;
  followedEngaged: number;
  scanned: number;
  skipped: 'paused' | null;
}

export async function runFollower(session: BlueskySession, opts: { maxPerRun?: number } = {}): Promise<FollowerResult> {
  const cap = opts.maxPerRun ?? 20;
  const result: FollowerResult = { followed: 0, followedBack: 0, followedEngaged: 0, scanned: 0, skipped: null };

  const kill = await getKillSwitch();
  if (kill.is_paused) return { ...result, skipped: 'paused' };

  const following = await getFollowing(session);

  // 1. Follow-back — reciprocal, unambiguously safe.
  const followers = await getFollowers(session).catch(() => []);
  for (const f of followers) {
    if (result.followed >= cap) break;
    if (!f.did || f.did === session.did || following.has(f.did)) continue;
    try {
      await follow(session, f.did);
      following.add(f.did);
      result.followed++;
      result.followedBack++;
    } catch { /* transient — try next */ }
  }

  // 2. People we've genuinely replied to (posted), newest first.
  const admin = createAdminClient();
  const { data: replied } = await admin
    .from('social_replies')
    .select('target_author')
    .eq('status', 'posted')
    .order('created_at', { ascending: false })
    .limit(100);
  const handles = [...new Set((replied ?? []).map((r) => r.target_author as string).filter((h) => h && h !== OWN_HANDLE))];

  for (const h of handles) {
    if (result.followed >= cap) break;
    result.scanned++;
    const did = await resolveHandle(h);
    if (!did || following.has(did)) continue;
    try {
      await follow(session, did);
      following.add(did);
      result.followed++;
      result.followedEngaged++;
    } catch { /* transient — try next */ }
  }

  return result;
}
