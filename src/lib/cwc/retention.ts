/**
 * Retention scrub for delivery records (privacy page promise):
 *  (a) cwc_send_queue rows in a terminal status older than 30 days lose the
 *      constituent's street, address2, email and phone inside the delivery
 *      jsonb. Prefix, name, city, state and ZIP5 stay for audit.
 *  (b) webform_send_queue rows likewise lose street, email and phone.
 *  (c) ai_usage_logs rows older than 30 days are deleted.
 *
 * Pure scrub functions are exported for tests; `runRetentionScrub` does the
 * database work and reports counts for the cron log.
 */
import type { createAdminClient } from '@/lib/supabase';
import type { CwcDelivery } from './types';

type DbClient = ReturnType<typeof createAdminClient>;

/** Queue statuses after which a row never sends again. */
export const TERMINAL_QUEUE_STATUSES: readonly string[] = ['sent', 'routed', 'refused', 'failed'];
export const TERMINAL_WEBFORM_STATUSES: readonly string[] = ['sent', 'refused', 'failed'];

export const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The stored shape after scrubbing: the fields are present but null. */
export type ScrubbedCwcDelivery = Omit<CwcDelivery, 'constituent'> & {
  constituent: Omit<CwcDelivery['constituent'], 'address1' | 'address2' | 'email' | 'phone'> & {
    address1: null;
    address2: null;
    email: null;
    phone: null;
  };
  scrubbedAt: string;
};

function zip5(zip: string | null | undefined): string {
  return (zip || '').slice(0, 5);
}

/** Pure: a delivery payload with the street, address2, email and phone removed. */
export function scrubCwcDelivery(delivery: CwcDelivery, now: Date = new Date()): ScrubbedCwcDelivery {
  const c = delivery.constituent;
  return {
    ...delivery,
    constituent: {
      prefix: c.prefix,
      firstName: c.firstName,
      lastName: c.lastName,
      ...(c.middleName ? { middleName: c.middleName } : {}),
      ...(c.suffix ? { suffix: c.suffix } : {}),
      city: c.city,
      state: c.state,
      zip: zip5(c.zip),
      address1: null,
      address2: null,
      email: null,
      phone: null,
    },
    scrubbedAt: now.toISOString(),
  };
}

export interface WebformConstituentRecord {
  prefix?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  address1?: string | null;
  city?: string;
  state?: string;
  zip?: string;
  scrubbedAt?: string;
  [key: string]: unknown;
}

/** Pure: a webform constituent record with street, email and phone removed. */
export function scrubWebformConstituent(c: WebformConstituentRecord, now: Date = new Date()): WebformConstituentRecord {
  const out: WebformConstituentRecord = {
    prefix: c.prefix,
    firstName: c.firstName,
    lastName: c.lastName,
    city: c.city,
    state: c.state,
    zip: zip5(c.zip),
    street: null,
    email: null,
    phone: null,
    scrubbedAt: now.toISOString(),
  };
  if ('address1' in c) out.address1 = null;
  if ('name' in c) out.name = c.name;
  return out;
}

export interface RetentionSummary {
  cutoff: string;
  cwcScrubbed: number;
  webformScrubbed: number;
  aiUsageDeleted: number;
  errors: string[];
}

/**
 * Scrub one bounded batch per table and delete old usage logs. Safe to run
 * repeatedly: scrubbed rows carry `scrubbedAt` inside the jsonb and are not
 * selected again.
 */
export async function runRetentionScrub(
  db: DbClient,
  opts: { now?: Date; retentionDays?: number; limit?: number } = {},
): Promise<RetentionSummary> {
  const now = opts.now ?? new Date();
  const cutoff = new Date(now.getTime() - (opts.retentionDays ?? RETENTION_DAYS) * DAY_MS).toISOString();
  const limit = opts.limit ?? 500;
  const summary: RetentionSummary = { cutoff, cwcScrubbed: 0, webformScrubbed: 0, aiUsageDeleted: 0, errors: [] };

  // (a) CWC queue rows.
  try {
    const { data, error } = await db
      .from('cwc_send_queue')
      .select('id, delivery')
      .in('status', [...TERMINAL_QUEUE_STATUSES])
      .lt('updated_at', cutoff)
      .is('delivery->scrubbedAt', null)
      .limit(limit);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as Array<{ id: number; delivery: CwcDelivery }>) {
      if (!row.delivery?.constituent) continue;
      const { error: updErr } = await db
        .from('cwc_send_queue')
        .update({ delivery: scrubCwcDelivery(row.delivery, now) })
        .eq('id', row.id);
      if (updErr) summary.errors.push(`cwc_send_queue #${row.id}: ${updErr.message}`);
      else summary.cwcScrubbed++;
    }
  } catch (e) {
    summary.errors.push(`cwc_send_queue select: ${(e as Error).message}`);
  }

  // (b) Webform queue rows.
  try {
    const { data, error } = await db
      .from('webform_send_queue')
      .select('id, constituent')
      .in('status', [...TERMINAL_WEBFORM_STATUSES])
      .lt('updated_at', cutoff)
      .is('constituent->scrubbedAt', null)
      .limit(limit);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as Array<{ id: number; constituent: WebformConstituentRecord }>) {
      if (!row.constituent) continue;
      const { error: updErr } = await db
        .from('webform_send_queue')
        .update({ constituent: scrubWebformConstituent(row.constituent, now) })
        .eq('id', row.id);
      if (updErr) summary.errors.push(`webform_send_queue #${row.id}: ${updErr.message}`);
      else summary.webformScrubbed++;
    }
  } catch (e) {
    summary.errors.push(`webform_send_queue select: ${(e as Error).message}`);
  }

  // (c) AI usage logs.
  try {
    const { count, error } = await db
      .from('ai_usage_logs')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff);
    if (error) throw new Error(error.message);
    summary.aiUsageDeleted = count ?? 0;
  } catch (e) {
    summary.errors.push(`ai_usage_logs delete: ${(e as Error).message}`);
  }

  return summary;
}
