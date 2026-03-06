import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('verifyTurnstile()', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns true when TURNSTILE_SECRET_KEY is not set (bypass mode)', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    const { verifyTurnstile } = await import('../turnstile');
    const result = await verifyTurnstile('any-token');
    expect(result).toBe(true);
  });

  it('calls Cloudflare siteverify and returns true on success', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');

    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { verifyTurnstile } = await import('../turnstile');
    const result = await verifyTurnstile('valid-token');

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );
  });

  it('returns false on failed verification', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');

    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { verifyTurnstile } = await import('../turnstile');
    const result = await verifyTurnstile('invalid-token');

    expect(result).toBe(false);
  });

  it('returns false when fetch throws', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');

    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    const { verifyTurnstile } = await import('../turnstile');
    const result = await verifyTurnstile('any-token');

    expect(result).toBe(false);
  });
});
