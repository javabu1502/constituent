import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external dependencies
vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
            })),
          })),
          single: vi.fn(() => ({
            data: null,
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/congress-api', () => ({
  congressFetch: vi.fn(),
}));

describe('digest', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  describe('generateUnsubscribeToken() / verifyUnsubscribeToken()', () => {
    it('round-trips: generated token verifies correctly', async () => {
      vi.stubEnv('CRON_SECRET', 'test-cron-secret');

      const { generateUnsubscribeToken, verifyUnsubscribeToken } = await import('../digest');
      const userId = 'user-123';
      const token = generateUnsubscribeToken(userId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(verifyUnsubscribeToken(userId, token)).toBe(true);
    });

    it('rejects invalid token', async () => {
      vi.stubEnv('CRON_SECRET', 'test-cron-secret');

      const { verifyUnsubscribeToken } = await import('../digest');
      expect(verifyUnsubscribeToken('user-123', 'bad-token')).toBe(false);
    });

    it('produces different tokens for different users', async () => {
      vi.stubEnv('CRON_SECRET', 'test-cron-secret');

      const { generateUnsubscribeToken } = await import('../digest');
      const t1 = generateUnsubscribeToken('user-a');
      const t2 = generateUnsubscribeToken('user-b');
      expect(t1).not.toBe(t2);
    });
  });

  describe('renderDigestHtml()', () => {
    it('produces valid HTML with rep names and vote summaries', async () => {
      const { renderDigestHtml } = await import('../digest');

      const html = renderDigestHtml(
        {
          userName: 'Alice',
          reps: [
            {
              repName: 'Sen. Jane Smith',
              repTitle: 'U.S. Senator',
              votes: [
                { bill: 'S. 123', position: 'Yea', result: 'Passed', date: '2026-01-15' },
              ],
              bills: [
                {
                  title: 'Clean Air Act',
                  number: 'S 456',
                  status: 'Introduced',
                  url: 'https://congress.gov/bill/119th-congress/senate-bill/456',
                },
              ],
            },
          ],
        },
        'https://mydemocracy.app/unsubscribe?token=abc123'
      );

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Alice');
      expect(html).toContain('Sen. Jane Smith');
      expect(html).toContain('S. 123');
      expect(html).toContain('Yea');
      expect(html).toContain('Clean Air Act');
      expect(html).toContain('unsubscribe');
    });

    it('includes dashboard CTA link', async () => {
      const { renderDigestHtml } = await import('../digest');

      const html = renderDigestHtml(
        {
          userName: 'Bob',
          reps: [
            {
              repName: 'Rep. John Doe',
              repTitle: 'U.S. Representative',
              votes: [],
              bills: [{ title: 'Test Bill', number: 'HR 1', status: 'Introduced', url: 'https://congress.gov' }],
            },
          ],
        },
        'https://mydemocracy.app/unsubscribe'
      );

      expect(html).toContain('mydemocracy.app/dashboard');
    });
  });

  describe('buildWeeklyDigest()', () => {
    it('returns null when profile has no representatives', async () => {
      const { createAdminClient } = await import('@/lib/supabase');
      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { name: 'Test', representatives: null },
              })),
            })),
          })),
        })),
      } as never);

      const { buildWeeklyDigest } = await import('../digest');
      const result = await buildWeeklyDigest('user-123');
      expect(result).toBeNull();
    });
  });
});
