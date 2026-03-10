import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockInsert = vi.fn();
const mockSingle = vi.fn();
const mockEq2 = vi.fn(() => ({ single: mockSingle }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return { select: mockSelect };
      }
      if (table === 'campaign_actions') {
        return { insert: mockInsert };
      }
      return { insert: vi.fn(), select: vi.fn() };
    }),
    rpc: mockRpc,
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
  participant_name: 'John Doe',
  participant_city: 'Sacramento',
  participant_state: 'CA',
  messages_sent: 3,
};

describe('POST /api/campaigns/[slug]/participate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteLimiter.check.mockReturnValue({ success: true });
    mockSingle.mockResolvedValue({ data: { id: 'campaign-uuid-123' }, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ error: null });
  });

  it('returns 200 with success for valid participation', async () => {
    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.campaign_id).toBe('campaign-uuid-123');
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockWriteLimiter.check.mockReturnValue({ success: false, retryAfter: 30 });

    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(429);
  });

  it('returns 404 when campaign is not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found', code: 'PGRST116' } });

    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/missing-campaign/participate', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'missing-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(404);
  });

  it('returns 500 when campaign action insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'Insert failed' } });

    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(500);
  });
});
