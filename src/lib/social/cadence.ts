/**
 * Human cadence. Keeps the account from posting like a machine: a daily volume
 * cap and a minimum gap between posts. Vercel cron fires at fixed times, so the
 * spacing/jitter discipline lives here rather than in the schedule.
 */
import { createAdminClient } from '@/lib/supabase';

export const MAX_POSTS_PER_DAY = 8;
export const MIN_GAP_MINUTES = 45;

export interface CadenceDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Pure cadence check against a list of prior post timestamps (ms). Testable.
 */
export function canPost(
  postedAtMs: number[],
  nowMs: number,
  opts: { maxPerDay?: number; minGapMinutes?: number } = {},
): CadenceDecision {
  const maxPerDay = opts.maxPerDay ?? MAX_POSTS_PER_DAY;
  const minGap = (opts.minGapMinutes ?? MIN_GAP_MINUTES) * 60_000;
  const dayAgo = nowMs - 24 * 60 * 60_000;

  const inLastDay = postedAtMs.filter((t) => t >= dayAgo);
  if (inLastDay.length >= maxPerDay) {
    return { allowed: false, reason: `daily cap reached (${inLastDay.length}/${maxPerDay})` };
  }
  const last = postedAtMs.length ? Math.max(...postedAtMs) : 0;
  if (last && nowMs - last < minGap) {
    const mins = Math.ceil((minGap - (nowMs - last)) / 60_000);
    return { allowed: false, reason: `too soon (${mins}m until next allowed)` };
  }
  return { allowed: true };
}

export const MAX_REPLIES_PER_DAY = 12;
export const MIN_REPLY_GAP_MINUTES = 10;

/** DB-backed cadence check for a platform. */
export async function canPostNow(platform: string): Promise<CadenceDecision> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { data } = await admin
    .from('social_posts')
    .select('posted_at')
    .eq('platform', platform)
    .eq('status', 'posted')
    .gte('posted_at', since);
  const times = (data ?? [])
    .map((r) => (r.posted_at ? new Date(r.posted_at as string).getTime() : 0))
    .filter(Boolean);
  return canPost(times, Date.now());
}

/** DB-backed reply cadence (separate, tighter cap than original posts). */
export async function canReplyNow(): Promise<CadenceDecision> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { data } = await admin
    .from('social_replies')
    .select('posted_at')
    .eq('status', 'posted')
    .gte('posted_at', since);
  const times = (data ?? [])
    .map((r) => (r.posted_at ? new Date(r.posted_at as string).getTime() : 0))
    .filter(Boolean);
  return canPost(times, Date.now(), { maxPerDay: MAX_REPLIES_PER_DAY, minGapMinutes: MIN_REPLY_GAP_MINUTES });
}
