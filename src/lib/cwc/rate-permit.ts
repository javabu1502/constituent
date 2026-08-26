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
  /** Injectable clock and sleeper for tests. */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Block until this caller owns the next send slot for `scope`. Returns the
 * wait that was applied in ms (0 when the slot was immediately available) —
 * callers only need the side effect, but the wait makes logging/tests easy.
 */
export async function acquireSendPermit(
  scope: string,
  opts: AcquirePermitOptions = {},
): Promise<number> {
  const rate = Math.max(1, Math.min(10, opts.maxPerSecond ?? MAX_MESSAGES_PER_SECOND));
  const gapMs = Math.ceil(1000 / rate);
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? defaultSleep;

  try {
    const db = clientFactory();
    const { data, error } = await db.rpc('allocate_rate_permit', {
      p_scope: scope,
      p_min_gap_ms: gapMs,
    });
    if (error || !data) throw new Error(error?.message ?? 'allocate_rate_permit returned no slot');

    const slotMs = new Date(data as string).getTime();
    const waitMs = Math.max(0, slotMs - now());
    // Guard against clock skew / a corrupted row producing an absurd wait:
    // never sleep more than 30s for one permit — log and proceed instead.
    if (waitMs > 30_000) {
      console.error(`CWC rate permit: implausible ${waitMs}ms wait for ${scope} — sending after fallback gap`);
      await sleep(gapMs);
      return gapMs;
    }
    if (waitMs > 0) await sleep(waitMs);
    return waitMs;
  } catch (e) {
    console.error(`CWC rate permit: allocator unavailable for ${scope}, falling back to local pacing:`, e);
    await sleep(gapMs);
    return gapMs;
  }
}
