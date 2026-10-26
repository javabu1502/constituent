import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

/** Daily AI generation limits by action type (per user, or per anonymous IP). */
// Per-IP. A conference room, a school, or an office shares one address, so
// these must hold for a crowd, not a person (Children's Cabinet session,
// 2026-10-16: 30 people on one Wi-Fi would have hit chat:50 in minutes).
const DAILY_LIMITS: Record<string, number> = {
  generate_message: 60,
  generate_follow_up: 10,
  generate_comment: 10,
  research: 15,
  bill_summary: 15,
  chat: 600,
  // Story preview + store on POST /api/stories. No CAPTCHA on that flow since
  // 10-15, so this is the one durable cap on a script flooding a campaign.
  story_submit: 60,
};

/** Minimum days between messages to the same legislator */
const LEGISLATOR_COOLDOWN_DAYS = 7;

/**
 * How many messages one sender may deliver to one congressional office in a
 * day, through CWC or an office's own web form.
 *
 * The 7-day legislator cooldown above only ever ran for signed-in users, so
 * the whole anonymous campaign flow had no per-office limit at all. The
 * delivery dedupe does not close that: it keys on the exact body, so adding
 * a character produces a new key and a genuinely new delivery. One script
 * could have put 40 messages a minute into a single office under our vendor
 * name, which is the fastest way to lose an office's trust.
 *
 * This is deliberately a daily cap and not the 7-day cooldown. A campaign
 * runs in stages and asks supporters to act again when a bill moves, often
 * within the week, so a week-long block would break ordinary participation
 * to stop something nobody is doing. Three in a day leaves room to correct
 * and resend, and leaves none to flood.
 *
 * Counted per office, so writing to both senators and a representative on
 * the same day is three separate allowances, not one.
 */
export const OFFICE_SEND_DAILY_LIMIT = 3;
const OFFICE_SEND_PREFIX = 'office_send:';

/** The quota bucket for one official. One legislator is one office. */
export function officeSendAction(officialId: string): string {
  return `${OFFICE_SEND_PREFIX}${officialId}`;
}

/**
 * Who a usage event is attributed to. Exactly one field is set:
 * a logged-in user, or a hashed client IP for anonymous traffic.
 */
export interface UsageIdentity {
  userId: string | null;
  ipHash: string | null;
}

/** Hash a client IP so we never store raw addresses (privacy). */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? '';
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 32);
}

/**
 * Hash a sender's email for rate limiting, so the limit can count a person
 * without the counter holding their address.
 *
 * The sender, not the network. A classroom, a office or a conference room
 * shares one IP, and four students writing to the same three senators from
 * one lecture hall is exactly what this product is for. Counting by address
 * would have stopped them and let a script with forty addresses through.
 */
export function hashSender(email: string): string {
  const salt = process.env.IP_HASH_SALT ?? '';
  return createHash('sha256').update(`sender:${email.trim().toLowerCase()}:${salt}`).digest('hex').slice(0, 32);
}

/**
 * Durable per-sender, per-office cap on messages delivered to a
 * congressional office. Returns what happened rather than throwing.
 *
 * Fails OPEN on a database error, like every other quota here: an
 * infrastructure hiccup must not stop a constituent writing to their
 * representative. The compliance gate still screens whatever gets through.
 */
export async function enforceOfficeSendQuota(opts: {
  email?: string | null;
  userId?: string | null;
  officialId: string;
}): Promise<{ allowed: boolean; remaining: number }> {
  const email = (opts.email ?? '').trim();
  // No identity to count: a send with neither a signed-in user nor an email
  // cannot reach a congressional office anyway, since CWC requires one.
  if (!email && !opts.userId) return { allowed: true, remaining: OFFICE_SEND_DAILY_LIMIT };
  const identity: UsageIdentity = opts.userId
    ? { userId: opts.userId, ipHash: null }
    : { userId: null, ipHash: hashSender(email) };
  const action = officeSendAction(opts.officialId);
  const { allowed, remaining } = await checkDailyQuota(identity, action);
  if (allowed) void logUsage(identity, action);
  return { allowed, remaining };
}

/**
 * Resolve the usage identity for a request: the authenticated user if there
 * is a valid session, otherwise the hashed client IP.
 */
export async function resolveUsageIdentity(ip: string): Promise<UsageIdentity> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { userId: user.id, ipHash: null };
  } catch {
    // fall through to anonymous
  }
  return { userId: null, ipHash: hashIp(ip) };
}

/**
 * Check whether an identity has exceeded its daily AI generation quota.
 * Fails open (allows) if the DB check errors — we never block users on infra hiccups.
 */
export async function checkDailyQuota(
  identity: UsageIdentity,
  actionType: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = actionType.startsWith(OFFICE_SEND_PREFIX)
    ? OFFICE_SEND_DAILY_LIMIT
    : (DAILY_LIMITS[actionType] ?? 10);
  const supabase = createAdminClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let query = supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action_type', actionType)
    .gte('created_at', startOfDay.toISOString());

  query = identity.userId
    ? query.eq('user_id', identity.userId)
    : query.eq('ip_hash', identity.ipHash);

  const { count, error } = await query;

  if (error) {
    console.error('[usage-quota] Failed to check quota:', error);
    return { allowed: true, remaining: limit };
  }

  const used = count ?? 0;
  return { allowed: used < limit, remaining: Math.max(0, limit - used) };
}

/** Log a single AI generation usage event. Best-effort; never throws. */
export async function logUsage(
  identity: UsageIdentity,
  actionType: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('ai_usage_logs').insert({
    user_id: identity.userId,
    ip_hash: identity.ipHash,
    action_type: actionType,
  });
  if (error) {
    console.error('[usage-quota] Failed to log usage:', error);
  }
}

/**
 * Durable, per-identity daily cap for an AI route. Resolves the identity
 * (user or hashed IP), checks the quota, and — when allowed — records the
 * attempt so the cost is counted even if generation later fails.
 *
 * Replaces the in-memory per-instance daily cap, which does not hold across
 * Vercel's serverless instances.
 */
export async function enforceDailyQuota(
  ip: string,
  actionType: string,
  identity?: UsageIdentity,
): Promise<{ allowed: boolean; remaining: number }> {
  const id = identity ?? (await resolveUsageIdentity(ip));
  const { allowed, remaining } = await checkDailyQuota(id, actionType);
  if (allowed) {
    void logUsage(id, actionType);
  }
  return { allowed, remaining };
}

/**
 * Check if a user has contacted a specific legislator within the cooldown period.
 * Returns { allowed: true } or { allowed: false, lastContactDate }.
 */
export async function checkLegislatorCooldown(
  userId: string,
  legislatorId: string,
): Promise<{ allowed: boolean; lastContactDate?: string }> {
  const supabase = createAdminClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LEGISLATOR_COOLDOWN_DAYS);

  const { data, error } = await supabase
    .from('messages')
    .select('created_at')
    .eq('user_id', userId)
    .eq('legislator_id', legislatorId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[usage-quota] Failed to check legislator cooldown:', error);
    return { allowed: true };
  }

  if (data && data.length > 0) {
    return {
      allowed: false,
      lastContactDate: new Date(data[0].created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  }

  return { allowed: true };
}
