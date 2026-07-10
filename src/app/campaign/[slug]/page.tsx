import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { CampaignParticipate } from '@/components/campaign/CampaignParticipate';
import { StorytellerFlow } from '@/components/campaign/StorytellerFlow';
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
    .select('headline, description, visibility')
    .eq('slug', slug)
    .eq('approval_status', 'approved')
    .single();

  if (!campaign) {
    return { title: 'Campaign Not Found' };
  }

  return {
    title: `${campaign.headline} | My Democracy`,
    description: campaign.description,
    // Unlisted campaigns (all storytelling ones) are shared by link only —
    // keep them out of search engines even if the link circulates.
    robots: campaign.visibility === 'unlisted' ? { index: false, follow: false } : undefined,
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
    .select('id, slug, headline, description, issue_area, issue_subtopic, target_level, status, campaign_type, visibility, message_template, bill_level, bill_state, bill_ref, bill_title, bill_url, story_prompt, usage_statement, usage_tags, attribution_options, edit_revoke_policy, action_count, story_count, created_at, org_name, org_url, org_logo_url, brand_color, custom_domain, case_for, case_against, source_for_label, source_for_url, source_against_label, source_against_url')
    .eq('slug', slug)
    .eq('approval_status', 'approved')
    .single();

  if (error || !data) {
    notFound();
  }

  const campaign = data as Campaign;
  const isStory = campaign.campaign_type === 'storytelling';

  // White-label branding (unlisted campaigns only — the insert enforces this)
  const branded = !!(campaign.org_name || campaign.org_logo_url);
  const brandColor = campaign.brand_color || null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Organization branding banner */}
      {branded && (
        <div
          className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4"
          style={brandColor ? { borderTop: `4px solid ${brandColor}` } : undefined}
        >
          {campaign.org_logo_url && (
            <img
              src={campaign.org_logo_url}
              alt={campaign.org_name ? `${campaign.org_name} logo` : 'Organization logo'}
              className="h-12 max-w-[180px] object-contain shrink-0"
            />
          )}
          {campaign.org_name && (
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">A campaign by</p>
              {campaign.org_url ? (
                <a
                  href={campaign.org_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-gray-900 dark:text-white hover:underline"
                >
                  {campaign.org_name}
                </a>
              ) : (
                <p className="text-base font-semibold text-gray-900 dark:text-white">{campaign.org_name}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Campaign header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {campaign.issue_area && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              {campaign.issue_area}
            </span>
          )}
          {isStory ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Share your story
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 capitalize">
              {campaign.target_level === 'both' ? 'Federal & State' : campaign.target_level}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {campaign.headline}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {campaign.description}
        </p>

        {/* Where do you stand? — both sides, visually equal, neither emphasized */}
        {campaign.case_for && campaign.case_against && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Where do you stand?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">The case for</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">{campaign.case_for}</p>
                {campaign.source_for_url && campaign.source_for_label && (
                  <a
                    href={campaign.source_for_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Go deeper: {campaign.source_for_label} &rarr;
                  </a>
                )}
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">The case against</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">{campaign.case_against}</p>
                {campaign.source_against_url && campaign.source_against_label && (
                  <a
                    href={campaign.source_against_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Go deeper: {campaign.source_against_label} &rarr;
                  </a>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              My Democracy doesn&rsquo;t take a side — you choose your position below, and your message carries it.
            </p>
          </div>
        )}

        {/* Related bill */}
        {campaign.bill_url && (
          <a
            href={campaign.bill_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 hover:underline"
          >
            {campaign.bill_title?.startsWith('No single bill') ? '📚 Context: ' : '📄 The bill: '}
            <span className="font-medium">
              {campaign.bill_ref && campaign.bill_title && !campaign.bill_title.includes(campaign.bill_ref) ? `${campaign.bill_ref} — ` : ''}{campaign.bill_title || 'View bill'}
            </span>
            {campaign.bill_level === 'state' && campaign.bill_state ? ` (${campaign.bill_state})` : ''}
          </a>
        )}
        {/* Social proof bar */}
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {isStory ? campaign.story_count : campaign.action_count}
              </span>
              <span className="text-sm text-purple-600 dark:text-purple-400">
                {isStory
                  ? `${(campaign.story_count === 1) ? 'person has' : 'people have'} shared their story`
                  : `${(campaign.action_count === 1) ? 'person has' : 'people have'} taken action`}
              </span>
            </div>
            <CopyLinkButton slug={campaign.slug} />
          </div>
          {/* Progress bar toward next milestone */}
          {(() => {
            const count = isStory ? campaign.story_count : campaign.action_count;
            const milestones = [10, 25, 50, 100, 250, 500, 1000];
            const next = milestones.find(m => m > count) ?? milestones[milestones.length - 1];
            const pct = Math.min((count / next) * 100, 100);
            return (
              <div>
                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                  <div className="h-2 rounded-full bg-purple-600 dark:bg-purple-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-purple-500 dark:text-purple-400 mt-1 text-right">
                  {count < next ? `${next - count} more to reach ${next}` : `${next}+ reached!`}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Participation form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {isStory ? 'Share Your Story' : 'Take Action'}
        </h2>
        {isStory ? <StorytellerFlow campaign={campaign} /> : <CampaignParticipate campaign={campaign} />}
      </div>
    </div>
  );
}
