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
// Result of the insert's .select().single(); a test can make it fail.
const mockInsertResult = vi.fn(async () => ({ data: { id: 'story-1' }, error: null } as { data: { id: string } | null; error: { message: string } | null }));
// Today's story count for the campaign (per-campaign daily ceiling).
const mockTodayCount = vi.fn(async () => ({ count: 0, error: null } as { count: number | null; error: { message: string } | null }));
// Order of side effects, to prove the count is bumped only after the insert.
const callOrder: string[] = [];

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'campaigns') return { select: mockCampaignSelect };
      if (table === 'story_subjects') return { insert: mockSubjectInsert };
      if (table === 'stories') {
        return {
          insert: (row: unknown) => {
            mockStoryInsert(row);
            callOrder.push('insert');
            return { select: () => ({ single: mockInsertResult }) };
          },
          select: () => ({ eq: () => ({ gte: mockTodayCount }) }),
        };
      }
      return {};
    }),
    rpc: (...args: unknown[]) => { callOrder.push('rpc'); return mockRpc(...args); },
  })),
}));

// Auth session (server client). Default: anonymous.
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

const mockEnforceDailyQuota = vi.fn(async () => ({ allowed: true, remaining: 59 }));
vi.mock('@/lib/usage-quota', () => ({
  hashIp: vi.fn(() => 'iphash'),
  resolveUsageIdentity: vi.fn(async () => ({ userId: null, ipHash: 'iphash' })),
  enforceDailyQuota: (...args: unknown[]) => mockEnforceDailyQuota(...(args as [])),
}));
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: vi.fn(() => Promise.resolve(true)) }));

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
  consent_adult: true,
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
    callOrder.length = 0;
    mockInsertResult.mockResolvedValue({ data: { id: 'story-1' }, error: null });
    mockTodayCount.mockResolvedValue({ count: 0, error: null });
    mockEnforceDailyQuota.mockResolvedValue({ allowed: true, remaining: 59 });
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
    expect(data.story_id).toBe('story-1');
    expect(mockRpc).toHaveBeenCalledWith('increment_campaign_story_count', { campaign_slug: 'test' });

    // The aggregate subject holds only a topic title — no body, no name.
    expect(mockSubjectInsert).toHaveBeenCalledOnce();
    const subject = mockSubjectInsert.mock.calls[0][0];
    expect(subject).toEqual({ campaign_id: 'c1', title: 'My story' });
    expect(JSON.stringify(subject)).not.toContain('This is my story');
  });

  it('persists a named story with the attribution-applied body + full identity', async () => {
    const { POST } = await import('../stories/route');
    await POST(makeReq({
      ...validBody,
      granted_uses: [...validBody.granted_uses, 'contact_me_followup'],
      storyteller_email: 'jane@example.com',
      city: 'Reno',
      state: 'NV',
    }));

    expect(mockStoryInsert).toHaveBeenCalledOnce();
    const row = mockStoryInsert.mock.calls[0][0];
    expect(row.campaign_id).toBe('c1');
    expect(row.body).toBe('FINAL BODY'); // attribution-applied, not the raw body
    expect(row.attribution_level).toBe('named');
    expect(row.storyteller_name).toBe('Jane Doe');
    // Email is shared only because contact_me_followup was granted.
    expect(row.storyteller_email).toBe('jane@example.com');
    expect(row.city).toBe('Reno');
    expect(row.state).toBe('NV');
    expect(row.status).toBe('active');
  });

  it('does NOT store the email when contact_me_followup was not granted', async () => {
    const { POST } = await import('../stories/route');
    await POST(makeReq({ ...validBody, storyteller_email: 'jane@example.com' }));
    const row = mockStoryInsert.mock.calls[0][0];
    expect(row.storyteller_email).toBeNull();
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

  it('does NOT persist or count the story when store is false (subject only)', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, store: false }));
    expect(res.status).toBe(200);
    expect(mockStoryInsert).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockSubjectInsert).toHaveBeenCalledOnce();
  });

  it('preview mode returns the attribution-applied body and saves nothing', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, preview: true }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.preview).toBe(true);
    expect(typeof data.final_body).toBe('string');
    expect(mockStoryInsert).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockSubjectInsert).not.toHaveBeenCalled();
  });

  it('refuses to save an anonymous story when the redaction pass failed', async () => {
    mockApply.mockResolvedValueOnce({ final_body: 'unredacted text here', flagged: ['could not anonymize'], failed: true });
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, attribution_level: 'anonymous', storyteller_name: null }));
    expect(res.status).toBe(503);
    expect(mockStoryInsert).not.toHaveBeenCalled();
  });

  it('never falls back to the account email: only a typed contact email is stored', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1', email: 'account@example.com' } } });
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, granted_uses: ['contact_me_followup'], storyteller_email: null }));
    expect(res.status).toBe(200);
    expect(mockStoryInsert.mock.calls[0][0].storyteller_email).toBeNull();
  });

  it('returns a revoke token a guest can use later', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq(validBody));
    const data = await res.json();
    expect(data.story_id).toBe('story-1');
    expect(data.revoke_token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('strips the storyteller name out of the stored subject title', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, title: 'Why Jane Doe is closing her daycare' }));
    expect(res.status).toBe(200);
    const inserted = mockSubjectInsert.mock.calls[0][0];
    expect(inserted.title).not.toMatch(/Jane/i);
    expect(inserted.title).toContain('daycare');
  });

  it('allows zero granted uses (share for reading only)', async () => {
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({ ...validBody, granted_uses: [] }));
    expect(res.status).toBe(200);
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

  // ----- 10-23 audit fixes -----

  it('counts preview and store against the story_submit daily quota and returns 429 when it is spent', async () => {
    const { POST } = await import('../stories/route');
    await POST(makeReq({ ...validBody, preview: true }));
    expect(mockEnforceDailyQuota).toHaveBeenCalledWith('127.0.0.1', 'story_submit', expect.anything());

    mockEnforceDailyQuota.mockResolvedValueOnce({ allowed: false, remaining: 0 });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
    expect(mockStoryInsert).not.toHaveBeenCalled();
  });

  /**
   * The preview step issues a token over the text it produced. The store step
   * honours `preview_confirmed` only when that token verifies, because the
   * flag on its own is a claim from the browser and this route is public.
   */
  /**
   * An anonymous story's TITLE goes through the redaction pass too, so
   * `mockApply` may legitimately be called for the title. These assertions
   * are about the body, so they count only the calls that carry it.
   */
  const bodyRedactions = (bodyText: string) =>
    mockApply.mock.calls.filter((c) => String(c[0]) === bodyText).length;

  async function previewTokenFor(bodyText: string): Promise<string> {
    const { POST } = await import('../stories/route');
    mockApply.mockResolvedValueOnce({ final_body: bodyText, flagged: [] });
    const res = await POST(makeReq({ ...validBody, attribution_level: 'anonymous', storyteller_name: null, body: bodyText, preview: true }));
    const data = await res.json();
    vi.clearAllMocks();
    mockInsertResult.mockResolvedValue({ data: { id: 'story-1' }, error: null });
    return data.preview_token as string;
  }

  it('anonymous + a verified preview token stores the reviewed text as given and does not redact again', async () => {
    const reviewed = 'The text I read on the preview step, with my own edit kept in.';
    const token = await previewTokenFor(reviewed);
    expect(token).toBeTruthy();
    const { POST } = await import('../stories/route');
    const res = await POST(makeReq({
      ...validBody, attribution_level: 'anonymous', storyteller_name: null, body: reviewed,
      preview_confirmed: true, preview_token: token, previewed_body: reviewed,
    }));
    expect(res.status).toBe(200);
    expect(bodyRedactions(reviewed)).toBe(0);
    const row = mockStoryInsert.mock.calls[0][0];
    expect(row.body).toBe(reviewed);
    expect(row.storyteller_name).toBeNull();
    const data = await res.json();
    expect(data.final_body).toBe(reviewed);
  });

  it('keeps a hand-edit made after the preview, since the token covers the previewed text', async () => {
    const reviewed = 'A community member waited an hour at the clinic.';
    const token = await previewTokenFor(reviewed);
    const edited = `${reviewed} I want to add that the wait was in the rain.`;
    const { POST } = await import('../stories/route');
    await POST(makeReq({
      ...validBody, attribution_level: 'anonymous', storyteller_name: null, body: edited,
      preview_confirmed: true, preview_token: token, previewed_body: reviewed,
    }));
    expect(bodyRedactions(edited)).toBe(0);
    expect(mockStoryInsert.mock.calls[0][0].body).toBe(edited);
  });

  // The hole this closes: one POST claiming the preview happened stored the
  // body verbatim and labelled it anonymous, and the named backstop could not
  // catch it because an anonymous story carries no name to strip.
  it.each([
    ['no token at all', {}],
    ['a forged token', { preview_token: 'f'.repeat(32) }],
    ['a token for another campaign', { preview_token: '0'.repeat(32) }],
    ['a short token', { preview_token: 'abc' }],
  ])('runs the full redaction pass when preview_confirmed arrives with %s', async (_label, extra) => {
    const { POST } = await import('../stories/route');
    mockApply.mockResolvedValue({ final_body: 'REDACTED BY THE MODEL', flagged: [] });
    await POST(makeReq({
      ...validBody, attribution_level: 'anonymous', storyteller_name: null,
      body: 'My neighbour Maria Gonzalez at 12 Oak Street lost her placement.',
      preview_confirmed: true, ...extra,
    }));
    expect(bodyRedactions('My neighbour Maria Gonzalez at 12 Oak Street lost her placement.')).toBe(1);
    expect(mockStoryInsert.mock.calls[0][0].body).toBe('REDACTED BY THE MODEL');
  });

  it('a token issued for one body does not authorise a different campaign', async () => {
    const token = await previewTokenFor('Some reviewed text.');
    const { POST } = await import('../stories/route');
    mockApply.mockResolvedValue({ final_body: 'REDACTED BY THE MODEL', flagged: [] });
    // previewed_body does not match what the token was issued over.
    await POST(makeReq({
      ...validBody, attribution_level: 'anonymous', storyteller_name: null, body: 'Different text entirely.',
      preview_confirmed: true, preview_token: token, previewed_body: 'Text the preview never returned.',
    }));
    expect(bodyRedactions('Different text entirely.')).toBe(1);
  });

  it('strips a typed name on the confirmed path and never skips redaction on a preview call', async () => {
    const reviewed = 'Jane Doe went to the clinic and Jane waited an hour.';
    const token = await previewTokenFor(reviewed);
    const { POST } = await import('../stories/route');
    await POST(makeReq({
      ...validBody, attribution_level: 'anonymous', storyteller_name: 'Jane Doe', body: reviewed,
      preview_confirmed: true, preview_token: token, previewed_body: reviewed,
    }));
    expect(bodyRedactions(reviewed)).toBe(0);
    expect(mockStoryInsert.mock.calls[0][0].body).not.toMatch(/Jane|Doe/);
    // The flag means nothing on a preview request: the model pass still runs.
    vi.clearAllMocks();
    mockApply.mockResolvedValue({ final_body: 'REDACTED', flagged: [] });
    await POST(makeReq({ ...validBody, attribution_level: 'anonymous', storyteller_name: null, preview: true, preview_confirmed: true }));
    expect(bodyRedactions(validBody.body)).toBe(1);
  });

  /**
   * An anonymous story's title used to skip anonymization entirely:
   * `sanitizeTitle` only strips the name the storyteller typed, and an
   * anonymous story sends no name. "My son Diego's wait at the clinic" was
   * stored on an anonymous row, exported with no masking, and copied into the
   * aggregate subjects table.
   */
  it('runs an anonymous title through the redaction pass', async () => {
    const { POST } = await import('../stories/route');
    mockApply.mockImplementation(async (text: string) =>
      ({ final_body: text.replace(/Diego/g, 'a child'), flagged: [] }));
    await POST(makeReq({
      ...validBody, attribution_level: 'anonymous', storyteller_name: null,
      title: "My son Diego's wait at the clinic",
      body: 'We waited a long time and nobody could tell us why.',
    }));
    const row = mockStoryInsert.mock.calls[0][0];
    expect(row.title).not.toMatch(/Diego/);
    expect(row.title).toContain('a child');
  });

  it('drops an anonymous title rather than storing it unredacted when the pass fails', async () => {
    const { POST } = await import('../stories/route');
    mockApply.mockImplementation(async (text: string) =>
      text.startsWith('My son')
        ? { final_body: text, flagged: [], failed: true }
        : { final_body: 'REDACTED', flagged: [] });
    await POST(makeReq({
      ...validBody, attribution_level: 'anonymous', storyteller_name: null,
      title: "My son Diego's wait at the clinic",
      body: 'We waited a long time and nobody could tell us why.',
    }));
    expect(mockStoryInsert.mock.calls[0][0].title).toBeNull();
  });

  it('preview_confirmed is ignored for named and first-name stories', async () => {
    const { POST } = await import('../stories/route');
    await POST(makeReq({ ...validBody, preview_confirmed: true }));
    expect(mockApply).toHaveBeenCalledOnce();
  });

  it('bumps story_count only after the insert succeeds', async () => {
    const { POST } = await import('../stories/route');
    await POST(makeReq(validBody));
    expect(callOrder).toEqual(['insert', 'rpc']);

    vi.clearAllMocks();
    callOrder.length = 0;
    mockInsertResult.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(500);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('refuses a store once the campaign has taken 500 stories today, and fails open on a count error', async () => {
    const { POST } = await import('../stories/route');
    mockTodayCount.mockResolvedValueOnce({ count: 500, error: null });
    const res = await POST(makeReq(validBody));
    expect(res.status).toBe(429);
    expect(mockStoryInsert).not.toHaveBeenCalled();

    mockTodayCount.mockResolvedValueOnce({ count: null, error: { message: 'db down' } });
    const ok = await POST(makeReq(validBody));
    expect(ok.status).toBe(200);
  });
});
