import Link from 'next/link';
import { CampaignCardMenu } from '@/components/dashboard/CampaignCardMenu';
import { isCampaignClosed } from '@/lib/campaign-close';
import { billTrack } from '@/lib/legislative-process';

export type CampaignRow = Record<string, string | number | null>;

/** Where the bill is on its own path, resolved by the page that lists cards. */
export interface CardBillPosition {
  /** Index into billTrack().stages. */
  position: number;
  /** Short status for the pill, e.g. "In Senate". */
  label: string;
  /** Set when the newest action's goal is behind where the bill has got to. */
  behind?: string | null;
}

/**
 * One campaign card, led by the bill.
 *
 * It used to be led by its toolbar: View, Analytics, Impact report, Share,
 * Embed, QR, edit, close, delete, all on the face of every card. That came
 * from the 10-02 audit, and the reason given there was "no empty hop" — the
 * page behind the card held almost nothing, so the actions had to sit in
 * front of it. The hub page now holds the campaign, so the toolbar collapses
 * to one menu and the card can show the thing an organiser actually scans
 * for: which bill, where it has got to, and whether their ask still matches.
 */
export function CampaignCard({
  campaign,
  stages,
  isDemo = false,
  bill,
}: {
  campaign: CampaignRow;
  stages: CampaignRow[];
  isDemo?: boolean;
  bill?: CardBillPosition | null;
}) {
  const closed = isCampaignClosed(campaign.status as string | null);
  const isStory = campaign.campaign_type === 'storytelling';
  // A parent's action_count IS the initiative total (stages included) — never
  // add stage counts on top of it.
  const count = isStory ? Number(campaign.story_count) : Number(campaign.action_count);
  const slug = String(campaign.slug);

  const billRef = typeof campaign.bill_ref === 'string' ? campaign.bill_ref.trim() : '';
  // The bill number is the name an organiser knows the campaign by. Without
  // one, the headline is all there is.
  const title = billRef || String(campaign.headline ?? '');
  const subtitle = billRef ? String(campaign.headline ?? '') : String(campaign.description ?? '');

  const approval = String(campaign.approval_status || 'approved');
  const approvalBadge: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending review', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    rejected: { label: 'Needs changes', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  };
  const ab = approvalBadge[approval];

  const track =
    bill && billRef
      ? billTrack(
          campaign.bill_level === 'state' ? 'state' : 'federal',
          typeof campaign.bill_state === 'string' ? campaign.bill_state : null,
          typeof campaign.bill_type === 'string' ? campaign.bill_type : billRef,
        )
      : null;

  const outcomeLabel = campaign.outcome
    ? String(campaign.outcome) === 'passed'
      ? campaign.direction === 'oppose' ? 'Passed (lost)' : 'Passed'
      : String(campaign.outcome) === 'died_committee'
        ? campaign.direction === 'oppose' ? 'Stopped' : 'Died in committee'
        : String(campaign.outcome) === 'failed'
          ? campaign.direction === 'oppose' ? 'Defeated' : 'Failed'
          : String(campaign.outcome) === 'vetoed' ? 'Vetoed' : 'Withdrawn'
    : null;
  const outcomeWon = campaign.direction === 'oppose'
    ? campaign.outcome !== 'passed'
    : campaign.outcome === 'passed';

  // The hub is the one click. The demo has no owner pages, so it goes to the
  // read-only analytics view instead.
  const hubHref = isDemo ? `/campaign/${slug}/analytics` : `/campaign/${slug}/analytics`;

  return (
    <div className="bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 p-5 flex flex-col">
      <div className="flex items-start gap-3 mb-1">
        <Link
          href={hubHref}
          className="text-lg font-bold tracking-tight text-gray-900 dark:text-white hover:text-purple-700 dark:hover:text-purple-300 transition-colors line-clamp-1"
        >
          {title}
        </Link>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          {outcomeLabel && (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              outcomeWon
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {outcomeLabel}
            </span>
          )}
          {!outcomeLabel && bill?.label && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 whitespace-nowrap">
              {bill.label}
            </span>
          )}
          {isStory && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Storytelling
            </span>
          )}
          {ab && <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${ab.cls}`}>{ab.label}</span>}
          {closed && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100">
              Closed
            </span>
          )}
        </div>
      </div>

      <Link
        href={hubHref}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors mb-4 line-clamp-2"
      >
        {subtitle}
      </Link>

      {/* Where the BILL is, from the official record. Never a count of the
          actions we made: that denominator moves for reasons the organisation
          did not cause. */}
      {track && bill && !outcomeLabel && (
        <div className="mb-4">
          <div className="flex gap-1 mb-1.5">
            {track.stages.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= bill.position ? 'bg-purple-600 dark:bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            {track.stages.map((label, i) => (
              <span
                key={label}
                className={`flex-1 text-center text-[10px] leading-tight ${
                  i === bill.position
                    ? 'font-bold text-purple-700 dark:text-purple-300'
                    : i < bill.position
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* The ask has fallen behind the bill. Detectable today, surfaced
          nowhere until now, and the most useful thing on the card. */}
      {bill?.behind && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/20 px-3 py-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-orange-700 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-orange-800 dark:text-orange-300 leading-snug">{bill.behind}</p>
        </div>
      )}

      {String(campaign.approval_status) === 'rejected' && campaign.review_note && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300">
            <span className="font-semibold">Reviewer note:</span> {campaign.review_note}
          </p>
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pt-3 border-t border-rule dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <span className="min-w-0 flex-1 truncate">
          <strong className="font-semibold text-gray-900 dark:text-white">{count}</strong>{' '}
          {isStory ? `stor${count === 1 ? 'y' : 'ies'}` : `message${count !== 1 ? 's' : ''}`}
          {!isStory && stages.length > 0 && (
            <>
              <span className="text-gray-300 dark:text-gray-600"> · </span>
              <strong className="font-semibold text-gray-900 dark:text-white">{stages.length}</strong>{' '}
              action{stages.length !== 1 ? 's' : ''}
            </>
          )}
        </span>
        <Link
          href={hubHref}
          className="shrink-0 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:underline whitespace-nowrap"
        >
          Campaign hub &rarr;
        </Link>
        {!isDemo && (
          <CampaignCardMenu
            slug={slug}
            headline={String(campaign.headline ?? '')}
            closed={closed}
            stepCount={stages.length}
            isStory={isStory}
          />
        )}
      </div>

      {!isDemo && closed && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {isStory
            ? 'Not collecting stories. The public page and the embed say it is closed.'
            : 'Not collecting messages. The public page and the embed say it is closed.'}
        </p>
      )}
    </div>
  );
}
