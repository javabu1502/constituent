import Link from 'next/link';
import { fetchBillStatus } from '@/lib/bill-status';
import { STAGE_GOAL_LABELS } from '@/lib/stages';
import { listStateCommittees } from '@/lib/state-committees';
import { listCommittees } from '@/lib/committees';

/**
 * Org-facing live bill status on the parent campaign's analytics page: the
 * bill's REAL legislative record plus a suggested next stage, so the org
 * knows what action to run next. Owner gating is the page's job.
 */
export async function BillStatusPanel({
  campaign,
}: {
  campaign: {
    id: string;
    slug: string;
    headline: string;
    bill_ref: string | null;
    bill_level: string | null;
    bill_state: string | null;
    bill_congress?: number | null;
    bill_type?: string | null;
    bill_number?: string | null;
  };
}) {
  if (!campaign.bill_ref && !campaign.bill_number) return null;
  const status = await fetchBillStatus(campaign);
  if (!status) return null;

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Match a committee suggestion to our vendored data so the Add-a-stage link
  // arrives with the committee preselected.
  let committeeParam = '';
  const suggestion = status.suggestion;
  if (suggestion?.goal === 'committee' && suggestion.committeeName) {
    const wanted = suggestion.committeeName.toLowerCase();
    const pool =
      campaign.bill_level === 'state' && campaign.bill_state
        ? listStateCommittees(campaign.bill_state)
        : listCommittees();
    const match = pool.find((c) => c.name.toLowerCase().includes(wanted) || wanted.includes(c.name.toLowerCase()));
    if (match) committeeParam = `&committee=${encodeURIComponent(match.id)}`;
  }

  const addStageHref = suggestion
    ? `/campaign/create?type=advocacy&parent=${campaign.id}&parent_name=${encodeURIComponent(campaign.headline)}&goal=${suggestion.goal}${
        campaign.bill_level === 'state' && campaign.bill_state ? `&state=${campaign.bill_state}` : ''
      }${committeeParam}`
    : '';

  return (
    <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        Live status: {campaign.bill_ref}
      </h2>

      {!status.found ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We couldn&apos;t find this bill in the official record yet. Status appears here automatically once the
          legislature publishes actions for it.
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            From the official legislative record · refreshed hourly
          </p>

          {suggestion && (
            <div className="mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  Suggested next move: {STAGE_GOAL_LABELS[suggestion.goal]}
                  {suggestion.committeeName ? ` — ${suggestion.committeeName}` : ''}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">{suggestion.reason}</p>
              </div>
              <Link
                href={addStageHref}
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                Add this stage
              </Link>
            </div>
          )}

          <ul className="space-y-2">
            {status.actions.slice(0, 5).map((a, i) => (
              <li key={`${a.date}-${i}`} className="flex gap-3 text-sm">
                <span className="shrink-0 w-24 text-xs text-gray-400 dark:text-gray-500 pt-0.5">{fmt(a.date)}</span>
                <span className={i === 0 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}>
                  {a.description}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
