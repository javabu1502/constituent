import { CopyLinkButton } from '@/components/campaign/CopyLinkButton';
import { EmbedCodeButton } from '@/components/campaign/EmbedCodeButton';
import { QrCodeButton } from '@/components/campaign/QrCodeButton';

/**
 * What a campaign shows before anyone has acted on it.
 *
 * It used to show the dashboard with every number at zero: Total Actions 0,
 * Total Messages 0, This Week 0, Officials Contacted 0, States Reached 0,
 * Cities 0, then empty sections under them. Each figure was correct and the
 * page was useless, and it is the first page a new organisation opens, which
 * makes it the worst place in the product to be useless.
 *
 * A campaign with no participants raises exactly one question: how do people
 * get here. So that is what this answers. The numbers come back by
 * themselves once there is something to count.
 */
export function CampaignNotLaunched({
  slug,
  isStory = false,
}: {
  slug: string;
  isStory?: boolean;
}) {
  const url = `https://www.mydemocracy.app/campaign/${slug}`;

  return (
    <div className="bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {isStory ? 'No stories yet' : 'Nobody has acted yet'}
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Your campaign is live at this address. Numbers appear here once people start{' '}
        {isStory ? 'sharing' : 'writing'}.
      </p>

      <div className="mt-5 rounded-lg border border-rule dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
          Public link
        </p>
        <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{url}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CopyLinkButton slug={slug} />
        <EmbedCodeButton slug={slug} />
        <QrCodeButton slug={slug} />
      </div>

      <div className="mt-6 pt-5 border-t border-rule dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Where organisations usually start</p>
        <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
          <li>Send the link to your existing list.</li>
          <li>Embed the form on the page where you already explain this issue.</li>
          <li>Use the QR code on a flyer, a slide, or at an event.</li>
        </ul>
      </div>
    </div>
  );
}
