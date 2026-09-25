import { NextRequest, NextResponse } from 'next/server';
import { processCwcSendQueue } from '@/lib/cwc';

// Node runtime required: the CWC client egresses through the undici
// static-IP proxy, and sends must not be cut off mid-batch.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/cwc-queue — drain one bounded batch of the CWC send queue.
 *
 * Every claimable row was screened by the content-compliance gate at enqueue
 * ('held' rows are invisible to the claim function until an admin approves
 * them), constituent verification and the rate permit fire inside
 * sendCwcDelivery, and maintenance windows surface as deferrals. A batch of
 * 20 at the 5/sec permit ceiling finishes in ~4s, far inside maxDuration.
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
    return NextResponse.json({ ok: true, ...summary });
  } catch (e) {
    const err = e as Error;
    console.error('[cwc-queue] drain failed:', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
