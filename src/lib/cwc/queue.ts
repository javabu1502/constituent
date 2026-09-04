import { createAdminClient } from '@/lib/supabase';
import { assertCwcSendable, CwcComplianceError } from './content';
import { RatePermitBackpressureError } from './rate-permit';
import { sendCwcDelivery, type SendCwcOptions, type SendCwcOutcome } from './send';
import { CwcValidationError } from './xml';
import type { CwcEnvironment } from './delivery-log';
import type { CwcDelivery } from './types';

/**
 * Durable send queue for bulk CWC deliveries (table: cwc_send_queue; see the
 * 20260827000000 migration for the schema + claim function rationale).
 *
 * Enqueue is idempotent on (messageKey × officeCode × environment) — the same
 * identity the delivery log keys on. Workers claim bounded batches with
 * FOR UPDATE SKIP LOCKED leases (claim_cwc_send_jobs) and push each job
 * through sendCwcDelivery, the ONE gated send path. Exactly-once delivery is
 * the lease + the delivery log's mint-once DeliveryId together: a job
 * reclaimed after a worker died mid-send retries with the SAME id, which the
 * Senate 409s → recorded as delivered, never duplicated at the office.
 *
 * A campaign of any size drains in small per-invocation chunks — no 60-second
 * serverless request is ever held open (Lee's PR #3 review).
 */

type DbClient = ReturnType<typeof createAdminClient>;
let clientFactory: () => DbClient = createAdminClient;

/** Test seam — pass nothing to restore the real admin client. */
export function setSendQueueClientFactory(factory?: () => DbClient): void {
  clientFactory = factory ?? createAdminClient;
}

export interface QueueItem {
  delivery: CwcDelivery;
  /** Stable key for the logical message (e.g. `userId:campaignId`). */
  messageKey: string;
  /** Fail-closed: only explicitly sendable levels can enqueue. */
  billLevel: 'federal' | 'none';
}

export interface SendQueueJob {
  id: number;
  message_key: string;
  office_code: string;
  environment: CwcEnvironment;
  chamber: 'house' | 'senate';
  campaign_id: string;
  delivery: CwcDelivery;
  bill_level: 'federal' | 'none';
  status: string;
  attempts: number;
  max_attempts: number;
}

/**
 * Enqueue deliveries for background sending. Runs the compliance gate NOW so
 * an unsendable message fails at the boundary (with the full problem list),
 * not minutes later inside a worker. Re-enqueueing an existing
 * (messageKey × office × environment) is a no-op — safe to call from a
 * retried request.
 */
export async function enqueueCwcDeliveries(
  items: QueueItem[],
  environment: CwcEnvironment,
): Promise<{ enqueued: number }> {
  for (const item of items) {
    assertCwcSendable({
      message: item.delivery.message,
      billLevel: item.billLevel,
      constituent: item.delivery.constituent,
    });
  }
  const db = clientFactory();
  const rows = items.map((item) => ({
    message_key: item.messageKey,
    office_code: item.delivery.officeCode,
    environment,
    chamber: item.delivery.chamber,
    campaign_id: item.delivery.campaignId,
    delivery: item.delivery,
    bill_level: item.billLevel,
  }));
  const { error, count } = await db
    .from('cwc_send_queue')
    .upsert(rows, {
      onConflict: 'message_key,office_code,environment',
      ignoreDuplicates: true,
      count: 'exact',
    });
  if (error) throw new Error(`cwc_send_queue enqueue failed: ${error.message}`);
  return { enqueued: count ?? rows.length };
}

export interface ProcessQueueOptions {
  /** Identifies this worker in leases (e.g. the Vercel invocation id). */
  workerId: string;
  environment: CwcEnvironment;
  /** Jobs per invocation — keep small; at 5/sec, 20 jobs ≈ 4s. */
  limit?: number;
  leaseSeconds?: number;
  /** Forwarded to sendCwcDelivery (activeOffices, verifier, ratePermit…). */
  sendOptions?: Partial<SendCwcOptions>;
  /** Test seam — defaults to sendCwcDelivery. */
  send?: (delivery: CwcDelivery, opts: SendCwcOptions) => Promise<SendCwcOutcome>;
  now?: () => number;
}

export interface ProcessQueueSummary {
  claimed: number;
  sent: number;
  routed: number;
  refused: number;
  deferred: number;
  failed: number;
}

/** Exponential backoff for transient errors: 1m, 2m, 4m… capped at 15m. */
function backoffMs(attempts: number): number {
  return Math.min(60_000 * 2 ** Math.max(0, attempts - 1), 15 * 60_000);
}

/**
 * Claim and process one bounded batch. Sequential within the worker (the
 * cross-instance rate permit at the POST choke point paces the aggregate).
 * Outcome → row status:
 *   delivered/409        → 'sent'  (terminal)
 *   router fallback      → 'routed' (terminal — webform/email path owns it)
 *   not-constituent      → 'refused' (terminal)
 *   retry-later          → back to 'queued' at the hinted/backoff time; the
 *                          claim-time attempt is GIVEN BACK (waiting on
 *                          backpressure/maintenance/429 is not failing)
 *   compliance/validation→ 'failed' (terminal — caller bug, retrying is noise)
 *   transient error      → back to 'queued' with exponential backoff until
 *                          max_attempts, then 'failed' (by the claim fn)
 */
export async function processCwcSendQueue(opts: ProcessQueueOptions): Promise<ProcessQueueSummary> {
  const db = clientFactory();
  const now = opts.now ?? Date.now;
  const send = opts.send ?? sendCwcDelivery;
  const summary: ProcessQueueSummary = { claimed: 0, sent: 0, routed: 0, refused: 0, deferred: 0, failed: 0 };

  const { data, error } = await db.rpc('claim_cwc_send_jobs', {
    p_worker: opts.workerId,
    p_limit: opts.limit ?? 20,
    p_lease_seconds: opts.leaseSeconds ?? 120,
  });
  if (error) throw new Error(`claim_cwc_send_jobs failed: ${error.message}`);
  const jobs = (data ?? []) as SendQueueJob[];
  summary.claimed = jobs.length;

  for (const job of jobs) {
    const finish = async (patch: Record<string, unknown>) => {
      const { error: updErr } = await db
        .from('cwc_send_queue')
        .update({ ...patch, leased_by: null, lease_expires_at: null, updated_at: new Date(now()).toISOString() })
        .eq('id', job.id);
      if (updErr) {
        // The lease still expires and the job re-runs idempotently; log only.
        console.error(`cwc_send_queue: failed to update job ${job.id}:`, updErr.message);
      }
    };

    try {
      const outcome = await send(job.delivery, {
        messageKey: job.message_key,
        environment: opts.environment,
        billLevel: job.bill_level,
        ...opts.sendOptions,
      });
      if (outcome.sent) {
        summary.sent++;
        await finish({ status: 'sent', last_error: null });
      } else if (outcome.fallback === 'retry-later') {
        // Maintenance window / endpoint 429 / queue depth — wait, don't burn.
        summary.deferred++;
        await finish({
          status: 'queued',
          attempts: job.attempts - 1, // a deferral gives the attempt back
          run_after: new Date(now() + backoffMs(job.attempts)).toISOString(),
          last_error: outcome.reason,
        });
      } else if (outcome.fallback === 'router') {
        summary.routed++;
        await finish({ status: 'routed', last_error: outcome.reason });
      } else {
        summary.refused++;
        await finish({ status: 'refused', last_error: outcome.reason });
      }
    } catch (e) {
      const err = e as Error;
      if (e instanceof CwcComplianceError || e instanceof CwcValidationError) {
        // Caller bug baked into the payload — retrying can never succeed.
        summary.failed++;
        await finish({ status: 'failed', last_error: err.message });
      } else if (e instanceof RatePermitBackpressureError) {
        summary.deferred++;
        await finish({
          status: 'queued',
          attempts: job.attempts - 1,
          run_after: new Date(now() + e.retryAfterMs).toISOString(),
          last_error: err.message,
        });
      } else {
        // Transient (network, DB blip): backoff and let the budget decide.
        const exhausted = job.attempts >= job.max_attempts;
        if (exhausted) summary.failed++;
        else summary.deferred++;
        await finish({
          status: exhausted ? 'failed' : 'queued',
          run_after: new Date(now() + backoffMs(job.attempts)).toISOString(),
          last_error: err.message,
        });
      }
    }
  }

  return summary;
}
