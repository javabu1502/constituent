import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSingle = vi.fn();
const mockEq3 = vi.fn(() => ({ single: mockSingle }));
const mockEq2 = vi.fn(() => ({ eq: mockEq3 }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
const mockCampaignSelect = vi.fn(() => ({ eq: mockEq1 }));
const mockSubjectInsert = vi.fn();
const mockStoryInsert = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'campaigns') return { select: mockCampaignSelect };
      if (table === 'story_subjects') return { insert: mockSubjectInsert };
      if (table === 'stories') return { insert: mockStoryInsert };
      return {};
    }),
    rpc: mockRpc,
  })),
}));

// Auth session (server client). Default: anonymous.
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock('@/lib/usage-quota', () => ({ hashIp: vi.fn(() => 'iphash') }));

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
  usage_statement: 'To advocate for housing',
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
    mockStoryInsert.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ error: null });
    mockApply.mockResolvedValue({ final_body: 'FINAL BODY', flagged: [] });
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it('counts the submission and stores a scrubbed subject (no body in subjects)', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.final_body).toBe('FINAL BODY');
    expect(data.recipient_email).toBe('creator@example.com');
    expect(mockRpc).toHaveBeenCalledWith('increment_campaign_story_count', { campaign_slug: 'test' });

    // The aggregate subject holds only a topic title — no body, no name.
    expect(mockSubjectInsert).toHaveBeenCalledOnce();
    const subject = mockSubjectInsert.mock.calls[0][0];
    expect(subject).toEqual({ campaign_id: 'c1', title: 'My story' });
    expect(JSON.stringify(subject)).not.toContain('This is my story');
  });

  it('persists a named story with the attribution-applied body + full identity', async () => {
    const { POST } = await import('../stories/route');
    await POST(makeReq({ ...validBody, storyteller_email: 'jane@example.com', city: 'Reno', state: 'NV' }));

    expect(mockStoryInsert).toHaveBeenCalledOnce();
    const row = mockStoryInsert.mock.calls[0][0];
    expect(row.campaign_id).toBe('c1');
    expect(row.body).toBe('FINAL BODY'); // attribution-applied, not the raw body
    expect(row.attribution_level).toBe('named');
    expect(row.storyteller_name).toBe('Jane Doe');
    expect(row.storyteller_email).toBe('jane@example.com');
    expect(row.city).toBe('Reno');
    expect(row.state).toBe('NV');
    expect(row.status).toBe('active');
    expect(row.consent_usage_snapshot.granted_uses).toEqual(validBody.granted_uses);
  });

  it('stores only the first name for first_name_only attribution', async () => {
    const { POST } = await import('../stories/route');
    await POST(makeReq({ ...validBody, attribution_level: 'first_name_only', city: 'Reno', state: 'NV' }));
    const row = mockStoryInsert.mock.calls[0][0];
    expect(row.storyteller_name).toBe('Jane');
  });

  it('stores NO identity for anonymous attribution', async () => {
    const { POST } = await import('../stories/route');
    await POST(makeReq({
      ...validBody,
      attribution_level: 'anonymous',
      storyteller_name: null,
      storyteller_email: 'jane@example.com',
      city: 'Reno',
      state: 'NV',
    }));
    const row = mockStoryInsert.mock.calls[0][0];
    expect(row.attribution_level).toBe('anonymous');
    expect(row.storyteller_name).toBeNull();
    expect(row.storyteller_email).toBeNull();
    expect(row.city).toBeNull();
    expect(row.state).toBeNull();
    expect(row.body).toBe('FINAL BODY'); // redacted body still saved
  });

  it('does NOT persist the story when store is false (but still counts + subject)', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, store: false }));
    expect(res.status).toBe(200);
    expect(mockStoryInsert).not.toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledOnce();
    expect(mockSubjectInsert).toHaveBeenCalledOnce();
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
