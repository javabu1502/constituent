import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockInsert = vi.fn();

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({ insert: mockInsert })),
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

const mockWriteLimiter = { check: vi.fn((): { success: boolean; retryAfter?: number } => ({ success: true })) };

vi.mock('@/lib/rate-limit', () => ({
  writeLimiter: mockWriteLimiter,
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

const validBody = {
  messageHash: 'abc123hash',
  rating: 'positive' as const,
  officialName: 'Sen. Jane Smith',
  officialParty: 'D',
  issueCategory: 'Environment',
  tone: 'formal',
  contactMethod: 'email',
};

describe('POST /api/message-feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockWriteLimiter.check.mockReturnValue({ success: true });
  });

  it('returns 200 with { success: true } for valid request', async () => {
    const { POST } = await import('../message-feedback/route');
    const req = new NextRequest('http://localhost/api/message-feedback', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../message-feedback/route');
    const req = new NextRequest('http://localhost/api/message-feedback', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when messageHash is missing', async () => {
    const { POST } = await import('../message-feedback/route');
    const { messageHash: _, ...bodyWithout } = validBody;
    const req = new NextRequest('http://localhost/api/message-feedback', {
      method: 'POST',
      body: JSON.stringify(bodyWithout),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid rating value', async () => {
    const { POST } = await import('../message-feedback/route');
    const req = new NextRequest('http://localhost/api/message-feedback', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, rating: 'neutral' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockWriteLimiter.check.mockReturnValue({ success: false, retryAfter: 30 });

    const { POST } = await import('../message-feedback/route');
    const req = new NextRequest('http://localhost/api/message-feedback', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 500 on Supabase insert error', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'Insert failed' } });

    const { POST } = await import('../message-feedback/route');
    const req = new NextRequest('http://localhost/api/message-feedback', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
