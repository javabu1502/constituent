import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * PATCH /api/stories/[id]: a signed-in storyteller edits their own story.
 * An anonymous story whose redaction pass failed is never saved (10-23
 * audit: this path used to store the un-redacted edit).
 */

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

const mockUpdate = vi.fn();
const mockInsightsDelete = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
const existing = { id: 's1', attribution_level: 'anonymous', storyteller_name: null, campaign_id: 'c1' };
vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'stories') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: existing, error: null }) }) }) }) }),
          update: (patch: unknown) => {
            mockUpdate(patch);
            return { eq: () => ({ eq: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: { id: 's1' }, error: null }) }) }) }) }) };
          },
        };
      }
      if (table === 'campaign_insights') return { delete: mockInsightsDelete };
      return {};
    }),
  })),
}));

const mockApply = vi.fn();
vi.mock('@/lib/story-attribution', () => ({ applyAttribution: (...a: unknown[]) => mockApply(...a) }));
vi.mock('@/lib/language', () => ({ renderStoryEnglish: vi.fn(async () => ({ language: 'en', body_en: null })) }));
vi.mock('@/lib/claude', () => ({ deDash: (s: string) => s }));
vi.mock('@/lib/env', () => ({ env: () => ({ SUPABASE_SECRET_KEY: 'k', NEXT_PUBLIC_SUPABASE_URL: 'https://t.supabase.co' }) }));

function patchReq(body: unknown) {
  return new NextRequest('http://localhost/api/stories/s1', { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}
const params = Promise.resolve({ id: 's1' });

describe('PATCH /api/stories/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
  });

  it('saves a re-redacted anonymous edit and drops the cached insights', async () => {
    mockApply.mockResolvedValue({ final_body: 'REDACTED EDIT', flagged: [] });
    const { PATCH } = await import('../stories/[id]/route');
    const res = await PATCH(patchReq({ body: 'My edited story with a new detail in it.' }), { params });
    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0][0].body).toBe('REDACTED EDIT');
    expect(mockInsightsDelete).toHaveBeenCalled();
  });

  it('returns 503 and changes nothing when the anonymous redaction failed', async () => {
    mockApply.mockResolvedValue({ final_body: 'UNREDACTED EDIT', flagged: ['could not anonymize'], failed: true });
    const { PATCH } = await import('../stories/[id]/route');
    const res = await PATCH(patchReq({ body: 'My edited story with my full name and street in it.' }), { params });
    expect(res.status).toBe(503);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsightsDelete).not.toHaveBeenCalled();
  });

  it('requires a session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { PATCH } = await import('../stories/[id]/route');
    const res = await PATCH(patchReq({ body: 'My edited story with a new detail in it.' }), { params });
    expect(res.status).toBe(401);
  });
});
