import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return {
          insert: mockInsert,
          select: vi.fn(() => ({
            eq: mockEq,
          })),
        };
      }
      return {};
    }),
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

const validCampaign = {
  headline: 'Save Our Parks',
  description: 'A campaign to protect national parks from development',
  issue_area: 'Environment',
  target_level: 'federal' as const,
};

describe('POST /api/campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockSingle.mockResolvedValue({
      data: { id: 'campaign-1', ...validCampaign, slug: 'save-our-parks-abc123' },
      error: null,
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
  });

  it('returns 200 with campaign for valid authenticated request', async () => {
    const { POST } = await import('../campaigns/route');
    const req = new NextRequest('http://localhost/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(validCampaign),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.headline).toBe('Save Our Parks');
  });

  it('returns 401 for unauthenticated request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import('../campaigns/route');
    const req = new NextRequest('http://localhost/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(validCampaign),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../campaigns/route');
    const req = new NextRequest('http://localhost/api/campaigns', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for Zod validation failure (short headline)', async () => {
    const { POST } = await import('../campaigns/route');
    const req = new NextRequest('http://localhost/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({ ...validCampaign, headline: 'AB' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 on Supabase insert error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

    const { POST } = await import('../campaigns/route');
    const req = new NextRequest('http://localhost/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(validCampaign),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockOrder.mockResolvedValue({
      data: [{ id: 'campaign-1', headline: 'Save Our Parks' }],
      error: null,
    });
    mockEq.mockReturnValue({ order: mockOrder });
  });

  it('returns 200 with campaigns array for authenticated user', async () => {
    const { GET } = await import('../campaigns/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('returns 401 for unauthenticated request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('../campaigns/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
