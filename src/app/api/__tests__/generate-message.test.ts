import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/claude', () => ({
  callClaude: vi.fn(),
  extractJSON: vi.fn(),
  stripTags: vi.fn((t: string) => t),
  cleanText: vi.fn((t: string) => t),
}));

vi.mock('@/lib/legislators', () => ({
  getCommitteesForMember: vi.fn(() => []),
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

vi.mock('@/lib/rate-limit', () => ({
  generateLimiter: { check: () => ({ success: true }) },
  getClientIp: () => '127.0.0.1',
}));

const validBody = {
  officials: [{
    name: 'Jane Smith',
    title: 'Senator',
    party: 'D',
    state: 'CA',
  }],
  issue: 'Climate change',
  ask: 'Support the Green New Deal',
  senderName: 'John Doe',
};

// Mock global fetch for Anthropic API calls
const mockFetch = vi.fn();

describe('POST /api/generate-message', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('CLAUDE_MODEL', 'test-model');
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '{"subject": "Support Climate Action", "body": "Test body"}' }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  it('returns 200 with messages array for valid request', async () => {
    const { POST } = await import('../generate-message/route');
    const req = new NextRequest('http://localhost/api/generate-message', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages).toBeDefined();
    expect(data.messages).toHaveLength(1);
    expect(data.messages[0].officialName).toBe('Jane Smith');
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../generate-message/route');
    const req = new NextRequest('http://localhost/api/generate-message', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for Zod validation failure (missing issue)', async () => {
    const { POST } = await import('../generate-message/route');
    const req = new NextRequest('http://localhost/api/generate-message', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, issue: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 503 when ANTHROPIC_API_KEY is missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    delete process.env.ANTHROPIC_API_KEY;
    vi.resetModules();

    vi.doMock('@/lib/claude', () => ({
      callClaude: vi.fn(),
      extractJSON: vi.fn(),
      stripTags: vi.fn((t: string) => t),
      cleanText: vi.fn((t: string) => t),
    }));
    vi.doMock('@/lib/legislators', () => ({
      getCommitteesForMember: vi.fn(() => []),
    }));
    vi.doMock('@/lib/rate-limit', () => ({
      generateLimiter: { check: () => ({ success: true }) },
      getClientIp: () => '127.0.0.1',
    }));
    vi.doMock('@/lib/env', () => ({
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

    const { POST } = await import('../generate-message/route');
    const req = new NextRequest('http://localhost/api/generate-message', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('falls back to template when Anthropic API fails', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal error',
    });

    const { POST } = await import('../generate-message/route');
    const req = new NextRequest('http://localhost/api/generate-message', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages).toBeDefined();
    // Falls back to template — uses last name "Smith" in salutation
    expect(data.messages[0].body).toContain('Smith');
  });

  it('generates phone scripts for phone contact method', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '{"script": "Please support climate action"}' }],
      }),
    });

    const { POST } = await import('../generate-message/route');
    const req = new NextRequest('http://localhost/api/generate-message', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, contactMethod: 'phone' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages[0].body).toContain('Hi, my name is');
  });

  it('generates messages for multiple officials in parallel', async () => {
    const { POST } = await import('../generate-message/route');
    const req = new NextRequest('http://localhost/api/generate-message', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        officials: [
          { name: 'Jane Smith', title: 'Senator', party: 'D', state: 'CA' },
          { name: 'Bob Jones', title: 'Representative', party: 'R', state: 'TX' },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages).toHaveLength(2);
  });

  it('includes address in response when provided', async () => {
    const { POST } = await import('../generate-message/route');
    const req = new NextRequest('http://localhost/api/generate-message', {
      method: 'POST',
      body: JSON.stringify({
        ...validBody,
        address: { street: '123 Main St', city: 'Sacramento', state: 'CA', zip: '95814' },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.messages[0].body).toContain('Sacramento');
  });
});
