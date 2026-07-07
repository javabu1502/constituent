import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLookupLimiter = { check: vi.fn((): { success: boolean; retryAfter?: number } => ({ success: true })) };

vi.mock('@/lib/rate-limit', () => ({
  lookupLimiter: mockLookupLimiter,
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('@/lib/usage-quota', () => ({
  resolveUsageIdentity: vi.fn(async () => ({ userId: null, ipHash: 'test-hash' })),
}));

vi.mock('@/lib/civic-api', () => ({
  fetchLocalOfficials: vi.fn(),
}));

describe('POST /api/local-officials security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLookupLimiter.check.mockReturnValue({ success: true });
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  });

  it('requires Turnstile for anonymous local official lookups', async () => {
    const { POST } = await import('../local-officials/route');
    const req = new Request('http://localhost/api/local-officials', {
      method: 'POST',
      body: JSON.stringify({ street: '1 Main St', city: 'Austin', state: 'TX', zip: '78701' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
