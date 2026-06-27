import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSingle = vi.fn();
const mockEq3 = vi.fn(() => ({ single: mockSingle }));
const mockEq2 = vi.fn(() => ({ eq: mockEq3 }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
const mockCampaignSelect = vi.fn(() => ({ eq: mockEq1 }));
const mockSubjectInsert = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'campaigns') return { select: mockCampaignSelect };
      if (table === 'story_subjects') return { insert: mockSubjectInsert };
      return {};
    }),
    rpc: mockRpc,
  })),
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
  recipient_email: 'creator@example.com',
  approval_status: 'approved', campaign_type: 'storytelling',
};

const validBody = {
  campaignSlug: 'test',
  title: 'My story',
  body: 'This is my story and it is definitely long enough to pass.',
  attribution_level: 'named',
  storyteller_name: 'Jane Doe',
  granted_uses: ['shared_with_legislators', 'published_web_social'],
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
    mockSingle.mockResolvedValue({ data: APPROVED_CAMPAIGN, error: null });
    mockSubjectInsert.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ error: null });
    mockApply.mockResolvedValue({ final_body: 'FINAL BODY', flagged: [] });
  });

  it('counts the submission and stores only a scrubbed subject — never the body', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.final_body).toBe('FINAL BODY');
    expect(data.recipient_email).toBe('creator@example.com');
    expect(data.persisted).toBeUndefined(); // nothing about persistence is reported
    expect(mockRpc).toHaveBeenCalledWith('increment_campaign_story_count', { campaign_slug: 'test' });

    // Only a title is stored — no body, no name, no user link.
    expect(mockSubjectInsert).toHaveBeenCalledOnce();
    const inserted = mockSubjectInsert.mock.calls[0][0];
    expect(inserted).toEqual({ campaign_id: 'c1', title: 'My story' });
    expect(JSON.stringify(inserted)).not.toContain('This is my story');
  });

  it('strips the storyteller name out of the stored subject title', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, title: 'Why Jane Doe is closing her daycare' }));
    expect(res.status).toBe(200);
    const inserted = mockSubjectInsert.mock.calls[0][0];
    expect(inserted.title).not.toMatch(/Jane/i);
    expect(inserted.title).toContain('daycare');
  });

  it('requires at least one granted use', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, granted_uses: [] }));
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
