import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockProfileSelect = vi.fn();
const mockProfileUpdate = vi.fn();
const mockSingle = vi.fn();
const mockUpdateSingle = vi.fn();
const mockEq = vi.fn();
const mockUpdateEq = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockProfileSelect,
      update: mockProfileUpdate,
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

const mockProfile = {
  user_id: 'user-123',
  street: '123 Main St',
  city: 'Sacramento',
  state: 'CA',
  zip: '95814',
};

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockSingle.mockResolvedValue({ data: mockProfile, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockProfileSelect.mockReturnValue({ eq: mockEq });
  });

  it('returns 200 with profile for authenticated user', async () => {
    const { GET } = await import('../profile/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.city).toBe('Sacramento');
  });

  it('returns 401 for unauthenticated request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import('../profile/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when profile not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const { GET } = await import('../profile/route');
    const res = await GET();
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockUpdateSingle.mockResolvedValue({
      data: { ...mockProfile, city: 'San Francisco' },
      error: null,
    });
    mockUpdateEq.mockReturnValue({ select: vi.fn(() => ({ single: mockUpdateSingle })) });
    mockProfileUpdate.mockReturnValue({ eq: mockUpdateEq });
  });

  it('returns 200 with updated profile for valid update', async () => {
    const { PATCH } = await import('../profile/route');
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ city: 'San Francisco' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.city).toBe('San Francisco');
  });

  it('returns 401 for unauthenticated PATCH request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { PATCH } = await import('../profile/route');
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ city: 'San Francisco' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid JSON', async () => {
    const { PATCH } = await import('../profile/route');
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for Zod failure (empty object)', async () => {
    const { PATCH } = await import('../profile/route');
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
