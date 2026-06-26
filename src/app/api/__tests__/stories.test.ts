import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSingle = vi.fn();
const mockEq3 = vi.fn(() => ({ single: mockSingle }));
const mockEq2 = vi.fn(() => ({ eq: mockEq3 }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
const mockCampaignSelect = vi.fn(() => ({ eq: mockEq1 }));
const mockStoriesInsert = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'campaigns') return { select: mockCampaignSelect };
      if (table === 'stories') return { insert: mockStoriesInsert };
      return {};
    }),
    rpc: mockRpc,
  })),
}));

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

// Keep attribution deterministic — its own unit test covers the logic.
const mockApply = vi.fn();
vi.mock('@/lib/story-attribution', () => ({
  applyAttribution: (...args: unknown[]) => mockApply(...args),
}));

vi.mock('@/lib/env', () => ({
  env: () => ({ ANTHROPIC_API_KEY: 'test-key', CLAUDE_MODEL: 'test-model', SUPABASE_SECRET_KEY: 'k', NEXT_PUBLIC_SUPABASE_URL: 'https://t.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'a' }),
}));

const mockWriteLimiter = { check: vi.fn((): { success: boolean; retryAfter?: number } => ({ success: true })) };
vi.mock('@/lib/rate-limit', () => ({
  writeLimiter: mockWriteLimiter,
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

const APPROVED_CAMPAIGN = {
  id: 'c1', slug: 'test', headline: 'Housing Stories',
  usage_statement: 'shared with legislators', usage_tags: ['shared_with_legislators'],
  attribution_options: ['named', 'anonymous'], recipient_email: 'creator@example.com',
  approval_status: 'approved', campaign_type: 'storytelling',
};

const validBody = {
  campaignSlug: 'test',
  title: 'My story',
  body: 'This is my story and it is definitely long enough to pass.',
  attribution_level: 'named',
  storyteller_name: 'Jane Doe',
  consent_usage: true,
  consent_truthful: true,
};

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/stories', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/stories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteLimiter.check.mockReturnValue({ success: true });
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockSingle.mockResolvedValue({ data: APPROVED_CAMPAIGN, error: null });
    mockStoriesInsert.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ error: null });
    mockApply.mockResolvedValue({ final_body: 'FINAL BODY', flagged: [] });
  });

  it('anonymous submission: counts but does not persist', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.persisted).toBe(false);
    expect(data.final_body).toBe('FINAL BODY');
    expect(data.recipient_email).toBe('creator@example.com');
    expect(mockRpc).toHaveBeenCalledWith('increment_campaign_story_count', { campaign_slug: 'test' });
    expect(mockStoriesInsert).not.toHaveBeenCalled();
  });

  it('logged-in submission: persists with a consent snapshot and still counts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.persisted).toBe(true);
    expect(mockRpc).toHaveBeenCalledOnce();
    expect(mockStoriesInsert).toHaveBeenCalledOnce();
    const inserted = mockStoriesInsert.mock.calls[0][0];
    expect(inserted.user_id).toBe('u1');
    expect(inserted.body).toBe('FINAL BODY');
    expect(inserted.consent_usage_snapshot).toEqual({ usage_statement: 'shared with legislators', usage_tags: ['shared_with_legislators'] });
  });

  it('rejects an attribution level the campaign does not allow', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, attribution_level: 'first_name_only' }));
    expect(res.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 400 when consent is not given', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, consent_usage: false }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the campaign is missing or not an approved storytelling campaign', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq('not json'));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockWriteLimiter.check.mockReturnValue({ success: false, retryAfter: 30 });
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
  });
});
