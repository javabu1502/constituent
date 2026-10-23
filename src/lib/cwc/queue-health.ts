/**
 * Queue heartbeat and stale-row alerts for /api/cron/cwc-queue.
 *
 * Every run logs one line (claimed, queued count and oldest age, held count
 * and oldest age). When a queued row is older than 15 minutes (three cron
 * ticks without a send) or a held row is older than 24 hours (nobody has
 * reviewed it), one admin email goes out per 24 hours. The dedupe and the
 * once-a-day retention scrub both use `content_cache` (cache_key, data,
 * created_at), the service-role store the rest of the app uses for shared
 * state.
 */
import type { createAdminClient } from '@/lib/supabase';
import { notifyAdminAlert, siteUrl, escapeHtml } from './notify';

type DbClient = ReturnType<typeof createAdminClient>;

const MIN_MS = 60_000;
const HOUR_MS = 60 * MIN_MS;
export const STALE_QUEUED_MS = 15 * MIN_MS;
export const STALE_HELD_MS = 24 * HOUR_MS;
export const ALERT_DEDUPE_MS = 24 * HOUR_MS;

export interface QueueHealth {
  queued: number;
  oldestQueuedAgeMs: number | null;
  held: number;
  oldestHeldAgeMs: number | null;
}

/** Read queued/held counts and ages for the production queue. */
export async function readQueueHealth(db: DbClient, now: number = Date.now()): Promise<QueueHealth> {
  const { data, error } = await db
    .from('cwc_send_queue')
    .select('status, created_at, updated_at')
    .eq('environment', 'production')
    .in('status', ['queued', 'held']);
  if (error) throw new Error(`cwc_send_queue health read failed: ${error.message}`);
  const health: QueueHealth = { queued: 0, oldestQueuedAgeMs: null, held: 0, oldestHeldAgeMs: null };
  for (const row of (data ?? []) as Array<{ status: string; created_at: string; updated_at: string }>) {
    const age = Math.max(0, now - new Date(row.created_at).getTime());
    if (row.status === 'queued') {
      health.queued++;
      health.oldestQueuedAgeMs = Math.max(health.oldestQueuedAgeMs ?? 0, age);
    } else if (row.status === 'held') {
      health.held++;
      health.oldestHeldAgeMs = Math.max(health.oldestHeldAgeMs ?? 0, age);
    }
  }
  return health;
}

/** Human-readable problems, empty when the queue is healthy. Pure. */
export function staleProblems(
  h: QueueHealth,
  thresholds: { queuedMs?: number; heldMs?: number } = {},
): string[] {
  const queuedMs = thresholds.queuedMs ?? STALE_QUEUED_MS;
  const heldMs = thresholds.heldMs ?? STALE_HELD_MS;
  const problems: string[] = [];
  if (h.oldestQueuedAgeMs != null && h.oldestQueuedAgeMs > queuedMs) {
    problems.push(`${h.queued} queued row(s); the oldest has waited ${Math.round(h.oldestQueuedAgeMs / MIN_MS)} minutes (limit ${Math.round(queuedMs / MIN_MS)})`);
  }
  if (h.oldestHeldAgeMs != null && h.oldestHeldAgeMs > heldMs) {
    problems.push(`${h.held} held row(s) awaiting review; the oldest has waited ${Math.round(h.oldestHeldAgeMs / HOUR_MS)} hours (limit ${Math.round(heldMs / HOUR_MS)})`);
  }
  return problems;
}

/** The single heartbeat line for the cron log. Pure. */
export function heartbeatLine(claimed: number, h: QueueHealth): string {
  const mins = (ms: number | null) => (ms == null ? '-' : String(Math.round(ms / MIN_MS)));
  return `[cwc-queue] heartbeat claimed=${claimed} queued=${h.queued} oldestQueuedMin=${mins(h.oldestQueuedAgeMs)} held=${h.held} oldestHeldMin=${mins(h.oldestHeldAgeMs)}`;
}

/**
 * Run `fn` at most once per `everyMs`, keyed in content_cache. Returns true
 * when it ran. A cache read failure does not block the run; a cache write
 * failure is logged.
 */
export async function runAtMostOncePer(
  db: DbClient,
  key: string,
  everyMs: number,
  now: number,
  fn: () => Promise<void>,
): Promise<boolean> {
  try {
    const { data } = await db
      .from('content_cache')
      .select('created_at')
      .eq('cache_key', key)
      .maybeSingle();
    const last = data?.created_at ? new Date(data.created_at as string).getTime() : null;
    if (last != null && now - last < everyMs) return false;
  } catch (e) {
    console.error(`[cwc-queue] content_cache read for ${key} failed:`, (e as Error).message);
  }
  await fn();
  try {
    const { error } = await db
      .from('content_cache')
      .upsert({ cache_key: key, data: { at: new Date(now).toISOString() }, created_at: new Date(now).toISOString() }, { onConflict: 'cache_key' });
    if (error) console.error(`[cwc-queue] content_cache write for ${key} failed:`, error.message);
  } catch (e) {
    console.error(`[cwc-queue] content_cache write for ${key} threw:`, (e as Error).message);
  }
  return true;
}

export const STALE_ALERT_CACHE_KEY = 'cwc:queue-stale-alert';

/** Email the admin about stale rows, at most once per 24 hours. */
export async function alertIfStale(
  db: DbClient,
  h: QueueHealth,
  now: number = Date.now(),
): Promise<{ problems: string[]; alerted: boolean }> {
  const problems = staleProblems(h);
  if (problems.length === 0) return { problems, alerted: false };
  const alerted = await runAtMostOncePer(db, STALE_ALERT_CACHE_KEY, ALERT_DEDUPE_MS, now, async () => {
    await notifyAdminAlert(
      `CWC queue needs attention: ${problems.length === 1 ? problems[0] : `${problems.length} problems`}`,
      `<h2>CWC send queue is stale</h2>
       <ul>${problems.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
       <p>Queued rows: <a href="${siteUrl()}/admin/cwc-queue">${siteUrl()}/admin/cwc-queue</a><br>
       Held rows: <a href="${siteUrl()}/admin/compliance">${siteUrl()}/admin/compliance</a></p>
       <p>This alert repeats at most once per day while the condition lasts.</p>`,
    );
  });
  return { problems, alerted };
}
