import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/claude-stream', () => ({
  callClaudeStream: vi.fn(() => new ReadableStream({ start(c) { c.close(); } })),
}));

vi.mock('@/lib/chat-system-prompt', () => ({
  CHAT_SYSTEM_PROMPT: 'test system prompt',
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
  chatLimiter: { check: () => ({ success: true }) },
  getClientIp: () => '127.0.0.1',
}));

const validBody = {
  messages: [{ role: 'user', content: 'What is democracy?' }],
};

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  });

  it('returns 200 with streaming response for valid request', async () => {
    const { POST } = await import('../chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for Zod validation failure (empty messages)', async () => {
    const { POST } = await import('../chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when last message is not from user', async () => {
    const { POST } = await import('../chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 503 when ANTHROPIC_API_KEY is missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    delete process.env.ANTHROPIC_API_KEY;
    vi.resetModules();

    vi.doMock('@/lib/claude-stream', () => ({
      callClaudeStream: vi.fn(() => new ReadableStream({ start(c) { c.close(); } })),
    }));
    vi.doMock('@/lib/chat-system-prompt', () => ({
      CHAT_SYSTEM_PROMPT: 'test system prompt',
    }));
    vi.doMock('@/lib/rate-limit', () => ({
      chatLimiter: { check: () => ({ success: true }) },
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

    const { POST } = await import('../chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('returns text/plain content type', async () => {
    const { POST } = await import('../chat/route');
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  });
});
