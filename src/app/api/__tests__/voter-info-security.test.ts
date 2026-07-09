import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

vi.mock('@/lib/env', () => ({
  env: () => ({
    ANTHROPIC_API_KEY: 'test-key',
    CLAUDE_MODEL: 'test-model',
    CONGRESS_API_KEY: 'test-key',
    SUPABASE_SECRET_KEY: 'test-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-maps',
  }),
}));

describe('GET /api/voter-info security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLookupLimiter.check.mockReturnValue({ success: true });
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  });

  it('requires Turnstile for anonymous address lookups', async () => {
    const { GET } = await import('../voter-info/route');
    const req = new NextRequest('http://localhost/api/voter-info?address=1%20Main%20St%2C%20Austin%2C%20TX%2078701');

    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
