/**
 * Parsing helpers for the Wikipedia biography route.
 *
 * Separate from the route because a Next.js route file may only export route
 * handlers and its config; exporting these from there so the tests could
 * reach them failed the production build with "Route does not match the
 * required types of a Next.js Route".
 */

/**
 * The article title in an en.wikipedia.org URL, or null.
 *
 * This is the boundary that stops a server-side fetcher being aimed at an
 * internal host, so it rejects every other hostname, anything that is not an
 * /wiki/ path, and namespaced pages like Category: and Special:, which are
 * not biographies of anyone.
 */
export function titleFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== 'en.wikipedia.org') return null;
    const m = u.pathname.match(/^\/wiki\/(.+)$/);
    const title = m ? decodeURIComponent(m[1]) : null;
    return title && !title.includes(':') ? title : null;
  } catch {
    return null;
  }
}

/** Summaries open with a parenthetical of birth dates and pronunciation. */
export function tidy(extract: string): string {
  return extract.replace(/\s*\([^()]*\)/, '').replace(/\s+/g, ' ').trim();
}
