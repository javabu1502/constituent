import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { CampaignFilters } from '@/components/campaign/CampaignFilters';

export const metadata: Metadata = {
  title: 'Where Do You Stand? | My Democracy',
  description:
    'The questions being decided in Washington right now. Read both sides, pick your position, and send it to the people who represent you.',
  alternates: {
    canonical: 'https://www.mydemocracy.app/issues',
  },
  openGraph: {
    title: 'Where Do You Stand? | My Democracy',
    description:
      'The questions being decided in Washington right now. Read both sides, pick your position, and send it to the people who represent you.',
  },
};

export default async function IssuesPage() {
  const admin = createAdminClient();
  const { data: issues } = await admin
    .from('campaigns')
    .select('id, slug, headline, description, issue_area, action_count, created_at')
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .eq('visibility', 'public')
    .eq('campaign_type', 'advocacy') // storytelling campaigns are link-only, never listed
    .order('created_at', { ascending: false })
    .limit(50);

  // Platform-wide social proof: total positions sent across all issues.
  const { data: totalsRows } = await admin
    .from('campaigns')
    .select('action_count')
    .eq('approval_status', 'approved')
    .eq('campaign_type', 'advocacy')
    .limit(2000);
  const totalActions = (totalsRows ?? []).reduce((sum, r) => sum + (Number(r.action_count) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Where Do You Stand?</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            The questions being decided in Washington right now. Read both sides, pick your position,
            and send it to the people who represent you. We don&rsquo;t take sides — you do.
          </p>
          {totalActions > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {totalActions.toLocaleString()} {totalActions !== 1 ? 'people have' : 'person has'} weighed in
              </span>
            </div>
          )}
        </div>
        <Link
          href="/campaigns"
          className="px-4 py-2.5 border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-medium rounded-lg transition-colors shrink-0 text-center"
        >
          Running a campaign? &rarr;
        </Link>
      </div>

      {!issues || issues.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No open questions right now</h3>
          <p className="text-gray-600 dark:text-gray-400">Check back soon — new issues are added as debates move in Washington.</p>
        </div>
      ) : (
        <CampaignFilters campaigns={issues} />
      )}
    </div>
  );
}
