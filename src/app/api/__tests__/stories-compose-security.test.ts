import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockChatLimiter = { check: vi.fn((): { success: boolean; retryAfter?: number } => ({ success: true })) };

vi.mock('@/lib/rate-limit', () => ({
  chatLimiter: mockChatLimiter,
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(() => Promise.resolve(false)),
}));

vi.mock('@/lib/usage-quota', () => ({
  enforceDailyQuota: vi.fn(async () => ({ allowed: true, remaining: 10 })),
  resolveUsageIdentity: vi.fn(async () => ({ userId: null, ipHash: 'test-hash' })),
}));

vi.mock('@/lib/claude', () => ({
  callClaude: vi.fn(),
  extractJSON: vi.fn(),
  deDash: vi.fn((s: string) => s),
}));

describe('POST /api/stories/compose security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChatLimiter.check.mockReturnValue({ success: true });
    process.env.ANTHROPIC_API_KEY = 'test-key';
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  });

  it('requires Turnstile for anonymous story composition', async () => {
    const { POST } = await import('../stories/compose/route');
    const req = new Request('http://localhost/api/stories/compose', {
      method: 'POST',
      body: JSON.stringify({
        campaignSlug: 'story-campaign',
        messages: [
          { role: 'user', content: 'My experience has been difficult.' },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
