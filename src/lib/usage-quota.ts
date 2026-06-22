import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

/** Daily AI generation limits by action type (per user, or per anonymous IP). */
const DAILY_LIMITS: Record<string, number> = {
  generate_message: 10,
  generate_follow_up: 10,
  generate_comment: 10,
  research: 15,
  chat: 50,
};

/** Minimum days between messages to the same legislator */
const LEGISLATOR_COOLDOWN_DAYS = 7;

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
  const limit = DAILY_LIMITS[actionType] ?? 10;
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
