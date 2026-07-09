import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEq2 = vi.fn(() => ({ single: mockSingle }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2, single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq1 }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
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

const activeCampaign = {
  id: 'campaign-1',
  creator_id: 'creator-1',
  slug: 'public-campaign',
  headline: 'Public Campaign',
  description: 'A public campaign',
  issue_area: 'Environment',
  issue_subtopic: 'Climate',
  target_level: 'federal',
  status: 'active',
  approval_status: 'approved',
  recipient_email: 'private@example.com',
  review_note: 'admin-only note',
  distribution_plan: 'private distribution plan',
  reviewed_by: 'admin-1',
  approved_at: '2026-01-01T00:00:00Z',
  action_count: 4,
  story_count: 0,
  campaign_type: 'advocacy',
  visibility: 'public',
  message_template: 'Please support it.',
  created_at: '2026-01-01T00:00:00Z',
};

describe('GET /api/campaigns/[slug] public response', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockSingle.mockResolvedValue({ data: activeCampaign, error: null });
  });

  it('returns only public campaign fields for non-creators', async () => {
    const { GET } = await import('../campaigns/[slug]/route');
    const req = new NextRequest('http://localhost/api/campaigns/public-campaign');
    const res = await GET(req, { params: Promise.resolve({ slug: 'public-campaign' }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.headline).toBe('Public Campaign');
    expect(data.recipient_email).toBeUndefined();
    expect(data.review_note).toBeUndefined();
    expect(data.distribution_plan).toBeUndefined();
    expect(data.creator_id).toBeUndefined();
    expect(data.reviewed_by).toBeUndefined();
  });
});
