import Link from 'next/link';

/**
 * The line under an embedded widget that says where it came from.
 *
 * Every embed carries one. An embed sits on an organization's own site, in
 * front of people who have never heard of us, which makes it the only place
 * the product is seen by a new audience without us putting it there. The
 * campaign embed already had this line; the organization join form and the
 * supporter map did not, so the two widgets an organization is most likely to
 * put on its homepage were the two that said nothing.
 *
 * It is branded by default, as Action Network's standard widget styles are.
 * There is no unbranded option yet, and if one is ever sold it should be a
 * plan setting rather than something a host page can strip, which an iframe
 * already prevents: the embedding site cannot restyle what is inside it.
 *
 * The link is tagged so the traffic it sends is attributable. Without that,
 * an embed referral arrives as a direct hit from an unknown source, which is
 * exactly the gap that made a week of analytics unreadable in November 2026.
 */
export function EmbedAttribution({
  href = 'https://www.mydemocracy.app',
  source,
}: {
  /** Where the line points. Defaults to the site root. */
  href?: string;
  /** Which embed sent them, e.g. 'campaign', 'org-join', 'org-map'. */
  source: string;
}) {
  const url = new URL(href);
  url.searchParams.set('utm_source', 'embed');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', source);

  return (
    <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
      <Link
        href={url.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-purple-600 dark:hover:text-purple-400 hover:underline"
      >
        Powered by My Democracy
      </Link>
    </p>
  );
}
