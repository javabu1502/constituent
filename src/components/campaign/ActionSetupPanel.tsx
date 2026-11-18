import { getCommittee } from '@/lib/committees';
import { getStateCommittee } from '@/lib/state-committees';
import { STAGE_GOAL_LABELS, type StageGoal } from '@/lib/stages';
import { parseTalkingPoints } from '@/lib/talking-points';
import { buildAskInstruction } from '@/lib/campaign-ask';

export interface ActionTargetFilter {
  type?: string;
  committee_id?: string;
  state?: string;
  party?: string;
  level?: string;
  chamber?: string;
  officials?: { id: string; name?: string }[];
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
      {children}
    </p>
  );
}

/**
 * What one advocacy action is, on its own page.
 *
 * An action is a campaign, so it already had analytics. What it never had was
 * a statement of itself: which ask, in whose words, to whom. An organiser
 * coming back to a closed action a month later could see 118 messages and not
 * what those 118 people were asked to say.
 *
 * Who it reaches matters most. target_filter is the rule that keeps a
 * committee action off non-committee members, and the consequence of getting
 * it wrong is mail an office will not accept. It should be readable without
 * opening the edit form.
 */
export function ActionSetupPanel({
  campaign,
  parentBillRef,
}: {
  campaign: {
    headline?: string | null;
    ask?: string | null;
    stage_goal?: string | null;
    message_template?: string | null;
    target_filter?: ActionTargetFilter | null;
    bill_ref?: string | null;
    direction?: string | null;
  };
  parentBillRef?: string | null;
}) {
  const goal = (campaign.stage_goal ?? '') as StageGoal;
  const goalLabel = STAGE_GOAL_LABELS[goal] ?? 'Custom action';
  const points = campaign.message_template ? parseTalkingPoints(campaign.message_template) : [];
  const billRef = campaign.bill_ref || parentBillRef || null;

  // When the organisation did not write an ask, show the sentence the action
  // implies, so the page never has an empty field where the request belongs.
  const ownAsk = (campaign.ask ?? '').trim();
  const derived = buildAskInstruction({
    billRef,
    stageGoal: goal,
    stance: campaign.direction === 'oppose' ? 'oppose' : 'support',
  });

  const tf = campaign.target_filter ?? null;
  const committee =
    tf?.type === 'committee' && tf.committee_id
      ? tf.state
        ? getStateCommittee(tf.state, tf.committee_id)
        : getCommittee(tf.committee_id)
      : null;

  let reachTitle = 'Their own senators and representative';
  let reachBody = "Matched from the address each supporter enters.";
  if (tf?.type === 'committee') {
    reachTitle = committee?.name ?? 'A committee';
    reachBody =
      'A supporter writes only when their own member sits on this committee. Nobody else is contacted.';
  } else if (tf?.type === 'officials' && tf.officials?.length) {
    reachTitle = `${tf.officials.length} named official${tf.officials.length === 1 ? '' : 's'}`;
    reachBody = 'A supporter writes only when one of these is their own.';
  } else if (tf?.type === 'party' && tf.party) {
    reachTitle = `${tf.party === 'D' ? 'Democrats' : tf.party === 'R' ? 'Republicans' : tf.party}${
      tf.chamber ? ` in the ${tf.chamber}` : ''
    }`;
    reachBody = 'A supporter writes only when their own member is in this group.';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      <div className="lg:col-span-2 bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Setup</h2>

        <Label>Action</Label>
        <p className="text-[15px] text-gray-900 dark:text-white mb-4">{goalLabel}</p>

        <Label>Headline</Label>
        <p className="text-[15px] text-gray-900 dark:text-white mb-4">{campaign.headline}</p>

        <Label>Ask</Label>
        {ownAsk ? (
          <p className="text-[15px] text-gray-900 dark:text-white mb-4">{ownAsk}</p>
        ) : (
          <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-4">
            {derived
              ? `Written from the action: ask them to ${goalLabel.toLowerCase()}${billRef ? ` on ${billRef}` : ''}.`
              : 'Written from the action.'}
          </p>
        )}

        {points.length > 0 && (
          <>
            <Label>Talking points</Label>
            <ul className="space-y-1.5">
              {points.map((pt, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400 dark:bg-purple-500" />
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Who this reaches</h2>
        <div className="rounded-lg border border-rule dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{reachTitle}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{reachBody}</p>
        </div>
      </div>
    </div>
  );
}
