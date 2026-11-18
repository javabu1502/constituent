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
import { createHmac } from 'crypto';
import { signingSecret, acceptedSecrets, constantTimeEqual } from '@/lib/signing-secrets';

function digest(secret: string, slug: string): string {
  return createHmac('sha256', secret).update(`org-map:${slug}`).digest('base64url').slice(0, 24);
}

/**
 * Signed with EMBED_SIGNING_SECRET once that is set, and with
 * SUPABASE_SECRET_KEY until then.
 *
 * Setting EMBED_SIGNING_SECRET used to rotate every existing token, which
 * is a strange thing for a key to do: it meant the database key and the
 * embed key could never be changed independently, so rotating the database
 * key after a leak would also blank every map an org had embedded.
 */
export function mapEmbedToken(slug: string): string {
  return digest(signingSecret('embed'), slug);
}

/**
 * Verified against the current secret and the legacy one.
 *
 * An embed token is pasted into somebody else's website and sits there, so
 * the legacy key keeps verifying until the snippets are reissued. Dropping
 * it is a decision to break every map an org already embedded, which is why
 * it is a date on a calendar and not a cleanup.
 */
export function verifyMapEmbedToken(slug: string, token: string | null | undefined): boolean {
  if (!token) return false;
  let ok = false;
  // Every candidate is checked even after a match, so the time taken does
  // not say which key signed it.
  for (const secret of acceptedSecrets('embed')) {
    if (constantTimeEqual(digest(secret, slug), token)) ok = true;
  }
  return ok;
}
