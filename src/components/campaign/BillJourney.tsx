import { createAdminClient } from '@/lib/supabase';
import Link from 'next/link';
import { stageOrder, type StageGoal } from '@/lib/stages';

/**
 * "Where the bill stands" — the parent campaign's public journey tracker.
 * The campaign's stages ARE the tracking: each stage marks a step of the
 * bill's path, the newest stage is where the fight is now, and a thank-you
 * stage means it passed.
 *
 * This is the NOVICE-facing view: plain-language step names and a one-line
 * "right now" explainer, no legislative jargon. The raw official record
 * (actions, dates, whip detail) lives on the org-side BillStatusPanel.
 */

interface JourneyProps {
  campaign: {
    id: string;
    bill_ref: string | null;
    bill_level: string | null;
    bill_state: string | null;
    bill_title: string | null;
  };
}

type StageRow = {
  id: string;
  slug: string;
  headline: string;
  stage_goal: string | null;
  status: string | null;
  created_at: string;
};

// Plain-language step names + a "right now" sentence per stage, written for
// someone who has never followed a bill before.
function publicLabel(goal: StageGoal, isState: boolean): string {
  switch (goal) {
    case 'cosponsor': return 'Building support among lawmakers';
    case 'committee': return 'A small committee decides if it moves forward';
    case 'floor_house': return isState ? 'The full Assembly/House votes' : 'The full House votes';
    case 'floor_senate': return 'The full Senate votes';
    case 'thank_you': return 'It passed!';
    default: return 'Taking action';
  }
}

function happeningNow(goal: StageGoal): string {
  switch (goal) {
    case 'cosponsor':
      return 'Right now, supporters are asking lawmakers to publicly back the bill — the more names on it, the better its chances.';
    case 'committee':
      return 'Right now, a small group of lawmakers is deciding whether this bill moves forward. If your representative is one of them, your voice counts extra.';
    case 'floor_house':
      return 'Right now, the bill is headed for a vote by the full chamber — every representative gets a say, including yours.';
    case 'floor_senate':
      return 'Right now, the bill needs one last vote in the Senate — every senator gets a say, including yours.';
    case 'thank_you':
      return 'The bill passed! Lawmakers rarely hear thank-yous — sending one makes the next good vote easier.';
    default:
      return 'The campaign is active — jump in below.';
  }
}

export async function BillJourney({ campaign }: JourneyProps) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('campaigns')
    .select('id, slug, headline, stage_goal, status, created_at')
    .eq('parent_campaign_id', campaign.id)
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: true });
  const stages = ((data ?? []) as StageRow[]).sort(
    (a, b) => stageOrder(a.stage_goal) - stageOrder(b.stage_goal) || a.created_at.localeCompare(b.created_at)
  );
  if (stages.length === 0) return null;

  const passed = stages.some((s) => s.stage_goal === 'thank_you');
  const currentIdx = passed ? -1 : stages.length - 1;
  const isState = campaign.bill_level === 'state';
  const currentGoal = ((passed ? 'thank_you' : stages[stages.length - 1]?.stage_goal) || 'custom') as StageGoal;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 mb-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Where {campaign.bill_ref ?? 'the bill'} stands
        </h2>
        {passed && (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Passed
          </span>
        )}
      </div>
      {campaign.bill_title && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{campaign.bill_title}</p>}

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-5 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
        {happeningNow(currentGoal)}
      </p>

      <ol className="space-y-0">
        {stages.map((s, i) => {
          const done = passed || i < currentIdx;
          const current = i === currentIdx;
          return (
            <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < stages.length - 1 && (
                <span className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${done ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
              <span
                className={`relative shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : current
                      ? 'bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-900/40'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`text-sm font-medium ${current ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                  {publicLabel(((s.stage_goal as string) || 'custom') as StageGoal, isState)}
                  {current && <span className="ml-2 text-xs font-semibold uppercase tracking-wide">← we are here</span>}
                </p>
                {current && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    <Link href={`/campaign/${s.slug}`} className="text-purple-600 dark:text-purple-400 hover:underline">
                      {s.headline} — take action
                    </Link>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

    </div>
  );
}
