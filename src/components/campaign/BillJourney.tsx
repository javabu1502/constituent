import { createAdminClient } from '@/lib/supabase';
import Link from 'next/link';
import { STAGE_GOAL_LABELS, stageOrder, type StageGoal } from '@/lib/stages';
import { openstatesRestFetch } from '@/lib/openstates-api';

/**
 * "Where the bill stands" — the parent campaign's public journey tracker.
 * The campaign's stages ARE the tracking: each stage marks a step of the
 * bill's path, the newest stage is where the fight is now, and a thank-you
 * stage means it passed. When the bill is real we add the latest official
 * action line (Open States for state bills); a lookup miss just omits it.
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

// Latest-action lookups are slow (Open States rate-gates to 1 req/sec), so
// cache per bill for 6h — including misses, so a fictional/demo bill never
// costs the lookup twice.
const ACTION_TTL_MS = 6 * 60 * 60 * 1000;
const actionCache = new Map<string, { text: string | null; date: string | null; expires: number }>();

async function latestStateAction(state: string, ref: string): Promise<{ text: string | null; date: string | null }> {
  const key = `${state}/${ref}`;
  const hit = actionCache.get(key);
  if (hit && hit.expires > Date.now()) return hit;
  let out: { text: string | null; date: string | null } = { text: null, date: null };
  try {
    const res = await openstatesRestFetch('/bills', { jurisdiction: state, identifier: ref, sort: 'updated_desc', per_page: '1' });
    if (res.ok) {
      const data = await res.json();
      const bill = data?.results?.[0];
      if (bill?.latest_action_description) {
        out = { text: String(bill.latest_action_description).slice(0, 240), date: bill.latest_action_date ?? null };
      }
    }
  } catch {
    // Fail silent — the stage-derived journey still renders.
  }
  actionCache.set(key, { ...out, expires: Date.now() + ACTION_TTL_MS });
  return out;
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

  const action =
    campaign.bill_level === 'state' && campaign.bill_state && campaign.bill_ref
      ? await latestStateAction(campaign.bill_state, campaign.bill_ref)
      : { text: null, date: null };

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
      {campaign.bill_title && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{campaign.bill_title}</p>}

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
                  {STAGE_GOAL_LABELS[((s.stage_goal as string) || 'custom') as StageGoal] ?? 'Stage'}
                  {current && <span className="ml-2 text-xs font-semibold uppercase tracking-wide">← happening now</span>}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {current ? (
                    <Link href={`/campaign/${s.slug}`} className="text-purple-600 dark:text-purple-400 hover:underline">
                      {s.headline} — take action
                    </Link>
                  ) : (
                    <>Started {fmt(s.created_at)}</>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {action.text && (
        <p className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Latest official action{action.date ? ` (${fmt(action.date)})` : ''}:</span>{' '}
          {action.text}
        </p>
      )}
    </div>
  );
}
