import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/claude', () => ({
  callClaude: vi.fn(async () => '{"comment": "Test comment about the regulation"}'),
  extractJSON: vi.fn(() => ({ comment: 'Test comment about the regulation' })),
  cleanText: vi.fn((t: string) => t),
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
  regulationTitle: 'Clean Water Standards Update',
  agency: 'Environmental Protection Agency',
  position: 'support' as const,
  senderName: 'John Doe',
};

describe('POST /api/generate-comment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  });

  it('returns 200 with comment for valid request', async () => {
    const { POST } = await import('../generate-comment/route');
    const req = new NextRequest('http://localhost/api/generate-comment', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comment).toBeDefined();
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../generate-comment/route');
    const req = new NextRequest('http://localhost/api/generate-comment', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for Zod validation failure (missing regulationTitle)', async () => {
    const { POST } = await import('../generate-comment/route');
    const req = new NextRequest('http://localhost/api/generate-comment', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, regulationTitle: '' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid position value', async () => {
    const { POST } = await import('../generate-comment/route');
    const req = new NextRequest('http://localhost/api/generate-comment', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, position: 'neutral' }),
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
      cleanText: vi.fn((t: string) => t),
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

    const { POST } = await import('../generate-comment/route');
    const req = new NextRequest('http://localhost/api/generate-comment', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('returns 500 when Claude returns unparseable response', async () => {
    const { extractJSON } = await import('@/lib/claude');
    vi.mocked(extractJSON).mockReturnValueOnce(null);

    const { POST } = await import('../generate-comment/route');
    const req = new NextRequest('http://localhost/api/generate-comment', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
