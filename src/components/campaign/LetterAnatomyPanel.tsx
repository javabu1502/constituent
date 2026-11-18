import { getCommittee } from '@/lib/committees';
import { getStateCommittee } from '@/lib/state-committees';
import {
  letterAnatomy,
  deliveryRoutes,
  PART_SOURCE_LABELS,
  DELIVERY_CONFIRMATION_NOTE,
  type PartSource,
} from '@/lib/letter-anatomy';

const SOURCE_STYLE: Record<PartSource, string> = {
  fixed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  org: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  constituent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
};

/**
 * The letter this campaign sends, part by part.
 *
 * Owners could see how many letters went out and to whom, and not one word of
 * what any of them said. Individual letters stay private, which is the right
 * call and also why this exists: if the real ones are not shown, the shape
 * has to be.
 */
export function LetterAnatomyPanel({
  campaign,
  parentBillRef,
}: {
  campaign: {
    headline?: string | null;
    ask?: string | null;
    stage_goal?: string | null;
    bill_ref?: string | null;
    bill_level?: string | null;
    target_level?: string | null;
    direction?: string | null;
    target_filter?: { type?: string; committee_id?: string; state?: string } | null;
  };
  parentBillRef?: string | null;
}) {
  const level = campaign.target_level || campaign.bill_level || 'federal';
  // A committee action's opening names the committee, so the sample has to
  // name it too, or the part an organiser most wants to check is the one part
  // the sample invents.
  const tf = campaign.target_filter ?? null;
  const committee =
    tf?.type === 'committee' && tf.committee_id
      ? tf.state
        ? getStateCommittee(tf.state, tf.committee_id)
        : getCommittee(tf.committee_id)
      : null;
  const parts = letterAnatomy({
    billRef: campaign.bill_ref || parentBillRef || null,
    ask: campaign.ask ?? null,
    headline: campaign.headline ?? null,
    stageGoal: campaign.stage_goal ?? null,
    direction: campaign.direction ?? null,
    committeeName: committee?.name ?? null,
    level,
  });
  const routes = deliveryRoutes(level);

  return (
    <div className="bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 p-6 mb-8">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">The letter officials receive</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        A sample, with each part marked. Supporters write their own, so no two arrive the same.
      </p>

      <div className="mt-5 space-y-3">
        {parts.map((p) => (
          <div
            key={p.label}
            className="rounded-lg border border-rule dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{p.label}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_STYLE[p.source]}`}>
                {PART_SOURCE_LABELS[p.source]}
              </span>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line leading-relaxed">{p.sample}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{p.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-rule dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">How it gets there</h3>
        <ul className="mt-2 space-y-2.5">
          {routes.map((r) => (
            <li key={r.label} className="text-sm">
              <span className="font-medium text-gray-900 dark:text-white">{r.label}.</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">{r.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{DELIVERY_CONFIRMATION_NOTE}</p>
      </div>
    </div>
  );
}
