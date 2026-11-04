/**
 * Signed tokens for public supporter-map embeds.
 *
 * The supporter map is aggregate, but it is still an organization's strength
 * map, and a slug is guessable. So the owner session is not the only way in:
 * a map embed carries a token derived from the slug and a server secret.
 * Knowing the org's handle gets you nothing; having the snippet the org chose
 * to publish gets you the map.
 *
 * Embedding is the opt-in. Once an org pastes the snippet onto a public page
 * the token is public too, which is exactly what they asked for.
 */
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * SUPABASE_SECRET_KEY is the fallback because it is always present on the
 * server and never shipped to the browser. Set EMBED_SIGNING_SECRET to make
 * every existing embed token rotate.
 */
function secret(): string {
  const s = process.env.EMBED_SIGNING_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!s) throw new Error('No signing secret available for embed tokens');
  return s;
}

export function mapEmbedToken(slug: string): string {
  return createHmac('sha256', secret()).update(`org-map:${slug}`).digest('base64url').slice(0, 24);
}

export function verifyMapEmbedToken(slug: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(mapEmbedToken(slug));
  const given = Buffer.from(token);
  // timingSafeEqual throws on a length mismatch, which is itself an answer.
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}
