import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Insights generation is one model pass per POST. Owner-gating alone does not
// stop a held-down button, so the route is rate limited too. These tests pin
// that limit and the message the panel shows when it trips.

const mockGetUser = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: mockSingle })),
      })),
    })),
  })),
}));

const mockGenerate = vi.fn();
const mockGetCached = vi.fn();

vi.mock('@/lib/insights', () => ({
  MIN_SOURCES: 3,
  generateCampaignInsights: (...args: unknown[]) => mockGenerate(...args),
  getCachedInsights: (...args: unknown[]) => mockGetCached(...args),
}));

vi.mock('@/lib/env', () => ({
  env: () => ({
    ANTHROPIC_API_KEY: 'test-key',
    CLAUDE_MODEL: 'test-model',
    SUPABASE_SECRET_KEY: 'test-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
  }),
}));

const campaign = { id: 'campaign-1', creator_id: 'owner-1', campaign_type: 'storytelling' };

const fakeInsights = {
  summary: 'Families describe long waitlists for child care.',
  themes: [],
  sourceCount: 4,
  generatedAt: '2026-01-01T00:00:00Z',
};

function post(ip: string) {
  return new NextRequest('http://localhost/api/campaigns/my-campaign/insights', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  });
}

const params = { params: Promise.resolve({ slug: 'my-campaign' }) };

async function loadRoute() {
  return import('../campaigns/[slug]/insights/route');
}

type Handler = (req: NextRequest, ctx: typeof params) => Promise<Response>;

/** POST until the limiter rejects, with a hard bound so a broken limiter
 * fails the test instead of hanging it. */
async function postUntilBlocked(handler: Handler, ip: string): Promise<Response> {
  let last = await handler(post(ip), params);
  for (let i = 0; i < 50 && last.status === 200; i++) {
    last = await handler(post(ip), params);
  }
  return last;
}

describe('POST /api/campaigns/[slug]/insights rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fresh module registry gives each test its own limiter window.
    vi.resetModules();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'owner-1' } } });
    mockSingle.mockResolvedValue({ data: campaign, error: null });
    mockGenerate.mockResolvedValue(fakeInsights);
  });

  it('generates insights for the owner under the limit', async () => {
    const { POST } = await loadRoute();
    const res = await POST(post('9.0.0.1'), params);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.insights).toEqual(fakeInsights);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it('returns 429 once the per-minute limit is exceeded', async () => {
    const { POST } = await loadRoute();
    const last = await postUntilBlocked(POST, '9.0.0.2');

    expect(last.status).toBe(429);
    expect(Number(last.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('does not run a model pass on a rate-limited request', async () => {
    const { POST } = await loadRoute();
    const ip = '9.0.0.3';

    const last = await postUntilBlocked(POST, ip);
    expect(last.status).toBe(429);
    const callsWhenBlocked = mockGenerate.mock.calls.length;

    const again = await POST(post(ip), params);
    expect(again.status).toBe(429);
    expect(mockGenerate.mock.calls.length).toBe(callsWhenBlocked);
  });

  it('explains the wait in plain language the panel can show', async () => {
    const { POST } = await loadRoute();
    const last = await postUntilBlocked(POST, '9.0.0.4');
    expect(last.status).toBe(429);

    const data = await last.json();
    expect(data.error).toBe('rate_limited');
    expect(typeof data.reason).toBe('string');
    expect(data.reason).toMatch(/generate again/i);
    expect(data.reason).not.toContain('—');
  });

  it('counts each IP separately', async () => {
    const { POST } = await loadRoute();

    const last = await postUntilBlocked(POST, '9.0.0.5');
    expect(last.status).toBe(429);

    const other = await POST(post('9.0.0.6'), params);
    expect(other.status).toBe(200);
  });

  it('rejects a non-owner before spending the limit or a model pass', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'someone-else' } } });
    const { POST } = await loadRoute();

    const res = await POST(post('9.0.0.7'), params);
    expect(res.status).toBe(403);
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
