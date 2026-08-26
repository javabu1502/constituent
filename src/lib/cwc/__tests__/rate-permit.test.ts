import { describe, it, expect, afterEach, vi } from 'vitest';
import { acquireSendPermit, ratePermitScope, setRatePermitClientFactory, RatePermitBackpressureError } from '../rate-permit';

// The allocator itself is Postgres (allocate_rate_permit) — tests stub the
// RPC and verify the wrapper's slot math, fallback, and skew guard.

type RpcResult = { data: string | null; error: { message: string } | null };

function stubRpc(impl: (scope: string, gapMs: number) => RpcResult | Promise<RpcResult>) {
  const rpc = vi.fn(async (_fn: string, args: { p_scope: string; p_min_gap_ms: number }) =>
    impl(args.p_scope, args.p_min_gap_ms),
  );
  setRatePermitClientFactory(() => ({ rpc }) as never);
  return rpc;
}

afterEach(() => {
  setRatePermitClientFactory();
  vi.restoreAllMocks();
});

describe('ratePermitScope', () => {
  it('is per chamber + environment', () => {
    expect(ratePermitScope('senate', 'production')).toBe('cwc:senate:production');
    expect(ratePermitScope('house', 'test')).toBe('cwc:house:test');
  });
});

describe('acquireSendPermit', () => {
  it('does not wait when the slot is already due', async () => {
    const t0 = 1_000_000;
    stubRpc(() => ({ data: new Date(t0 - 50).toISOString(), error: null }));
    const sleep = vi.fn(async () => {});
    const waited = await acquireSendPermit('cwc:senate:test', { now: () => t0, sleep });
    expect(waited).toBe(0);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('sleeps until a future slot', async () => {
    const t0 = 1_000_000;
    stubRpc(() => ({ data: new Date(t0 + 350).toISOString(), error: null }));
    const sleep = vi.fn(async () => {});
    const waited = await acquireSendPermit('cwc:senate:test', { now: () => t0, sleep });
    expect(waited).toBe(350);
    expect(sleep).toHaveBeenCalledWith(350);
  });

  it('passes the gap derived from maxPerSecond to the allocator (clamped 1–10/sec)', async () => {
    const rpc = stubRpc(() => ({ data: new Date(0).toISOString(), error: null }));
    await acquireSendPermit('s', { maxPerSecond: 2, now: () => 0, sleep: async () => {} });
    expect(rpc).toHaveBeenCalledWith('allocate_rate_permit', { p_scope: 's', p_min_gap_ms: 500, p_max_wait_ms: 30_000 });
    await acquireSendPermit('s', { maxPerSecond: 99, now: () => 0, sleep: async () => {} });
    expect(rpc).toHaveBeenLastCalledWith('allocate_rate_permit', { p_scope: 's', p_min_gap_ms: 100, p_max_wait_ms: 30_000 });
  });

  it('falls back to one local gap when the allocator errors (fail-open)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubRpc(() => ({ data: null, error: { message: 'relation missing' } }));
    const sleep = vi.fn(async () => {});
    const waited = await acquireSendPermit('cwc:house:test', { now: () => 0, sleep });
    expect(waited).toBe(200); // default 5/sec gap
    expect(sleep).toHaveBeenCalledWith(200);
    expect(console.error).toHaveBeenCalled();
  });

  it('defers (throws backpressure) when the queue horizon exceeds maxWaitMs — never bursts', async () => {
    const t0 = 0;
    stubRpc(() => ({ data: new Date(t0 + 60_000).toISOString(), error: null }));
    const sleep = vi.fn(async () => {});
    await expect(acquireSendPermit('cwc:house:test', { now: () => t0, sleep })).rejects.toThrow(RatePermitBackpressureError);
    expect(sleep).not.toHaveBeenCalled(); // the old behavior slept a token gap and SENT anyway
  });

  it('carries the horizon so callers can schedule the retry', async () => {
    const t0 = 0;
    stubRpc(() => ({ data: new Date(t0 + 45_000).toISOString(), error: null }));
    const err = await acquireSendPermit('cwc:senate:production', { now: () => t0, sleep: async () => {} }).catch((e) => e);
    expect(err).toBeInstanceOf(RatePermitBackpressureError);
    expect((err as RatePermitBackpressureError).retryAfterMs).toBe(45_000);
  });

  it('honors a caller-raised maxWaitMs instead of deferring', async () => {
    const t0 = 0;
    stubRpc(() => ({ data: new Date(t0 + 60_000).toISOString(), error: null }));
    const sleep = vi.fn(async () => {});
    const waited = await acquireSendPermit('cwc:house:test', { now: () => t0, sleep, maxWaitMs: 120_000 });
    expect(waited).toBe(60_000);
    expect(sleep).toHaveBeenCalledWith(60_000);
  });

  it('flags a >10min horizon as possible row corruption (but still defers)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubRpc(() => ({ data: new Date(3_600_000).toISOString(), error: null }));
    await expect(acquireSendPermit('cwc:house:test', { now: () => 0, sleep: async () => {} })).rejects.toThrow(RatePermitBackpressureError);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('corruption'));
  });
});
