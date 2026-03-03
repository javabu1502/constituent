import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { CampaignFilters } from '@/components/campaign/CampaignFilters';

export const metadata: Metadata = {
  title: 'Campaigns | My Democracy',
  description: 'Browse public civic campaigns. Rally others around issues you care about.',
  openGraph: {
    title: 'Campaigns | My Democracy',
    description: 'Browse public civic campaigns. Rally others around issues you care about.',
  },
};

export default async function CampaignsPage() {
  const admin = createAdminClient();
  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id, slug, headline, description, issue_area, action_count, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Browse public campaigns and rally others around the issues you care about.
          </p>
        </div>
        <Link
          href="/campaign/create"
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0 text-center"
        >
          Start a Campaign
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No campaigns yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to start a campaign and rally others around an issue you care about.</p>
          <Link
            href="/campaign/create"
            className="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Start a Campaign
          </Link>
        </div>
      ) : (
        <CampaignFilters campaigns={campaigns} />
      )}
    </div>
  );
}
