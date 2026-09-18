import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { STAGE_GOAL_LABELS, stageOrder, type StageGoal } from '@/lib/stages';
import { getCommittee } from '@/lib/committees';
import { getStateCommittee } from '@/lib/state-committees';
import { CopyLinkButton } from '@/components/campaign/CopyLinkButton';
import { EmbedCodeButton } from '@/components/campaign/EmbedCodeButton';
import { QrCodeButton } from '@/components/campaign/QrCodeButton';
import { DeleteCampaignButton } from '@/components/campaign/DeleteCampaignButton';

export const metadata: Metadata = {
  title: 'Manage Campaign | My Democracy',
  description: 'Your campaign and the advocacy actions that feed into it, in one place.',
};

interface ActionCampaign {
  id: string;
  slug: string;
  headline: string;
  stage_goal: string | null;
  target_filter: { type?: string; committee_id?: string; state?: string } | null;
  approval_status: string | null;
  action_count: number | null;
  created_at: string;
}

// pending / needs changes / live, same vocabulary as the dashboard cards.
function approvalBadge(approval: string) {
  if (approval === 'pending') {
    return { label: 'Pending review', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
  }
  if (approval === 'rejected') {
    return { label: 'Needs changes', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  }
  return { label: 'Live', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
}

export default async function ManageCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/campaign/${slug}/manage`)}`);
  }

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!campaign) {
    notFound();
  }
  if (campaign.creator_id !== user.id) {
    redirect('/dashboard');
  }

  // Actions are managed from their parent: this page IS the parent's view.
  if (campaign.parent_campaign_id) {
    const { data: parent } = await admin
      .from('campaigns')
      .select('slug')
      .eq('id', campaign.parent_campaign_id)
      .single();
    redirect(parent ? `/campaign/${parent.slug}/manage` : '/dashboard');
  }

  // Storytelling campaigns get the same toolbar; they just have no report
  // and no advocacy actions.
  const isStory = campaign.campaign_type === 'storytelling';

  const { data: childRows } = await admin
    .from('campaigns')
    .select('id, slug, headline, stage_goal, target_filter, approval_status, action_count, created_at')
    .eq('parent_campaign_id', campaign.id);
  const actions = ((childRows ?? []) as ActionCampaign[]).sort(
    (a, b) => stageOrder(a.stage_goal) - stageOrder(b.stage_goal) || a.created_at.localeCompare(b.created_at)
  );

  const badge = approvalBadge(String(campaign.approval_status || 'approved'));
  const count = isStory ? Number(campaign.story_count) || 0 : Number(campaign.action_count) || 0;
  const directionLabel =
    campaign.direction === 'support' ? 'Supporting' : campaign.direction === 'oppose' ? 'Opposing' : null;

  const addActionHref = `/campaign/create?type=advocacy&parent=${campaign.id}&parent_name=${encodeURIComponent(
    campaign.headline
  )}${campaign.bill_level === 'state' && campaign.bill_state ? `&state=${campaign.bill_state}` : ''}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
          &larr; Dashboard
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.headline}</h1>
          <span className={`shrink-0 mt-1 px-2.5 py-1 text-xs font-medium rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {isStory
            ? `${count.toLocaleString()} stor${count === 1 ? 'y' : 'ies'} collected`
            : `${count.toLocaleString()} constituent action${count !== 1 ? 's' : ''}`}
          {directionLabel && campaign.bill_ref
            ? ` · ${directionLabel} ${campaign.bill_ref}`
            : directionLabel
              ? ` · ${directionLabel}`
              : campaign.bill_ref
                ? ` · ${campaign.bill_ref}`
                : ''}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          href={`/campaign/${campaign.slug}`}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          View Campaign
        </Link>
        <Link
          href={`/campaign/${campaign.slug}/analytics`}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Analytics
        </Link>
        {!isStory && (
          <Link
            href={`/campaign/${campaign.slug}/report`}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            Report
          </Link>
        )}
        <CopyLinkButton slug={campaign.slug} />
        <EmbedCodeButton slug={campaign.slug} />
        <QrCodeButton slug={campaign.slug} />
        <Link
          href={`/campaign/${campaign.slug}/edit`}
          className="p-2 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
          title="Edit campaign"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
        <DeleteCampaignButton slug={campaign.slug} headline={campaign.headline} />
      </div>

      {/* Actions (advocacy only) */}
      {!isStory && (
      <section>
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h2>
          <Link
            href={addActionHref}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            + Add an action
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Break your campaign into actions, like a cosponsor push or a committee vote. Each one has its own targets and share link.
        </p>

        {actions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">No actions yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              Start with a cosponsor push or a committee vote. When the bill moves, add the next action and your past
              supporters get invited back.
            </p>
            <Link
              href={addActionHref}
              className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add an action
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actions.map((a) => {
              const committee =
                a.target_filter?.type === 'committee' && a.target_filter.committee_id
                  ? a.target_filter.state
                    ? getStateCommittee(a.target_filter.state, a.target_filter.committee_id)
                    : getCommittee(a.target_filter.committee_id)
                  : null;
              const childBadge = approvalBadge(String(a.approval_status || 'approved'));
              const childCount = Number(a.action_count) || 0;
              return (
                <div
                  key={a.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                      {STAGE_GOAL_LABELS[(a.stage_goal ?? 'custom') as StageGoal] ?? 'Action'}
                      {committee ? ` · ${committee.name}` : ''}
                    </p>
                    <span className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-full ${childBadge.cls}`}>
                      {childBadge.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{a.headline}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {childCount.toLocaleString()} constituent action{childCount !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/campaign/${a.slug}`}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/campaign/${a.slug}/analytics`}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Analytics
                    </Link>
                    <CopyLinkButton slug={a.slug} />
                    <QrCodeButton slug={a.slug} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
