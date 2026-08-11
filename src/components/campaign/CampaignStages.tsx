import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { STAGE_GOAL_LABELS, stageOrder, type StageGoal } from '@/lib/stages';
import { getCommittee } from '@/lib/committees';
import { getStateCommittee } from '@/lib/state-committees';

interface StageCampaign {
  id: string;
  slug: string;
  headline: string;
  stage_goal: string | null;
  target_filter: { type?: string; committee_id?: string; state?: string } | null;
  status: string | null;
  created_at: string;
}

/**
 * Owner-facing stages panel on campaign analytics. For a parent campaign:
 * lists its stages with per-stage reach and an "Add a stage" entry point.
 * For a stage: links back to the parent. Server component — owner gating is
 * the page's job.
 */
export async function CampaignStages({
  campaign,
}: {
  campaign: {
    id: string;
    slug: string;
    headline: string;
    parent_campaign_id: string | null;
    bill_level?: string | null;
    bill_state?: string | null;
  };
}) {
  const admin = createAdminClient();

  // A stage links back to its parent instead of listing children.
  if (campaign.parent_campaign_id) {
    const { data: parent } = await admin
      .from('campaigns')
      .select('slug, headline')
      .eq('id', campaign.parent_campaign_id)
      .single();
    if (!parent) return null;
    return (
      <div className="mb-6 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-300">
        This campaign is a stage of{' '}
        <Link href={`/campaign/${parent.slug}/analytics`} className="font-semibold underline hover:no-underline">
          {parent.headline}
        </Link>
        . Its results roll up to the parent campaign.
      </div>
    );
  }

  const { data } = await admin
    .from('campaigns')
    .select('id, slug, headline, stage_goal, target_filter, status, created_at')
    .eq('parent_campaign_id', campaign.id)
    .order('created_at', { ascending: true });
  const stages = (data ?? []) as StageCampaign[];

  const counts = await Promise.all(
    stages.map(async (s) => {
      const [{ count: actions }, { count: messages }] = await Promise.all([
        admin.from('campaign_actions').select('id', { count: 'exact', head: true }).eq('campaign_id', s.id),
        admin.from('messages').select('id', { count: 'exact', head: true }).eq('campaign_id', s.id),
      ]);
      return { actions: actions ?? 0, messages: messages ?? 0 };
    })
  );

  const ordered = stages
    .map((s, i) => ({ ...s, ...counts[i] }))
    .sort((a, b) => stageOrder(a.stage_goal) - stageOrder(b.stage_goal) || a.created_at.localeCompare(b.created_at));

  return (
    <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Stages</h2>
        <Link
          href={`/campaign/create?type=advocacy&parent=${campaign.id}&parent_name=${encodeURIComponent(campaign.headline)}${
            campaign.bill_level === 'state' && campaign.bill_state ? `&state=${campaign.bill_state}` : ''
          }`}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        >
          + Add a stage
        </Link>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Follow the bill through Congress: recruit cosponsors, target the committee, then each floor vote — every stage
        reaches only the officials who matter at that step.
      </p>
      {ordered.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No stages yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {ordered.map((s) => {
            const committee =
              s.target_filter?.type === 'committee' && s.target_filter.committee_id
                ? s.target_filter.state
                  ? getStateCommittee(s.target_filter.state, s.target_filter.committee_id)
                  : getCommittee(s.target_filter.committee_id)
                : null;
            return (
              <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/campaign/${s.slug}/analytics`} className="text-sm font-medium text-gray-900 dark:text-white hover:underline">
                    {s.headline}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {STAGE_GOAL_LABELS[(s.stage_goal ?? 'custom') as StageGoal] ?? 'Custom stage'}
                    {committee ? ` · ${committee.name}` : ''}
                    {s.status === 'pending' ? ' · pending approval' : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{s.actions.toLocaleString()}</span> participants
                  <span className="mx-1">·</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{s.messages.toLocaleString()}</span> messages
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
