import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({ createAdminClient: vi.fn() }));

describe('campaign-updates unsubscribe tokens', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('CRON_SECRET', 'test-secret');
  });

  it('round-trips and is case-insensitive on email', async () => {
    const { updatesUnsubscribeToken, verifyUpdatesUnsubscribeToken } = await import('../campaign-updates');
    const t = updatesUnsubscribeToken('Advocate@Example.org');
    expect(verifyUpdatesUnsubscribeToken('advocate@example.org', t)).toBe(true);
  });

  it('rejects a tampered token or wrong email', async () => {
    const { updatesUnsubscribeToken, verifyUpdatesUnsubscribeToken } = await import('../campaign-updates');
    const t = updatesUnsubscribeToken('a@b.com');
    expect(verifyUpdatesUnsubscribeToken('a@b.com', t.slice(0, -1) + 'x')).toBe(false);
    expect(verifyUpdatesUnsubscribeToken('other@b.com', t)).toBe(false);
    expect(verifyUpdatesUnsubscribeToken('a@b.com', 'short')).toBe(false);
  });
});
