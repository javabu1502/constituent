import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSummaryLimiter = { check: vi.fn((): { success: boolean; retryAfter?: number } => ({ success: true })) };
const mockSingle = vi.fn(async () => ({ data: null, error: null }));

vi.mock('@/lib/rate-limit', () => ({
  summaryLimiter: mockSummaryLimiter,
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('@/lib/usage-quota', () => ({
  enforceDailyQuota: vi.fn(async () => ({ allowed: true, remaining: 10 })),
  resolveUsageIdentity: vi.fn(async () => ({ userId: null, ipHash: 'test-hash' })),
}));

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle,
          })),
        })),
      })),
    })),
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

describe('POST /api/feed/bill-summary security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSummaryLimiter.check.mockReturnValue({ success: true });
    mockSingle.mockResolvedValue({ data: null, error: null });
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  });

  it('requires Turnstile for anonymous uncached summary generation', async () => {
    const { POST } = await import('../feed/bill-summary/route');
    const req = new NextRequest('http://localhost/api/feed/bill-summary', {
      method: 'POST',
      body: JSON.stringify({
        bill_number: 'HR 1',
        title: 'Test Bill',
        sponsors: [],
        level: 'federal',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('requires Turnstile before cached personal relevance generation', async () => {
    mockSingle.mockResolvedValue({
      data: {
        data: {
          bill_number: 'HR 1',
          summary: 'Cached summary',
          arguments_for: 'For',
          arguments_against: 'Against',
          generated_at: '2026-01-01T00:00:00Z',
        },
        fetched_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    });

    const { POST } = await import('../feed/bill-summary/route');
    const req = new NextRequest('http://localhost/api/feed/bill-summary', {
      method: 'POST',
      body: JSON.stringify({
        bill_number: 'HR 1',
        title: 'Test Bill',
        sponsors: [],
        level: 'federal',
        userIssues: ['Environment'],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
