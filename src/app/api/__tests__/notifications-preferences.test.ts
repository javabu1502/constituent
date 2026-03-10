import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpsertSingle = vi.fn();
const mockUpsertSelect = vi.fn(() => ({ single: mockUpsertSingle }));
const mockUpsert = vi.fn(() => ({ select: mockUpsertSelect }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: vi.fn(() => ({
        select: mockSelect,
        upsert: mockUpsert,
      })),
    })
  ),
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

const mockUser = {
  id: 'user-uuid-123',
  email: 'test@example.com',
};

const mockPreferences = {
  user_id: 'user-uuid-123',
  weekly_digest: true,
  email: 'test@example.com',
};

describe('/api/notifications/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockSingle.mockResolvedValue({ data: mockPreferences, error: null });
    mockUpsertSingle.mockResolvedValue({ data: mockPreferences, error: null });
  });

  describe('GET', () => {
    it('returns 200 with preferences for authenticated user', async () => {
      const { GET } = await import('../notifications/preferences/route');

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.preferences).toBeDefined();
      expect(data.preferences.weekly_digest).toBe(true);
    });

    it('returns 401 for unauthenticated user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { GET } = await import('../notifications/preferences/route');

      const res = await GET();
      expect(res.status).toBe(401);
    });
  });

  describe('PUT', () => {
    it('returns 200 with updated preferences for valid request', async () => {
      const { PUT } = await import('../notifications/preferences/route');
      const req = new Request('http://localhost/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ weekly_digest: true, email: 'new@example.com' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.preferences).toBeDefined();
    });

    it('returns 401 for unauthenticated user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { PUT } = await import('../notifications/preferences/route');
      const req = new Request('http://localhost/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ weekly_digest: false }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid request body (non-JSON)', async () => {
      const { PUT } = await import('../notifications/preferences/route');
      const req = new Request('http://localhost/api/notifications/preferences', {
        method: 'PUT',
        body: 'not json',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PUT(req);
      expect(res.status).toBe(400);
    });
  });
});
