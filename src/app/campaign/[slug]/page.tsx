import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { CampaignParticipate } from '@/components/campaign/CampaignParticipate';
import { CopyLinkButton } from '@/components/campaign/CopyLinkButton';
import type { Campaign } from '@/lib/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('headline, description')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!campaign) {
    return { title: 'Campaign Not Found' };
  }

  return {
    title: `${campaign.headline} — My Democracy`,
    description: campaign.description,
    openGraph: {
      title: campaign.headline,
      description: campaign.description,
    },
  };
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    notFound();
  }

  const campaign = data as Campaign;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Campaign header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            {campaign.issue_area}
          </span>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 capitalize">
            {campaign.target_level === 'both' ? 'Federal & State' : campaign.target_level}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {campaign.headline}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {campaign.description}
        </p>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {campaign.action_count} action{campaign.action_count !== 1 ? 's' : ''} taken
          </span>
          <CopyLinkButton slug={campaign.slug} />
        </div>
      </div>

      {/* Participation form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Take Action</h2>
        <CampaignParticipate campaign={campaign} />
      </div>
    </div>
  );
}
