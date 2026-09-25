import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { CampaignParticipate } from '@/components/campaign/CampaignParticipate';
import { StorytellerFlow } from '@/components/campaign/StorytellerFlow';
import { EmbedAutoHeight } from '@/components/embed/EmbedAutoHeight';
import type { Campaign } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Embeds live inside other sites' pages — never in a search index.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('headline')
    .eq('slug', slug)
    .eq('approval_status', 'approved')
    .single();

  return {
    title: campaign ? `${campaign.headline} | My Democracy` : 'Campaign Not Found',
    robots: { index: false, follow: false },
  };
}

export default async function CampaignEmbedPage({ params }: PageProps) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('campaigns')
    .select('id, slug, headline, description, issue_area, issue_subtopic, target_level, direction, status, campaign_type, visibility, message_template, bill_level, bill_state, bill_ref, bill_title, bill_url, story_prompt, usage_statement, usage_tags, attribution_options, edit_revoke_policy, action_count, story_count, created_at, org_name, org_url, org_logo_url, brand_color, custom_domain, case_for, case_against, source_for_label, source_for_url, source_against_label, source_against_url, is_bill_specific, bill_congress, bill_type, bill_number, support_count, oppose_count, undecided_count, is_official, parent_campaign_id, stage_goal, target_filter')
    .eq('slug', slug)
    .eq('approval_status', 'approved')
    .single();

  if (error || !data) {
    notFound();
  }

  const campaign = data as Campaign;
  const isStory = campaign.campaign_type === 'storytelling';

  let parentCampaign: { slug: string; headline: string } | null = null;
  if (campaign.parent_campaign_id) {
    const { data: parentRow } = await admin
      .from('campaigns')
      .select('slug, headline')
      .eq('id', campaign.parent_campaign_id)
      .eq('approval_status', 'approved')
      .single();
    parentCampaign = parentRow ?? null;
  }

  // Dormant bill identifiers must not reach the client at all — not even in
  // serialized props. Neutral issues carry no bill reference anywhere.
  const billSpecific = !!(campaign.is_bill_specific && campaign.bill_congress && campaign.bill_type && campaign.bill_number);
  if (!billSpecific) {
    campaign.bill_ref = null;
    campaign.bill_title = null;
    campaign.bill_url = null;
    campaign.bill_congress = null;
    campaign.bill_type = null;
    campaign.bill_number = null;
  }

  const count = isStory ? campaign.story_count : campaign.action_count;

  return (
    <EmbedAutoHeight>
      <div className="max-w-xl mx-auto px-4 py-5">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">
            {campaign.headline}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {campaign.description}
          </p>
          {count > 0 && (
            <p className="mt-2 text-xs font-medium text-purple-600 dark:text-purple-400">
              {isStory
                ? `${count} ${count === 1 ? 'person has' : 'people have'} shared their story`
                : `${count} ${count === 1 ? 'action' : 'actions'} taken`}
            </p>
          )}
        </div>

        {/* Official weigh-ins must show both sides wherever a stance can be
            taken — neutrality doesn't stop at the platform's own pages. */}
        {campaign.is_official && campaign.case_for && campaign.case_against && (
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">The case for</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{campaign.case_for}</p>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">The case against</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{campaign.case_against}</p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-5">
          {isStory ? (
            <StorytellerFlow campaign={campaign} />
          ) : (
            <CampaignParticipate campaign={campaign} parentCampaign={parentCampaign} />
          )}
        </div>

        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          <a
            href={`https://www.mydemocracy.app/campaign/${campaign.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-600 dark:hover:text-purple-400 hover:underline"
          >
            Powered by My Democracy
          </a>
        </p>
      </div>
    </EmbedAutoHeight>
  );
}
