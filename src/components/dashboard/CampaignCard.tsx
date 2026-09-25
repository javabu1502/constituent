import Link from 'next/link';
import { CopyLinkButton } from '@/components/campaign/CopyLinkButton';

export type CampaignRow = Record<string, string | number | null>;

/**
 * One campaign card — used by the constituent dashboard's "My Campaigns"
 * section, the org dashboard's grouped sections, and the public read-only
 * demo. Two buttons, no more (the card got unusably busy — Jared, 09-18):
 * Manage + copy-link for owners; the demo swaps Manage for the read-only
 * Analytics/Report views since /manage is owner-gated.
 */
export function CampaignCard({
  campaign,
  stages,
  isDemo = false,
}: {
  campaign: CampaignRow;
  stages: CampaignRow[];
  isDemo?: boolean;
}) {
  return (
    <div
      key={campaign.id}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5"
    >
      {(() => {
        const isStory = campaign.campaign_type === 'storytelling';
        // A parent's action_count IS the initiative total (stages
        // included) — never add stage counts on top of it.
        const count = isStory ? Number(campaign.story_count) : Number(campaign.action_count);
        const approval = String(campaign.approval_status || 'approved');
        const approvalBadge: Record<string, { label: string; cls: string }> = {
          pending: { label: 'Pending review', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
          rejected: { label: 'Needs changes', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
        };
        const ab = approvalBadge[approval];
        return (
          <div className="flex items-start justify-between mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {campaign.issue_area && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  {campaign.issue_area}
                </span>
              )}
              {campaign.campaign_type !== 'storytelling' && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {campaign.bill_state ? `State · ${campaign.bill_state}` : 'Federal'}
                </span>
              )}
              {isStory && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Storytelling
                </span>
              )}
              {campaign.outcome && (
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  (campaign.direction === 'oppose' ? campaign.outcome !== 'passed' : campaign.outcome === 'passed')
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {String(campaign.outcome) === 'passed' ? (campaign.direction === 'oppose' ? 'Passed (lost)' : 'Passed ✓') :
                   String(campaign.outcome) === 'died_committee' ? (campaign.direction === 'oppose' ? 'Stopped ✓' : 'Died in committee') :
                   String(campaign.outcome) === 'failed' ? (campaign.direction === 'oppose' ? 'Defeated ✓' : 'Failed') :
                   String(campaign.outcome) === 'vetoed' ? 'Vetoed' : 'Withdrawn'}
                </span>
              )}
              {ab && (
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${ab.cls}`}>{ab.label}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-bold">{count}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isStory ? `stor${count === 1 ? 'y' : 'ies'}` : `action${count !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        );
      })()}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
        {campaign.headline}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {campaign.description}
      </p>
      {/* The reviewer's note is the org's only signal for WHAT to
          change — without it "Needs changes" is a dead end. */}
      {String(campaign.approval_status) === 'rejected' && campaign.review_note && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300">
            <span className="font-semibold">Reviewer note:</span> {campaign.review_note}
          </p>
        </div>
      )}
      <div className="flex items-center gap-2">
        {isDemo ? (
          <>
            <Link
              href={`/campaign/${campaign.slug}/analytics`}
              className="flex-1 text-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Analytics
            </Link>
            {campaign.campaign_type !== 'storytelling' && (
              <Link
                href={`/campaign/${campaign.slug}/report`}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Report
              </Link>
            )}
            <Link
              href={`/campaign/${campaign.slug}`}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Public page
            </Link>
          </>
        ) : (
          <>
            <Link
              href={`/campaign/${campaign.slug}/manage`}
              className="flex-1 text-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Manage
            </Link>
            <CopyLinkButton slug={campaign.slug as string} />
          </>
        )}
      </div>
      {stages.length > 0 && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {stages.length} action{stages.length !== 1 ? 's' : ''} in this campaign
        </p>
      )}
    </div>
  );
}
