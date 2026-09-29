import { createHmac, timingSafeEqual } from 'crypto';

/** Signed token that lets a guest withdraw their own story later (no account). */
export function storyRevokeToken(storyId: string): string {
  const secret = process.env.STORY_REVOKE_SECRET || process.env.UNSUBSCRIBE_SECRET || process.env.IP_HASH_SALT || '';
  return createHmac('sha256', secret).update(`story-revoke:${storyId}`).digest('hex');
}

export function verifyStoryRevokeToken(storyId: string, token: string): boolean {
  const expected = storyRevokeToken(storyId);
  if (!token || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
