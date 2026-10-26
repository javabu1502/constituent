import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * POST /api/campaigns/[slug]/status: the owner closes a campaign or reopens
 * it. Ownership is checked on the server against the row, never against a
 * client flag, and closing a parent initiative takes its steps with it.
 */

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

const mockUpdate = vi.fn();
const mockEq = vi.fn();
let campaignRow: { id: string; creator_id: string; parent_campaign_id: string | null } | null = null;
let parentResult: { error: unknown } = { error: null };
let stepResult: { data: { id: string }[] | null; error: unknown } = { data: [], error: null };

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: campaignRow, error: campaignRow ? null : { message: 'no rows' } }) }) }),
      update: (patch: Record<string, unknown>) => {
        mockUpdate(patch);
        return {
          eq: (column: string, value: string) => {
            mockEq(column, value);
            // The parent update is awaited directly; the step update chains
            // .select('id') to count what it closed.
            return {
              then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
                Promise.resolve(parentResult).then(resolve, reject),
              select: async () => stepResult,
            };
          },
        };
      },
    }),
  })),
}));

function post(body: unknown, slug = 'save-the-bill') {
  return new NextRequest(`http://localhost/api/campaigns/${slug}/status`, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}
const params = Promise.resolve({ slug: 'save-the-bill' });

describe('POST /api/campaigns/[slug]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campaignRow = { id: 'c1', creator_id: 'owner-1', parent_campaign_id: null };
    parentResult = { error: null };
    stepResult = { data: [{ id: 's1' }, { id: 's2' }], error: null };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'owner-1' } } });
  });

  it('returns 404 when no campaign has that slug', async () => {
    campaignRow = null;
    const { POST } = await import('../campaigns/[slug]/status/route');
    const res = await POST(post({ status: 'paused' }), { params });
    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 401 when nobody is signed in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import('../campaigns/[slug]/status/route');
    const res = await POST(post({ status: 'paused' }), { params });
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 for a signed-in user who does not own the campaign', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'someone-else' } } });
    const { POST } = await import('../campaigns/[slug]/status/route');
    const res = await POST(post({ status: 'paused' }), { params });
    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects a status outside the open/closed pair', async () => {
    const { POST } = await import('../campaigns/[slug]/status/route');
    for (const status of ['archived', 'deleted', 'pending', '', null]) {
      const res = await POST(post({ status }), { params });
      expect(res.status).toBe(400);
    }
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    const { POST } = await import('../campaigns/[slug]/status/route');
    const res = await POST(post('not json at all'), { params });
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('closes the campaign and its steps, and reports how many', async () => {
    const { POST } = await import('../campaigns/[slug]/status/route');
    const res = await POST(post({ status: 'paused' }), { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: 'paused', steps_closed: 2 });
    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate.mock.calls[0][0]).toEqual({ status: 'paused' });
    expect(mockUpdate.mock.calls[1][0]).toEqual({ status: 'paused' });
    expect(mockEq.mock.calls).toEqual([['id', 'c1'], ['parent_campaign_id', 'c1']]);
  });

  it('closing a step does not cascade anywhere', async () => {
    campaignRow = { id: 'c2', creator_id: 'owner-1', parent_campaign_id: 'c1' };
    const { POST } = await import('../campaigns/[slug]/status/route');
    const res = await POST(post({ status: 'paused' }), { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: 'paused', steps_closed: 0 });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockEq.mock.calls).toEqual([['id', 'c2']]);
  });

  it('reopens only the campaign asked for, leaving its steps closed', async () => {
    const { POST } = await import('../campaigns/[slug]/status/route');
    const res = await POST(post({ status: 'active' }), { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: 'active', steps_closed: 0 });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate.mock.calls[0][0]).toEqual({ status: 'active' });
    expect(mockEq.mock.calls).toEqual([['id', 'c1']]);
  });

  it('reports a failed write instead of reporting success', async () => {
    parentResult = { error: { message: 'db down' } };
    const { POST } = await import('../campaigns/[slug]/status/route');
    const res = await POST(post({ status: 'paused' }), { params });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('close');
  });

  it('says so when the campaign closed but its steps did not', async () => {
    stepResult = { data: null, error: { message: 'db down' } };
    const { POST } = await import('../campaigns/[slug]/status/route');
    const res = await POST(post({ status: 'paused' }), { params });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.partial).toBe(true);
    expect(body.error).toContain('steps are still open');
  });
});
