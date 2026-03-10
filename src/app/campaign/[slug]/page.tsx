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
    title: `${campaign.headline} | My Democracy`,
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
        {/* Social proof bar */}
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {campaign.action_count}
              </span>
              <span className="text-sm text-purple-600 dark:text-purple-400">
                {campaign.action_count === 1 ? 'person has' : 'people have'} taken action
              </span>
            </div>
            <CopyLinkButton slug={campaign.slug} />
          </div>
          {/* Progress bar toward next milestone */}
          {(() => {
            const milestones = [10, 25, 50, 100, 250, 500, 1000];
            const next = milestones.find(m => m > campaign.action_count) ?? milestones[milestones.length - 1];
            const pct = Math.min((campaign.action_count / next) * 100, 100);
            return (
              <div>
                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                  <div className="h-2 rounded-full bg-purple-600 dark:bg-purple-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-purple-500 dark:text-purple-400 mt-1 text-right">
                  {campaign.action_count < next ? `${next - campaign.action_count} more to reach ${next}` : `${next}+ reached!`}
                </p>
              </div>
            );
          })()}
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
