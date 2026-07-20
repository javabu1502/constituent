/**
 * Circuit breaker. Trips (and pauses posting) when publishing keeps failing,
 * so a broken token or a platform outage can't produce a burst of errors or
 * repeated bad posts. State is a single social_config row.
 */
import { createAdminClient } from '@/lib/supabase';

const KEY = 'circuit_breaker';
const CONSECUTIVE_FAIL_LIMIT = 3;

export interface BreakerState {
  tripped: boolean;
  consecutive_failures: number;
  error_count: number;
  last_error?: string | null;
  tripped_at?: string | null;
}

const DEFAULT: BreakerState = { tripped: false, consecutive_failures: 0, error_count: 0 };

async function read(): Promise<BreakerState> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('social_config').select('value').eq('key', KEY).maybeSingle();
    return { ...DEFAULT, ...((data?.value as BreakerState) ?? {}) };
  } catch {
    return { ...DEFAULT };
  }
}

async function write(state: BreakerState): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('social_config')
    .update({ value: state, updated_at: new Date().toISOString() })
    .eq('key', KEY);
}

export async function isTripped(): Promise<boolean> {
  return (await read()).tripped;
}

/** Decide whether a trip should happen given a pure state — testable. */
export function nextStateOnError(state: BreakerState, error: string): BreakerState {
  const consecutive_failures = state.consecutive_failures + 1;
  return {
    ...state,
    consecutive_failures,
    error_count: state.error_count + 1,
    last_error: error,
    tripped: state.tripped || consecutive_failures >= CONSECUTIVE_FAIL_LIMIT,
    tripped_at:
      !state.tripped && consecutive_failures >= CONSECUTIVE_FAIL_LIMIT
        ? new Date().toISOString()
        : state.tripped_at ?? null,
  };
}

export async function recordSuccess(): Promise<void> {
  const state = await read();
  if (state.consecutive_failures === 0 && !state.tripped) return; // nothing to reset
  await write({ ...state, consecutive_failures: 0 });
}

export async function recordFailure(error: string): Promise<BreakerState> {
  const next = nextStateOnError(await read(), error);
  await write(next);
  return next;
}

/** Manual reset (after fixing whatever tripped it). */
export async function resetBreaker(): Promise<void> {
  await write({ ...DEFAULT });
}

export { CONSECUTIVE_FAIL_LIMIT };
