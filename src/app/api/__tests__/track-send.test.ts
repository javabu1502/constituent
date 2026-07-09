import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

vi.mock('@/lib/usage-quota', () => ({
  checkLegislatorCooldown: vi.fn(async () => ({ allowed: true })),
  resolveUsageIdentity: vi.fn(async () => ({ userId: null, ipHash: 'test-hash' })),
}));

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(() => Promise.resolve(true)),
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

const validBody = {
  advocate_name: 'John Doe',
  advocate_city: 'Sacramento',
  advocate_state: 'CA',
  legislator_name: 'Jane Smith',
  legislator_id: 'S001234',
  legislator_party: 'D',
  legislator_level: 'federal',
  legislator_chamber: 'senate',
  issue_area: 'Environment',
  issue_subtopic: 'Climate change',
  message_body: 'Test message body that is long enough',
  delivery_method: 'email' as const,
  delivery_status: 'sent' as const,
};

describe('POST /api/track-send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: 'test-id' }, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockGetUser.mockResolvedValue({ data: { user: null } });
    process.env.TURNSTILE_SECRET_KEY = '';
  });

  it('returns 200 with success and shareId for valid request', async () => {
    const { POST } = await import('../track-send/route');
    const req = new NextRequest('http://localhost/api/track-send', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.shareId).toBe('test-id');
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../track-send/route');
    const req = new NextRequest('http://localhost/api/track-send', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for Zod validation failure (missing legislator_name)', async () => {
    const { POST } = await import('../track-send/route');
    const { legislator_name: _, ...bodyWithout } = validBody;
    const req = new NextRequest('http://localhost/api/track-send', {
      method: 'POST',
      body: JSON.stringify(bodyWithout),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid delivery_method', async () => {
    const { POST } = await import('../track-send/route');
    const req = new NextRequest('http://localhost/api/track-send', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, delivery_method: 'pigeon' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 on Supabase insert error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

    const { POST } = await import('../track-send/route');
    const req = new NextRequest('http://localhost/api/track-send', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('returns 403 when anonymous Turnstile verification fails', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    const { verifyTurnstile } = await import('@/lib/turnstile');
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

    const { POST } = await import('../track-send/route');
    const req = new NextRequest('http://localhost/api/track-send', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('accepts optional fields (advocate_email, user_id)', async () => {
    const { POST } = await import('../track-send/route');
    const req = new NextRequest('http://localhost/api/track-send', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        advocate_email: 'john@example.com',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('does NOT store the message text for anonymous senders', async () => {
    const { POST } = await import('../track-send/route');
    const req = new NextRequest('http://localhost/api/track-send', {
      method: 'POST',
      body: JSON.stringify(validBody), // no user_id → anonymous
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted.message_body).toBe('');
    // Trend metadata is still recorded
    expect(inserted.issue_area).toBe('Environment');
    expect(inserted.advocate_state).toBe('CA');
    expect(inserted.user_id).toBeNull();
  });

  it('stores the message text for a verified signed-in sender', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });

    const { POST } = await import('../track-send/route');
    const req = new NextRequest('http://localhost/api/track-send', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, user_id: userId }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const inserted = mockInsert.mock.calls[0][0];
    expect(inserted.message_body).toBe(validBody.message_body);
    expect(inserted.user_id).toBe(userId);
  });
});
