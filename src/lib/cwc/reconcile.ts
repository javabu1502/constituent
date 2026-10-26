/**
 * Repair `messages.delivery_status` from the delivery queues.
 *
 * The drain writes the outcome back through `setMessageDeliveryStatus`, which
 * needs `delivery.messageId`. Every queue row created before that field was
 * plumbed carries no id, so nothing the drain learned could ever reach the
 * message row. Two real sends sat at "Sending to Congress" and "Sending to
 * the office form" for six days: one had never been queued at all, the other
 * had failed three times. Both told the sender their letter was on its way.
 *
 * The write-back is still the fast path. This is the backstop that runs after
 * it, so a message can never again be stranded by a lost id, a crash between
 * the queue write and the message write, or a row that predates a change.
 *
 * Two passes:
 *   1. Settled queue rows whose message row disagrees. Matched by
 *      `messageId` when present, otherwise by sender email plus office,
 *      which is unique per letter.
 *   2. Messages that still claim to be in flight but have no queue row at
 *      all, past a grace period. Those were never queued, so nothing will
 *      ever settle them and the claim is simply false.
 *
 * Only ever moves a message OUT of an in-flight status, never back into one,
 * and never overwrites a status the queue does not justify.
 */
import type { createAdminClient } from '@/lib/supabase';
import { CWC_MESSAGE_STATUS, WEBFORM_MESSAGE_STATUS } from './message-status';
import { resolveOfficeCode } from './offices';
import { getAllFederalLegislators } from '@/lib/legislators';
import type { Official } from '@/lib/types';

type DbClient = ReturnType<typeof createAdminClient>;

/** Statuses a message sits in while it waits for a queue outcome. */
const IN_FLIGHT = [
  CWC_MESSAGE_STATUS.submitted,
  CWC_MESSAGE_STATUS.held,
  WEBFORM_MESSAGE_STATUS.submitted,
  WEBFORM_MESSAGE_STATUS.held,
];

/** How a settled queue row maps onto the message row. */
const CWC_OUTCOME: Record<string, string> = {
  sent: CWC_MESSAGE_STATUS.delivered,
  refused: CWC_MESSAGE_STATUS.refused,
  failed: CWC_MESSAGE_STATUS.failed,
  // 'routed' means the office left the active list mid-flight and the row was
  // parked. Nothing delivers it, so it is not delivered.
  routed: CWC_MESSAGE_STATUS.failed,
};

const WEBFORM_OUTCOME: Record<string, string> = {
  delivered: WEBFORM_MESSAGE_STATUS.delivered,
  sent: WEBFORM_MESSAGE_STATUS.delivered,
  failed: WEBFORM_MESSAGE_STATUS.failed,
  blocked: WEBFORM_MESSAGE_STATUS.blocked,
};

/**
 * A message in flight with no queue row behind it is only safe to call
 * failed once enough time has passed that it cannot still be in the middle
 * of being enqueued.
 */
export const ORPHAN_GRACE_MS = 60 * 60 * 1000;

export interface ReconcileSummary {
  /** Message rows corrected from a settled queue row. */
  repaired: number;
  /** Message rows failed because no queue row ever existed for them. */
  orphaned: number;
  /** Queue rows that are settled but whose message row could not be found. */
  unmatched: number;
  errors: string[];
}

function emailOf(delivery: unknown): string {
  const d = delivery as { constituent?: { email?: string } } | null;
  return (d?.constituent?.email ?? '').trim().toLowerCase();
}

/**
 * The office code a message was addressed to, from its legislator.
 *
 * The fallback match needs this. Matching a legacy queue row to a pending
 * message on the sender's email alone is not enough: one person writes to
 * several offices in one sitting, so the first unclaimed row for that address
 * wins regardless of who it was for. A dry run against production did exactly
 * that, and would have marked a message to Senator Warner as delivered on the
 * strength of a queue row belonging to a different member. Claiming a
 * delivery that never happened is the worst thing this module could do.
 */
let rosterByIdCache: Map<string, Official> | null = null;
function officeCodeForLegislator(legislatorId: string | null | undefined): string | null {
  if (!legislatorId) return null;
  if (!rosterByIdCache) {
    rosterByIdCache = new Map((getAllFederalLegislators() as unknown as Official[]).map((l) => [l.id, l]));
  }
  const official = rosterByIdCache.get(legislatorId);
  if (!official) return null;
  const code = resolveOfficeCode(official);
  return code.ok ? code.code : null;
}

function messageIdOf(delivery: unknown): string | null {
  const d = delivery as { messageId?: string } | null;
  return d?.messageId ?? null;
}

export async function reconcileDeliveryStatuses(
  db: DbClient,
  opts: { now?: Date; limit?: number } = {},
): Promise<ReconcileSummary> {
  const now = opts.now ?? new Date();
  const limit = opts.limit ?? 500;
  const summary: ReconcileSummary = { repaired: 0, orphaned: 0, unmatched: 0, errors: [] };

  // Every message still waiting on an outcome. Small by construction: a
  // healthy queue settles within minutes.
  const { data: pending, error: pErr } = await db
    .from('messages')
    .select('id, delivery_status, advocate_email, legislator_id, created_at')
    .in('delivery_status', IN_FLIGHT)
    .limit(limit);
  if (pErr) {
    summary.errors.push(`messages select: ${pErr.message}`);
    return summary;
  }
  if (!pending || pending.length === 0) return summary;

  const byId = new Map<string, (typeof pending)[number]>();
  const byEmail = new Map<string, (typeof pending)[number][]>();
  for (const m of pending) {
    byId.set(m.id as string, m);
    const e = ((m.advocate_email as string | null) ?? '').trim().toLowerCase();
    if (!e) continue;
    if (!byEmail.has(e)) byEmail.set(e, []);
    byEmail.get(e)!.push(m);
  }

  const claimed = new Set<string>();

  const applyOutcome = async (messageId: string, status: string) => {
    const { error } = await db.from('messages').update({ delivery_status: status }).eq('id', messageId);
    if (error) summary.errors.push(`messages ${messageId} -> ${status}: ${error.message}`);
    else summary.repaired++;
  };

  // Pass 1a: settled CWC rows.
  try {
    const { data: rows, error } = await db
      .from('cwc_send_queue')
      .select('id, status, office_code, delivery')
      .in('status', Object.keys(CWC_OUTCOME))
      .limit(limit);
    if (error) throw new Error(error.message);
    for (const r of rows ?? []) {
      const target = CWC_OUTCOME[r.status as string];
      const direct = messageIdOf(r.delivery);
      let match = direct ? byId.get(direct) : undefined;
      if (!match) {
        // Legacy row with no id. Email AND office, never email alone: the
        // sender's other letters from the same sitting share the address.
        const candidates = byEmail.get(emailOf(r.delivery)) ?? [];
        match = candidates.find(
          (m) =>
            !claimed.has(m.id as string) &&
            officeCodeForLegislator(m.legislator_id as string | null) === (r.office_code as string),
        );
      }
      if (!match) {
        summary.unmatched++;
        continue;
      }
      claimed.add(match.id as string);
      if (match.delivery_status !== target) await applyOutcome(match.id as string, target);
    }
  } catch (e) {
    summary.errors.push(`cwc_send_queue: ${(e as Error).message}`);
  }

  // Pass 1b: settled webform rows.
  try {
    const { data: rows, error } = await db
      .from('webform_send_queue')
      .select('id, status, official_id, constituent')
      .in('status', Object.keys(WEBFORM_OUTCOME))
      .limit(limit);
    if (error) throw new Error(error.message);
    for (const r of rows ?? []) {
      const target = WEBFORM_OUTCOME[r.status as string];
      const email = ((r.constituent as { email?: string } | null)?.email ?? '').trim().toLowerCase();
      const candidates = (byEmail.get(email) ?? []).filter((m) => !claimed.has(m.id as string));
      const match =
        candidates.find((m) => (m.legislator_id as string | null) === (r.official_id as string | null)) ?? candidates[0];
      if (!match) {
        summary.unmatched++;
        continue;
      }
      claimed.add(match.id as string);
      if (match.delivery_status !== target) await applyOutcome(match.id as string, target);
    }
  } catch (e) {
    summary.errors.push(`webform_send_queue: ${(e as Error).message}`);
  }

  // Pass 2: still in flight, no queue row, old enough that none is coming.
  const cutoff = now.getTime() - ORPHAN_GRACE_MS;
  for (const m of pending) {
    if (claimed.has(m.id as string)) continue;
    if (new Date(m.created_at as string).getTime() > cutoff) continue;
    const isWebform = String(m.delivery_status).startsWith('webform');
    const target = isWebform ? WEBFORM_MESSAGE_STATUS.failed : CWC_MESSAGE_STATUS.failed;
    const { error } = await db.from('messages').update({ delivery_status: target }).eq('id', m.id);
    if (error) summary.errors.push(`orphan ${m.id} -> ${target}: ${error.message}`);
    else summary.orphaned++;
  }

  return summary;
}
