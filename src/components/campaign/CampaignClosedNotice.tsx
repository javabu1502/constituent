import Link from 'next/link';
import { participateCopy } from '@/lib/copy/participate';

/**
 * What a person sees when they open a campaign that has stopped collecting.
 * The link was shared, so the page still loads: it says the campaign is
 * closed, shows how the legislation ended if the organizer recorded it, and
 * points somewhere that is still open.
 *
 * Rendered on the public campaign page and inside the embed. The embed lives
 * in an iframe on someone else's site, so its links open in a new tab.
 */

export function CampaignClosedNotice({
  language,
  isStory,
  outcome,
  orgName,
  otherCampaigns,
  inEmbed = false,
}: {
  language: string | null | undefined;
  isStory: boolean;
  outcome: string | null;
  orgName: string | null;
  otherCampaigns: { slug: string; headline: string }[];
  inEmbed?: boolean;
}) {
  const t = participateCopy(language);
  const outcomeLine = outcome ? t.closedOutcome(outcome) : '';
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mydemocracy.app';

  const linkClass = 'text-sm font-medium text-purple-700 dark:text-purple-300 hover:underline';
  const link = (href: string, label: string, key: string) =>
    inEmbed ? (
      <a key={key} href={`${base}${href}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {label} &rarr;
      </a>
    ) : (
      <Link key={key} href={href} className={linkClass}>
        {label} &rarr;
      </Link>
    );

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t.closedHeading}</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {isStory ? t.closedBodyStories : t.closedBodyActions}
      </p>

      {outcomeLine && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t.closedOutcomeHeading}
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{outcomeLine}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {otherCampaigns.length > 0 && orgName ? t.closedMoreFrom(orgName) : t.closedOnwardHeading}
        </p>
        <div className="mt-2 flex flex-col gap-1.5">
          {otherCampaigns.map((c) => link(`/campaign/${c.slug}`, c.headline, c.slug))}
          {link('/issues', t.closedBrowseIssues, 'issues')}
        </div>
      </div>
    </div>
  );
}
