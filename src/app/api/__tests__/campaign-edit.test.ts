import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSelectSingle = vi.fn();
const mockUpdatePayload = { value: null as Record<string, unknown> | null };
const mockUpdateSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        // org_members has no row, so resolveOrgContext falls back to "you are
        // your own organization" -- the behaviour these tests assert.
        eq: vi.fn(() => ({ single: mockSelectSingle, maybeSingle: async () => ({ data: null }) })),
      })),
      update: vi.fn((payload: Record<string, unknown>) => {
        mockUpdatePayload.value = payload;
        return {
          eq: vi.fn(() => ({
            select: vi.fn(() => ({ single: mockUpdateSingle })),
          })),
        };
      }),
    })),
  })),
}));

vi.mock('@/lib/resend', () => ({
  sendAdminNotification: vi.fn(async () => {}),
}));

vi.mock('@/lib/rate-limit', () => ({
  profileLimiter: { check: vi.fn(() => ({ success: true })) },
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/env', () => ({
  env: () => ({
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
    SUPABASE_SECRET_KEY: 'test-key',
  }),
}));

const ownedCampaign = {
  id: 'campaign-1',
  creator_id: 'creator-1',
  campaign_type: 'advocacy',
  parent_campaign_id: null,
  headline: 'Original headline',
  org_url: 'https://childrenscabinet.org',
  custom_domain: null,
};

function patchRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/campaigns/my-campaign', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

async function callPatch(body: Record<string, unknown>) {
  const { PATCH } = await import('../campaigns/[slug]/route');
  return PATCH(patchRequest(body), { params: Promise.resolve({ slug: 'my-campaign' }) });
}

describe('PATCH /api/campaigns/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdatePayload.value = null;
    mockGetUser.mockResolvedValue({ data: { user: { id: 'creator-1' } } });
    mockSelectSingle.mockResolvedValue({ data: ownedCampaign, error: null });
    mockUpdateSingle.mockResolvedValue({ data: { ...ownedCampaign, headline: 'New headline' }, error: null });
  });

  it('requires authentication', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await callPatch({ headline: 'New headline' });
    expect(res.status).toBe(401);
  });

  it('rejects non-creators', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'someone-else' } } });
    const res = await callPatch({ headline: 'New headline' });
    expect(res.status).toBe(403);
  });

  it('rejects stage campaigns', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { ...ownedCampaign, parent_campaign_id: 'parent-1' },
      error: null,
    });
    const res = await callPatch({ headline: 'New headline' });
    expect(res.status).toBe(400);
  });

  it('edits apply in place: the campaign stays live (orgs are account-vetted)', async () => {
    const res = await callPatch({ headline: 'New headline' });
    expect(res.status).toBe(200);
    expect(mockUpdatePayload.value).toMatchObject({ headline: 'New headline' });
    expect(mockUpdatePayload.value).not.toHaveProperty('approval_status');
    expect(mockUpdatePayload.value).not.toHaveProperty('status');
  });

  it('drops story-only fields on advocacy campaigns', async () => {
    await callPatch({ headline: 'New headline', story_prompt: 'sneaky', usage_tags: ['shared_with_media'] });
    expect(mockUpdatePayload.value).not.toHaveProperty('story_prompt');
    expect(mockUpdatePayload.value).not.toHaveProperty('usage_tags');
  });

  it('drops advocacy-only fields on storytelling campaigns', async () => {
    mockSelectSingle.mockResolvedValue({
      data: { ...ownedCampaign, campaign_type: 'storytelling' },
      error: null,
    });
    await callPatch({ headline: 'New headline', direction: 'oppose', distribution_plan: 'a plan long enough' });
    expect(mockUpdatePayload.value).not.toHaveProperty('direction');
    expect(mockUpdatePayload.value).not.toHaveProperty('distribution_plan');
  });

  it('rejects logo URLs outside our storage bucket', async () => {
    await callPatch({ headline: 'New headline', org_logo_url: 'https://evil.example.com/logo.png' });
    expect(mockUpdatePayload.value).toMatchObject({ org_logo_url: null });
  });

  it('rejects invalid field values', async () => {
    const res = await callPatch({ headline: 'ab' });
    expect(res.status).toBe(400);
  });

  // Both of these used to be absent from updateCampaignSchema, so the form
  // sent them and the route threw them away without saying so.
  it('saves the ask, which the edit form has always sent', async () => {
    await callPatch({ ask: 'Sign on as an original cosponsor before Friday.' });
    expect(mockUpdatePayload.value).toMatchObject({
      ask: 'Sign on as an original cosponsor before Friday.',
    });
  });

  it('saves a redirect on the org own domain', async () => {
    await callPatch({ redirect_url: 'https://childrenscabinet.org/thank-you' });
    expect(mockUpdatePayload.value).toMatchObject({
      redirect_url: 'https://childrenscabinet.org/thank-you',
    });
  });

  // The whole reason redirect_url could not simply be added to the schema.
  it('refuses a redirect to a host the org has not claimed', async () => {
    const res = await callPatch({ redirect_url: 'https://evil.example.com/landing' });
    expect(res.status).toBe(400);
    expect(mockUpdatePayload.value).toBeNull();
  });

  it('refuses a lookalike host', async () => {
    const res = await callPatch({ redirect_url: 'https://notchildrenscabinet.org/thanks' });
    expect(res.status).toBe(400);
  });

  // org_url and the redirect can change in one request, so the check has to
  // run against what the campaign will be, not what it was.
  it('allows a redirect to the org url being set in the same request', async () => {
    await callPatch({ org_url: 'https://geears.org', redirect_url: 'https://geears.org/thanks' });
    expect(mockUpdatePayload.value).toMatchObject({ redirect_url: 'https://geears.org/thanks' });
  });
});
