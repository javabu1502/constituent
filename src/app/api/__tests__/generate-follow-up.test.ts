import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSingle = vi.fn();
const mockEq3 = vi.fn(() => ({ single: mockSingle }));
const mockEq2 = vi.fn(() => ({ eq: mockEq3, single: mockSingle }));
const mockEq = vi.fn(() => ({ eq: mockEq2, single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockInsert = vi.fn();

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect,
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

const mockGenerateLimiter = { check: vi.fn((): { success: boolean; retryAfter?: number } => ({ success: true })) };

vi.mock('@/lib/rate-limit', () => ({
  generateLimiter: mockGenerateLimiter,
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/lib/usage-quota', () => ({
  enforceDailyQuota: vi.fn(async () => ({ allowed: true, remaining: 10 })),
  resolveUsageIdentity: vi.fn(async () => ({ userId: null, ipHash: 'test-hash' })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
  })),
}));

const originalMessage = {
  legislator_name: 'Sen. Jane Smith',
  legislator_party: 'D',
  issue_area: 'Environment',
  issue_subtopic: 'Climate change',
  delivery_method: 'email',
  message_body: 'This is the original message body about climate change policy.',
  created_at: '2026-01-15T10:00:00Z',
};

const validBody = {
  originalMessageId: '550e8400-e29b-41d4-a716-446655440000',
  followUpType: 'no_response',
  senderName: 'John Doe',
};

const mockAnthropicResponse = {
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        officialName: 'Sen. Jane Smith',
        subject: 'Follow-up on climate concerns',
        body: 'I am writing to follow up on my previous message regarding climate change policy.',
      }),
    },
  ],
};

describe('POST /api/generate-follow-up', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateLimiter.check.mockReturnValue({ success: true });
    mockEq.mockClear();
    mockEq2.mockClear();
    mockEq3.mockClear();
    mockSingle.mockResolvedValue({ data: originalMessage, error: null });
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.TURNSTILE_SECRET_KEY = '';

    // Mock global fetch for Anthropic API calls
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnthropicResponse),
          text: () => Promise.resolve(JSON.stringify(mockAnthropicResponse)),
        })
      )
    );
  });

  it('returns 200 with generated follow-up for valid request', async () => {
    const { POST } = await import('../generate-follow-up/route');
    const req = new NextRequest('http://localhost/api/generate-follow-up', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.officialName).toBe('Sen. Jane Smith');
    expect(data.subject).toBeTruthy();
    expect(data.body).toBeTruthy();
    expect(mockEq).toHaveBeenCalledWith('id', validBody.originalMessageId);
    expect(mockEq2).toHaveBeenCalledWith('user_id', 'test-user-id');
  });

  it('does not load another user message by id', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found', code: 'PGRST116' } });

    const { POST } = await import('../generate-follow-up/route');
    const req = new NextRequest('http://localhost/api/generate-follow-up', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    expect(mockEq).toHaveBeenCalledWith('id', validBody.originalMessageId);
    expect(mockEq2).toHaveBeenCalledWith('user_id', 'test-user-id');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../generate-follow-up/route');
    const req = new NextRequest('http://localhost/api/generate-follow-up', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when originalMessageId is missing', async () => {
    const { POST } = await import('../generate-follow-up/route');
    const { originalMessageId: _, ...bodyWithout } = validBody;
    const req = new NextRequest('http://localhost/api/generate-follow-up', {
      method: 'POST',
      body: JSON.stringify(bodyWithout),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockGenerateLimiter.check.mockReturnValue({ success: false, retryAfter: 60 });

    const { POST } = await import('../generate-follow-up/route');
    const req = new NextRequest('http://localhost/api/generate-follow-up', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 403 when turnstile verification fails', async () => {
    // The route only runs turnstile verification when the secret key is set.
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    const { verifyTurnstile } = await import('@/lib/turnstile');
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

    const { POST } = await import('../generate-follow-up/route');
    const req = new NextRequest('http://localhost/api/generate-follow-up', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, turnstileToken: 'bad-token' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 404 when original message is not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found', code: 'PGRST116' } });

    const { POST } = await import('../generate-follow-up/route');
    const req = new NextRequest('http://localhost/api/generate-follow-up', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 503 when API key is missing', async () => {
    process.env.ANTHROPIC_API_KEY = '';

    const { POST } = await import('../generate-follow-up/route');
    const req = new NextRequest('http://localhost/api/generate-follow-up', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });
});
