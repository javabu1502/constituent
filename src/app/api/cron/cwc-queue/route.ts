import { NextRequest, NextResponse } from 'next/server';
import { processCwcSendQueue } from '@/lib/cwc';
import { createAdminClient } from '@/lib/supabase';
import {
  readQueueHealth, heartbeatLine, alertIfStale, runAtMostOncePer, ALERT_DEDUPE_MS,
  type QueueHealth,
} from '@/lib/cwc/queue-health';
import { runRetentionScrub, type RetentionSummary } from '@/lib/cwc/retention';
import { reconcileDeliveryStatuses, type ReconcileSummary } from '@/lib/cwc/reconcile';

// Node runtime required: the CWC client egresses through the undici
// static-IP proxy, and sends must not be cut off mid-batch.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RETENTION_CACHE_KEY = 'cwc:retention-scrub';

/**
 * GET /api/cron/cwc-queue — drain one bounded batch of the CWC send queue.
 *
 * Every claimable row was screened by the content-compliance gate at enqueue
 * ('held' rows are invisible to the claim function until an admin approves
 * them), constituent verification and the rate permit fire inside
 * sendCwcDelivery, and maintenance windows surface as deferrals. A batch of
 * 20 at the 5/sec permit ceiling finishes in ~4s, far inside maxDuration.
 *
 * After the drain, every run:
 *  - logs one heartbeat line (claimed, queued count + oldest age, held count
 *    + oldest age);
 *  - emails the admin at most once per 24h when a queued row is older than
 *    15 minutes or a held row older than 24 hours;
 *  - once per 24h, runs the retention scrub (terminal queue rows older than
 *    30 days lose street/email/phone; ai_usage_logs older than 30 days are
 *    deleted) and logs the counts.
 * None of these can fail the drain itself.
 *
 * KILL SWITCH: unset CWC_QUEUE_ENABLED (or set it to anything but 'true')
 * and every run no-ops. The cron ships OFF so deploying it changes nothing
 * until the supervised first send flips the env var.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.CWC_QUEUE_ENABLED !== 'true') {
    return NextResponse.json({ skipped: true, reason: 'CWC_QUEUE_ENABLED is not true' });
  }

  const workerId = `cron:${process.env.VERCEL_DEPLOYMENT_ID ?? 'local'}:${Date.now()}`;
  try {
    const summary = await processCwcSendQueue({
      workerId,
      environment: 'production',
      limit: 20,
    });
    if (summary.claimed > 0) {
      console.log('[cwc-queue] drained batch:', JSON.stringify(summary));
    }

    const db = createAdminClient();
    const now = Date.now();

    let health: QueueHealth | null = null;
    let stale: { problems: string[]; alerted: boolean } | null = null;
    try {
      health = await readQueueHealth(db, now);
      console.log(heartbeatLine(summary.claimed, health));
      stale = await alertIfStale(db, health, now);
      if (stale.problems.length > 0) {
        console.warn(`[cwc-queue] stale: ${stale.problems.join('; ')}${stale.alerted ? ' (admin emailed)' : ' (alert already sent today)'}`);
      }
    } catch (e) {
      console.error('[cwc-queue] heartbeat failed:', (e as Error).message);
    }

    // Backstop for the drain's own write-back. Runs every pass, not once a
    // day: a message that claims to be on its way to a congressional office
    // when it is not is the one thing this product must never say.
    let reconcile: ReconcileSummary | null = null;
    try {
      reconcile = await reconcileDeliveryStatuses(db, { now: new Date(now) });
      if (reconcile.repaired || reconcile.orphaned || reconcile.errors.length) {
        console.log('[cwc-queue] reconcile:', JSON.stringify(reconcile));
      }
    } catch (e) {
      console.error('[cwc-queue] reconcile failed:', (e as Error).message);
    }

    let retention: RetentionSummary | null = null;
    try {
      await runAtMostOncePer(db, RETENTION_CACHE_KEY, ALERT_DEDUPE_MS, now, async () => {
        retention = await runRetentionScrub(db, { now: new Date(now) });
        console.log('[cwc-queue] retention scrub:', JSON.stringify(retention));
      });
    } catch (e) {
      console.error('[cwc-queue] retention scrub failed:', (e as Error).message);
    }

    return NextResponse.json({ ok: true, ...summary, health, stale, reconcile, retention });
  } catch (e) {
    const err = e as Error;
    console.error('[cwc-queue] drain failed:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
