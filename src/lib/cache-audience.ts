/**
 * Whether a response may go in a cache the whole internet shares.
 *
 * Vercel's edge keys on the URL. Routes that answer differently depending on
 * who is asking therefore cannot mark only the privileged answer private: the
 * edge still holds the public copy and hands it to the privileged caller,
 * whose extra data then silently never appears.
 *
 * Keying on the session cookie fixes both directions. A crawler carries no
 * cookie and shares one cache entry, which is the traffic the cache exists to
 * absorb. Anyone signed in is answered freshly and never cached publicly.
 *
 * The project ref inside the cookie name is matched loosely on purpose. It is
 * derived from the Supabase URL, which is a custom domain here, so pinning a
 * literal ref would quietly stop matching if that URL ever changes.
 */
const SUPABASE_SESSION_COOKIE = /(^|;\s*)sb-[^=;]*-auth-token/;

export function isAnonymous(request: Request): boolean {
  return !SUPABASE_SESSION_COOKIE.test(request.headers.get('cookie') ?? '');
}
