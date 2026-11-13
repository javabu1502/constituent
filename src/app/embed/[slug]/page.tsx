import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { CAMPAIGN_PAGE_COLUMNS } from '@/lib/campaign-columns';
import { CampaignParticipate } from '@/components/campaign/CampaignParticipate';
import { StorytellerFlow } from '@/components/campaign/StorytellerFlow';
import { EmbedAttribution } from '@/components/embed/EmbedAttribution';
import { EmbedAutoHeight } from '@/components/embed/EmbedAutoHeight';
import { CampaignClosedNotice } from '@/components/campaign/CampaignClosedNotice';
import { isCampaignClosed } from '@/lib/campaign-close';
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
    .select(CAMPAIGN_PAGE_COLUMNS)
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

  // The embed filtered on approval_status and never on status, so a closed
  // campaign kept rendering a form whose submit failed with a generic error
  // on the org's own website. It gets the same closed state as the public
  // page, with links that break out of the iframe.
  const closed = isCampaignClosed(campaign.status);
  let closedOutcome: string | null = null;
  let onwardCampaigns: { slug: string; headline: string }[] = [];
  if (closed) {
    const { data: ownerRow } = await admin
      .from('campaigns')
      .select('creator_id, outcome')
      .eq('id', campaign.id)
      .single();
    closedOutcome = (ownerRow?.outcome as string | null) ?? null;
    if (ownerRow?.creator_id) {
      const { data: siblings } = await admin
        .from('campaigns')
        .select('slug, headline')
        .eq('creator_id', ownerRow.creator_id)
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .is('parent_campaign_id', null)
        .neq('id', campaign.id)
        .order('created_at', { ascending: false })
        .limit(3);
      onwardCampaigns = (siblings ?? []) as { slug: string; headline: string }[];
    }
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
            <div className="p-3 bg-surface dark:bg-gray-800 rounded-lg border border-rule dark:border-gray-700">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">The case for</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{campaign.case_for}</p>
            </div>
            <div className="p-3 bg-surface dark:bg-gray-800 rounded-lg border border-rule dark:border-gray-700">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">The case against</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{campaign.case_against}</p>
            </div>
          </div>
        )}

        {closed ? (
          <CampaignClosedNotice
            language={campaign.language}
            isStory={isStory}
            outcome={closedOutcome}
            orgName={campaign.org_name ?? null}
            otherCampaigns={onwardCampaigns}
            inEmbed
          />
        ) : (
          <div className="bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 p-4 sm:p-5">
            {isStory ? (
              <StorytellerFlow campaign={campaign} />
            ) : (
              <CampaignParticipate campaign={campaign} parentCampaign={parentCampaign} />
            )}
          </div>
        )}

        <EmbedAttribution href={`https://www.mydemocracy.app/campaign/${campaign.slug}`} source="campaign" />
      </div>
    </EmbedAutoHeight>
  );
}
