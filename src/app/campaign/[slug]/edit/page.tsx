import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { CampaignForm, type CampaignEditInitial } from '@/components/campaign/CampaignForm';

export const metadata: Metadata = {
  title: 'Edit Campaign | My Democracy',
  description: 'Edit your campaign. Changes go back through review before going live.',
};

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/campaign/${slug}/edit`)}`);
  }

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!campaign || campaign.creator_id !== user.id) {
    notFound();
  }
  // Stages carry structure (parent, goal, committee) that isn't editable —
  // recreate the stage if it needs different targeting.
  if (campaign.parent_campaign_id) {
    redirect('/dashboard');
  }

  const initial: CampaignEditInitial = {
    campaignType: campaign.campaign_type === 'storytelling' ? 'storytelling' : 'advocacy',
    headline: campaign.headline ?? '',
    description: campaign.description ?? '',
    // Creation stores category in issue_area and the picked issue in
    // issue_subtopic when a category was chosen — reverse that mapping here.
    issueArea: campaign.issue_subtopic || campaign.issue_area || '',
    issueCategory: campaign.issue_subtopic ? campaign.issue_area ?? '' : '',
    targetLevel: (campaign.target_level as 'federal' | 'state' | 'both') ?? 'federal',
    direction: (campaign.direction as 'support' | 'oppose' | null) ?? '',
    messageTemplate: campaign.message_template ?? '',
    storyPrompt: campaign.story_prompt ?? '',
    usageTags: campaign.usage_tags ?? [],
    resolvedBill: campaign.bill_ref
      ? {
          level: campaign.bill_level === 'state' ? 'state' : 'federal',
          state: campaign.bill_state ?? undefined,
          ref: campaign.bill_ref,
          title: campaign.bill_title ?? '',
          url: campaign.bill_url ?? '',
        }
      : null,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Edit Campaign</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{campaign.headline}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        <CampaignForm
          edit={{
            slug,
            wasApproved: campaign.approval_status === 'approved',
            initial,
          }}
        />
      </div>
    </div>
  );
}
