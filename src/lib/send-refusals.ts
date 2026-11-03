import { createAdminClient } from '@/lib/supabase';

/**
 * Why a send attempt never became a message.
 *
 * /api/track-send can refuse a send eight different ways before it writes a
 * row, and until 2026-11-03 every one of them was a console line on a server
 * nobody tails. That made the biggest question about this product
 * unanswerable from the data: people draft letters (766 AI chat calls in 30
 * days) and very few arrive (~16 messages), and nothing recorded what
 * happened in between.
 *
 * Best-effort by construction. A telemetry write must never change, delay or
 * break the outcome it is describing, so every failure here is swallowed.
 */
export type SendRefusalReason =
  | 'rate_limited' // writeLimiter: too many writes from one IP
  | 'invalid_json'
  | 'schema_rejected' // body failed trackSendSchema
  | 'captcha_failed' // strict Turnstile check, no/!valid token
  | 'legislator_cooldown' // already wrote to this official recently
  | 'office_quota' // per-office daily cap on messages we deliver
  | 'campaign_closed' // organizer ended the campaign
  | 'insert_failed'; // the messages insert itself errored

export interface SendRefusalContext {
  status: number;
  campaignId?: string | null;
  userId?: string | null;
  ipHash?: string | null;
  legislatorId?: string | null;
}

export async function recordSendRefusal(
  reason: SendRefusalReason,
  ctx: SendRefusalContext,
): Promise<void> {
  try {
    await createAdminClient().from('send_refusals').insert({
      reason,
      status: ctx.status,
      campaign_id: ctx.campaignId ?? null,
      user_id: ctx.userId ?? null,
      ip_hash: ctx.ipHash ?? null,
      legislator_id: ctx.legislatorId ?? null,
    });
  } catch (e) {
    console.error('[send-refusals] could not record refusal:', (e as Error).message);
  }
}
