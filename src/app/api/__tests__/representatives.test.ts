import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({ insert: vi.fn() })),
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

const mockLookupLimiter = { check: vi.fn((): { success: boolean; retryAfter?: number } => ({ success: true })) };

vi.mock('@/lib/rate-limit', () => ({
  lookupLimiter: mockLookupLimiter,
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

const mockGeocodeAddress = vi.fn();
vi.mock('@/lib/geocode', () => ({
  geocodeAddress: mockGeocodeAddress,
}));

const mockFindSenators = vi.fn();
const mockFindRepresentative = vi.fn();
const mockIsDataAvailable = vi.fn();

vi.mock('@/lib/legislators', () => ({
  findSenators: mockFindSenators,
  findRepresentative: mockFindRepresentative,
  isDataAvailable: mockIsDataAvailable,
}));

vi.mock('@/lib/state-legislators', () => ({
  findStateLegislators: vi.fn(() => []),
}));

vi.mock('@/lib/civic-api', () => ({
  fetchLocalOfficials: vi.fn(() => Promise.resolve([])),
}));

const mockSenators = [
  {
    id: 'S001',
    name: 'Sen. Alpha',
    title: 'Senator',
    level: 'federal',
    party: 'D',
    state: 'CA',
  },
  {
    id: 'S002',
    name: 'Sen. Beta',
    title: 'Senator',
    level: 'federal',
    party: 'R',
    state: 'CA',
  },
];

const mockRep = {
  id: 'H001',
  name: 'Rep. Gamma',
  title: 'Representative',
  level: 'federal',
  party: 'D',
  state: 'CA',
};

const geocodeSuccess = {
  street: '123 Main St',
  city: 'Sacramento',
  state: 'California',
  stateCode: 'CA',
  zip: '95814',
  congressionalDistrict: '7',
  stateUpperDistrict: '6',
  stateLowerDistrict: '10',
};

const validBody = {
  street: '123 Main St',
  city: 'Sacramento',
  state: 'CA',
  zip: '95814',
};

describe('POST /api/representatives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLookupLimiter.check.mockReturnValue({ success: true });
    mockGeocodeAddress.mockResolvedValue(geocodeSuccess);
    mockFindSenators.mockReturnValue(mockSenators);
    mockFindRepresentative.mockReturnValue(mockRep);
    mockIsDataAvailable.mockReturnValue(true);
  });

  it('returns 200 with officials array for valid address', async () => {
    const { POST } = await import('../representatives/route');
    const req = new NextRequest('http://localhost/api/representatives', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.officials).toBeDefined();
    expect(data.officials.length).toBeGreaterThanOrEqual(2);
    expect(data.address).toBeDefined();
    expect(data.address.stateCode).toBe('CA');
  });

  it('returns 400 when street is missing', async () => {
    const { POST } = await import('../representatives/route');
    const { street: _, ...bodyWithout } = validBody;
    const req = new NextRequest('http://localhost/api/representatives', {
      method: 'POST',
      body: JSON.stringify(bodyWithout),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    mockLookupLimiter.check.mockReturnValue({ success: false, retryAfter: 30 });

    const { POST } = await import('../representatives/route');
    const req = new NextRequest('http://localhost/api/representatives', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns senators with warning when geocode fails but data is available', async () => {
    mockGeocodeAddress.mockResolvedValue({ error: 'Could not geocode', code: 'GEOCODE_FAILED' });
    mockFindSenators.mockReturnValue(mockSenators);

    const { POST } = await import('../representatives/route');
    const req = new NextRequest('http://localhost/api/representatives', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.officials).toBeDefined();
    expect(data.officials.length).toBe(2);
    expect(data.warning).toBeTruthy();
  });

  it('returns 503 when data is unavailable and geocode fails', async () => {
    mockGeocodeAddress.mockResolvedValue({ error: 'Could not geocode', code: 'GEOCODE_FAILED' });
    mockIsDataAvailable.mockReturnValue(false);

    const { POST } = await import('../representatives/route');
    const req = new NextRequest('http://localhost/api/representatives', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });
});
