import { describe, it, expect, beforeAll } from 'vitest';
import { mapEmbedToken, verifyMapEmbedToken } from '../org-embed-token';

beforeAll(() => {
  process.env.EMBED_SIGNING_SECRET = 'test-secret-for-embed-tokens';
});

describe('map embed tokens (a guessable slug must not open the map)', () => {
  it('verifies the token it issued', () => {
    const t = mapEmbedToken('the-children-s-cabinet');
    expect(verifyMapEmbedToken('the-children-s-cabinet', t)).toBe(true);
  });
  it('rejects another org\'s token', () => {
    const t = mapEmbedToken('org-a');
    expect(verifyMapEmbedToken('org-b', t)).toBe(false);
  });
  it('rejects a missing, empty or truncated token', () => {
    const t = mapEmbedToken('org-a');
    expect(verifyMapEmbedToken('org-a', null)).toBe(false);
    expect(verifyMapEmbedToken('org-a', undefined)).toBe(false);
    expect(verifyMapEmbedToken('org-a', '')).toBe(false);
    expect(verifyMapEmbedToken('org-a', t.slice(0, -1))).toBe(false);
    expect(verifyMapEmbedToken('org-a', t + 'x')).toBe(false);
  });
  it('is URL safe and stable', () => {
    const t = mapEmbedToken('org-a');
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t).toBe(mapEmbedToken('org-a'));
  });
});
