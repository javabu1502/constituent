import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('allows requests under the limit', async () => {
    const { rateLimit } = await import('../rate-limit');
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 3 });

    expect(limiter.check('1.1.1.1').success).toBe(true);
    expect(limiter.check('1.1.1.1').success).toBe(true);
    expect(limiter.check('1.1.1.1').success).toBe(true);
  });

  it('blocks requests over the limit', async () => {
    const { rateLimit } = await import('../rate-limit');
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2 });

    limiter.check('1.1.1.1');
    limiter.check('1.1.1.1');
    const result = limiter.check('1.1.1.1');
    expect(result.success).toBe(false);
  });

  it('returns correct retryAfter value', async () => {
    const { rateLimit } = await import('../rate-limit');
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 1 });

    limiter.check('1.1.1.1');
    const result = limiter.check('1.1.1.1');
    expect(result.success).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.retryAfter).toBeLessThanOrEqual(60);
  });

  it('cleans up timestamps outside the window', async () => {
    const { rateLimit } = await import('../rate-limit');
    const limiter = rateLimit({ windowMs: 100, maxRequests: 1 });

    limiter.check('1.1.1.1');
    // Wait for the window to expire
    await new Promise(r => setTimeout(r, 150));
    const result = limiter.check('1.1.1.1');
    expect(result.success).toBe(true);
  });

  it('tracks different IPs independently', async () => {
    const { rateLimit } = await import('../rate-limit');
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 1 });

    expect(limiter.check('1.1.1.1').success).toBe(true);
    expect(limiter.check('2.2.2.2').success).toBe(true);
    expect(limiter.check('1.1.1.1').success).toBe(false);
    expect(limiter.check('2.2.2.2').success).toBe(false);
  });

  it('allows requests again after the window expires', async () => {
    const { rateLimit } = await import('../rate-limit');
    const limiter = rateLimit({ windowMs: 100, maxRequests: 1 });

    limiter.check('1.1.1.1');
    expect(limiter.check('1.1.1.1').success).toBe(false);

    await new Promise(r => setTimeout(r, 150));
    expect(limiter.check('1.1.1.1').success).toBe(true);
  });
});

describe('getClientIp', () => {
  it('extracts first IP from x-forwarded-for header', async () => {
    const { getClientIp } = await import('../rate-limit');
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to 127.0.0.1 when no header', async () => {
    const { getClientIp } = await import('../rate-limit');
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('127.0.0.1');
  });
});
