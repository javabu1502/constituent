/**
 * Who is allowed to act, by where the request comes from.
 *
 * Written after 2026-11-11, when analytics showed 159 views of /contact in a
 * window where 90% of visitors resolved to Singapore, 95% desktop and 93%
 * Windows. That is not a constituency. It is a hosting region, and the
 * traffic was walking the one funnel on the site that costs money per step:
 * a geocode, several Claude generations, and a delivery attempt to a
 * congressional office.
 *
 * The rule is deliberately narrow. Reading is left alone, because a person
 * outside the country has every reason to read what their government is
 * doing. Acting is gated, because an action here either spends money or puts
 * a message in front of a congressional office, and only a constituent can
 * do the second one honestly.
 *
 * This is a cost and abuse control, not an identity check. It is trivially
 * defeated by a US proxy, and that is acceptable: the traffic it exists to
 * stop is not trying to hide.
 */

/**
 * Country codes that count as the United States for this purpose.
 *
 * The territories are here on purpose. People in Puerto Rico, the US Virgin
 * Islands, Guam, American Samoa and the Northern Mariana Islands are US
 * citizens or nationals with a delegate in the House, and a gate that reads
 * "US only" and then locks out Puerto Rico is just a bug with a tidy name.
 */
const US_COUNTRY_CODES = new Set(['US', 'PR', 'VI', 'GU', 'AS', 'MP', 'UM']);

/** The country Vercel resolved for this request, or null when it did not. */
export function requestCountry(request: Request): string | null {
  const code = request.headers.get('x-vercel-ip-country');
  return code ? code.trim().toUpperCase() : null;
}

/**
 * Whether this request may take a billable or deliverable action.
 *
 * Fails OPEN when there is no country header. That header is set by Vercel's
 * edge, so its absence means local development, a test, or a self-hosted run,
 * none of which should have the contact flow dead. A gate that blocks real
 * work when its input is missing is worse than the traffic it was built for.
 */
export function isUsRequest(request: Request): boolean {
  const country = requestCountry(request);
  if (!country) return true;
  return US_COUNTRY_CODES.has(country);
}

/**
 * Paths where an action is taken. Everything else on the site stays readable
 * from anywhere.
 *
 * Each of these either spends money (a geocode, a Claude generation) or sends
 * something to an office. Browsing routes are not here even though crawlers
 * hit them hardest, because the fix for a crawler reading pages is robots and
 * caching, not a passport.
 */
const GATED_PREFIXES = [
  '/api/representatives',    // Census geocode
  '/api/track-send',         // the send itself, and CWC/webform enqueue
  '/api/generate-message',
  '/api/generate-core-message',
  '/api/generate-comment',
  '/api/generate-follow-up',
  '/api/follow-up-questions',
  '/api/research-assist',
  '/api/chat',
  '/api/stories',
];

export function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** What a blocked caller is told. Shown to a person, so it says what to do. */
export const GEO_BLOCKED_BODY = {
  error:
    'This step is available from the United States only. If you are a US citizen abroad, including military and overseas voters, email jared@mydemocracy.app and we will file your message for you.',
  code: 'OUTSIDE_US',
} as const;
