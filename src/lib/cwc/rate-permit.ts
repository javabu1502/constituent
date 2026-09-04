import { createAdminClient } from '@/lib/supabase';
import { MAX_MESSAGES_PER_SECOND, type Chamber } from './constants';
import type { CwcEnvironment } from './delivery-log';

/**
 * Cross-instance send-rate coordination, backing every CWC POST.
 *
 * The in-process spacing in sendBatch only paces one Node process; on Vercel,
 * concurrent serverless instances would each send at the full rate. Before
 * every send we claim a slot from the Postgres allocator
 * (allocate_rate_permit): a transactional next_allowed_at bump whose row lock
 * serializes claimants across ALL instances, so the aggregate rate can never
 * exceed the configured ceiling no matter how many instances are running.
 *
 * Fail-open BY DESIGN: if the allocator is unreachable we fall back to a
 * conservative in-process delay and log loudly, rather than dropping the
 * constituent's message. A brief overrun during a DB outage is recoverable
 * (CWC answers 429-class responses); a silently lost message is not.
 */

type DbClient = ReturnType<typeof createAdminClient>;
let clientFactory: () => DbClient = createAdminClient;

/** Test seam — pass nothing to restore the real admin client. */
export function setRatePermitClientFactory(factory?: () => DbClient): void {
  clientFactory = factory ?? createAdminClient;
}

export function ratePermitScope(chamber: Chamber, environment: CwcEnvironment): string {
  return `cwc:${chamber}:${environment}`;
}

export interface AcquirePermitOptions {
  /** Ceiling in messages/second; defaults to the conservative CWC floor (5/sec). */
  maxPerSecond?: number;
  /** Longest this caller will queue for a slot (default 30s). A horizon
   *  beyond it throws RatePermitBackpressureError — defer, don't burst. */
  maxWaitMs?: number;
  /** Injectable clock and sleeper for tests. */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * The send queue for a scope is deeper than the caller will wait. NOT an
 * allocator failure: the ceiling is holding under load. Callers map this to
 * their retry-later path; the refused claim did NOT bump the queue.
 */
export class RatePermitBackpressureError extends Error {
  constructor(
    public readonly scope: string,
    public readonly retryAfterMs: number,
  ) {
    super(`CWC send queue for ${scope} is ~${Math.ceil(retryAfterMs / 1000)}s deep — deferring rather than bursting past the rate ceiling`);
    this.name = 'RatePermitBackpressureError';
  }
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Block until this caller owns the next send slot for `scope`. Returns the
 * wait that was applied in ms (0 when the slot was immediately available).
 *
 * Backpressure: when the queue horizon is beyond `maxWaitMs` the allocator
 * refuses WITHOUT bumping and this throws RatePermitBackpressureError. The
 * old behavior (send after a token gap when the wait looked "implausible")
 * burst past the ceiling exactly when the ceiling mattered — a deep backlog
 * IS the allocator working, not a corrupted row.
 */
export async function acquireSendPermit(
  scope: string,
  opts: AcquirePermitOptions = {},
): Promise<number> {
  const rate = Math.max(1, Math.min(10, opts.maxPerSecond ?? MAX_MESSAGES_PER_SECOND));
  const gapMs = Math.ceil(1000 / rate);
  const maxWaitMs = opts.maxWaitMs ?? 30_000;
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? defaultSleep;

  let slotMs: number;
  try {
    const db = clientFactory();
    const { data, error } = await db.rpc('allocate_rate_permit', {
      p_scope: scope,
      p_min_gap_ms: gapMs,
      p_max_wait_ms: maxWaitMs,
    });
    if (error || !data) throw new Error(error?.message ?? 'allocate_rate_permit returned no slot');
    slotMs = new Date(data as string).getTime();
  } catch (e) {
    // Fail-open BY DESIGN on allocator OUTAGE only (see module header): pace
    // locally rather than dropping the constituent's message.
    console.error(`CWC rate permit: allocator unavailable for ${scope}, falling back to local pacing:`, e);
    await sleep(gapMs);
    return gapMs;
  }

  const waitMs = Math.max(0, slotMs - now());
  if (waitMs > maxWaitMs) {
    if (waitMs > 600_000) {
      // A backlog this deep (>10 min at 5–10/s ≈ thousands queued) more
      // likely means a corrupted/skewed next_allowed_at — surface for an
      // operator to reset the rate_permits row. Still defer: never burst.
      console.error(`CWC rate permit: ${waitMs}ms horizon for ${scope} — check rate_permits.next_allowed_at for corruption/clock skew`);
    }
    throw new RatePermitBackpressureError(scope, waitMs);
  }
  if (waitMs > 0) await sleep(waitMs);
  return waitMs;
}
