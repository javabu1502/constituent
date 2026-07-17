import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSingle = vi.fn();
const mockEq2 = vi.fn(() => ({ single: mockSingle }));
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }));
const mockSelect = vi.fn(() => ({ eq: mockEq1 }));
// campaign_actions: insert().select('id').single()
const mockActionInsertSingle = vi.fn();
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockActionInsertSingle })) }));
// campaign_actions: select().eq(id).eq(campaign_id).single() — action_id lookup
const mockActionLookupSingle = vi.fn();
const mockActionsSelect = vi.fn(() => ({
  eq: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockActionLookupSingle })) })),
}));
// campaign_actions: update().eq(id)
const mockActionUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockActionUpdateEq }));
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return { select: mockSelect };
      }
      if (table === 'campaign_actions') {
        return { insert: mockInsert, select: mockActionsSelect, update: mockUpdate };
      }
      return { insert: vi.fn(), select: vi.fn() };
    }),
    rpc: mockRpc,
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

const mockWriteLimiter = { check: vi.fn((): { success: boolean; retryAfter?: number } => ({ success: true })) };

vi.mock('@/lib/rate-limit', () => ({
  writeLimiter: mockWriteLimiter,
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/lib/usage-quota', () => ({
  resolveUsageIdentity: vi.fn(async () => ({ userId: null, ipHash: 'test-hash' })),
}));

const validBody = {
  participant_name: 'John Doe',
  participant_city: 'Sacramento',
  participant_state: 'CA',
  messages_sent: 3,
};

describe('POST /api/campaigns/[slug]/participate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteLimiter.check.mockReturnValue({ success: true });
    mockSingle.mockResolvedValue({ data: { id: 'campaign-uuid-123' }, error: null });
    mockActionInsertSingle.mockResolvedValue({ data: { id: 'action-uuid-1' }, error: null });
    mockActionLookupSingle.mockResolvedValue({ data: { id: 'action-uuid-1', messages_sent: 1 }, error: null });
    mockActionUpdateEq.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ error: null });
    process.env.TURNSTILE_SECRET_KEY = '';
  });

  it('returns 200 with success for valid participation', async () => {
    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.campaign_id).toBe('campaign-uuid-123');
    expect(data.action_id).toBe('action-uuid-1');
  });

  it('increments an existing action when action_id is provided', async () => {
    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, action_id: '123e4567-e89b-12d3-a456-426614174000' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Bumps messages_sent + public action count on the existing row —
    // no second participant row, and stance is never re-counted.
    expect(mockUpdate).toHaveBeenCalledWith({ messages_sent: 2 });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith('increment_campaign_action_count', {
      campaign_slug: 'test-campaign',
    });
    expect(mockRpc).not.toHaveBeenCalledWith('increment_campaign_stance_count', expect.anything());
  });

  it('returns 404 when action_id does not belong to the campaign', async () => {
    mockActionLookupSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, action_id: '123e4567-e89b-12d3-a456-426614174000' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockWriteLimiter.check.mockReturnValue({ success: false, retryAfter: 30 });

    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(429);
  });

  it('returns 403 when anonymous Turnstile verification fails', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    const { verifyTurnstile } = await import('@/lib/turnstile');
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when campaign is not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found', code: 'PGRST116' } });

    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/missing-campaign/participate', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'missing-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(404);
  });

  it('returns 500 when campaign action insert fails', async () => {
    mockActionInsertSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

    const { POST } = await import('../campaigns/[slug]/participate/route');
    const req = new NextRequest('http://localhost/api/campaigns/test-campaign/participate', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const params = { params: Promise.resolve({ slug: 'test-campaign' }) };

    const res = await POST(req, params);
    expect(res.status).toBe(500);
  });
});
