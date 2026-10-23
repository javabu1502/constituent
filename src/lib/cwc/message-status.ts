/**
 * Delivery truth for the `messages` table.
 *
 * The client writes `cwc_submitted` / `webform_submitted` the moment the
 * constituent presses "Send to Congress". Until 2026-10-23 nothing ever
 * corrected that value, so a message the screener held, the drain refused,
 * or the webform worker gave up on still read as submitted. The helpers here
 * are the single place the server-side outcome is written back, and the
 * status sets are the single definition of "counts as sent" for anything
 * that aggregates messages.
 */
import type { createAdminClient } from '@/lib/supabase';

type DbClient = ReturnType<typeof createAdminClient>;

export const CWC_MESSAGE_STATUS = {
  /** Client-reported: the constituent pressed Send to Congress. */
  submitted: 'cwc_submitted',
  /** The content screen said review; a human must release it. */
  held: 'cwc_held',
  /** The office accepted the message (2xx or a Senate 409 on retry). */
  delivered: 'cwc_delivered',
  /** The drain refused it (the address did not verify for that seat). */
  refused: 'cwc_refused',
  /** The endpoint rejected it, the attempt budget ran out, or the enqueue threw. */
  failed: 'cwc_failed',
  /** The payload could not be built (no last name, unmapped office). */
  skipped: 'cwc_skipped',
  /** The content screen refused it outright. */
  blocked: 'cwc_blocked',
} as const;

export const WEBFORM_MESSAGE_STATUS = {
  submitted: 'webform_submitted',
  held: 'webform_held',
  delivered: 'webform_delivered',
  failed: 'webform_failed',
  skipped: 'webform_skipped',
  blocked: 'webform_blocked',
} as const;

export type CwcMessageStatus = (typeof CWC_MESSAGE_STATUS)[keyof typeof CWC_MESSAGE_STATUS];
export type WebformMessageStatus = (typeof WEBFORM_MESSAGE_STATUS)[keyof typeof WEBFORM_MESSAGE_STATUS];
export type ServerDeliveryStatus = CwcMessageStatus | WebformMessageStatus;

/**
 * Statuses that count as "sent to Congress" in counts, dashboards and
 * exports. `submitted` and `held` stay in so existing totals do not drop the
 * moment a message enters review; a held message is on its way, not lost.
 */
export const SENT_TO_CONGRESS_STATUSES: ReadonlySet<string> = new Set([
  CWC_MESSAGE_STATUS.submitted,
  CWC_MESSAGE_STATUS.held,
  CWC_MESSAGE_STATUS.delivered,
  WEBFORM_MESSAGE_STATUS.submitted,
  WEBFORM_MESSAGE_STATUS.held,
  WEBFORM_MESSAGE_STATUS.delivered,
]);

/** Statuses that mean the office does NOT have the message. */
export const NOT_DELIVERED_STATUSES: ReadonlySet<string> = new Set([
  CWC_MESSAGE_STATUS.refused,
  CWC_MESSAGE_STATUS.failed,
  CWC_MESSAGE_STATUS.skipped,
  CWC_MESSAGE_STATUS.blocked,
  WEBFORM_MESSAGE_STATUS.failed,
  WEBFORM_MESSAGE_STATUS.skipped,
  WEBFORM_MESSAGE_STATUS.blocked,
]);

/** True when a messages.delivery_status should be counted as sent to Congress. */
export function countsAsSentToCongress(status: string | null | undefined): boolean {
  return !!status && SENT_TO_CONGRESS_STATUSES.has(status);
}

/** True when a messages.delivery_status means delivery did not happen. */
export function isNotDelivered(status: string | null | undefined): boolean {
  return !!status && NOT_DELIVERED_STATUSES.has(status);
}

/**
 * Write the server-side outcome to the messages row. Best-effort: a failure
 * here is logged and never blocks the queue, because the queue row remains
 * the authoritative record and the admin page reads from it.
 */
export async function setMessageDeliveryStatus(
  db: DbClient,
  messageId: string | null | undefined,
  status: ServerDeliveryStatus,
): Promise<boolean> {
  if (!messageId) return false;
  try {
    const { error } = await db
      .from('messages')
      .update({ delivery_status: status })
      .eq('id', messageId);
    if (error) {
      console.error(`[cwc/message-status] messages.${messageId} -> ${status} failed:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[cwc/message-status] messages.${messageId} -> ${status} threw:`, (e as Error).message);
    return false;
  }
}
