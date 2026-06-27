import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { CampaignAnalytics } from '@/components/campaign/CampaignAnalytics';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('headline')
    .eq('slug', slug)
    .single();

  if (!campaign) {
    return { title: 'Campaign Not Found' };
  }

  return {
    title: `Analytics - ${campaign.headline} | My Democracy`,
  };
}

export default async function CampaignAnalyticsPage({ params }: PageProps) {
  const { slug } = await params;

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const admin = createAdminClient();

  // Fetch campaign
  const { data: campaign, error } = await admin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !campaign) {
    notFound();
  }

  // Verify ownership
  if (campaign.creator_id !== user.id) {
    redirect(`/campaign/${slug}`);
  }

  // ----- Storytelling campaigns: story-based analytics -----
  if (campaign.campaign_type === 'storytelling') {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: storyRows } = await admin
      .from('stories')
      .select('attribution_level, created_at')
      .eq('campaign_id', campaign.id);

    const attribution_breakdown: Record<string, number> = {};
    const daily_counts: Record<string, number> = {};
    for (const s of storyRows || []) {
      attribution_breakdown[s.attribution_level] = (attribution_breakdown[s.attribution_level] || 0) + 1;
      if (s.created_at >= since) {
        const d = new Date(s.created_at).toISOString().split('T')[0];
        daily_counts[d] = (daily_counts[d] || 0) + 1;
      }
    }

    const storyAnalytics = {
      kind: 'storytelling' as const,
      total_stories: campaign.story_count || 0,
      saved_stories: (storyRows || []).length,
      attribution_breakdown,
      daily_counts,
    };

    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{campaign.headline}</p>
        </div>
        <CampaignAnalytics analytics={storyAnalytics} campaignName={campaign.headline} />
      </div>
    );
  }

  // ----- Advocacy campaigns: action/message analytics -----
  const [messagesResult, actionsResult, statesResult, recentActionsResult, dailyCountsResult, deliveryBreakdownResult] = await Promise.all([
    admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id),
    admin
      .from('campaign_actions')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id),
    admin
      .from('campaign_actions')
      .select('participant_state')
      .eq('campaign_id', campaign.id),
    admin
      .from('campaign_actions')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false })
      .limit(50),
    // Daily counts (last 30 days)
    admin
      .from('campaign_actions')
      .select('created_at')
      .eq('campaign_id', campaign.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    // Delivery breakdown
    admin
      .from('messages')
      .select('delivery_method')
      .eq('campaign_id', campaign.id),
  ]);

  // Daily counts
  const dailyCounts: Record<string, number> = {};
  for (const action of dailyCountsResult.data || []) {
    const date = new Date(action.created_at).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  }

  // Delivery breakdown
  const deliveryBreakdown: Record<string, number> = {};
  for (const msg of deliveryBreakdownResult.data || []) {
    const method = msg.delivery_method || 'unknown';
    deliveryBreakdown[method] = (deliveryBreakdown[method] || 0) + 1;
  }

  // Top states
  const stateCounts: Record<string, number> = {};
  for (const action of statesResult.data || []) {
    const state = action.participant_state;
    stateCounts[state] = (stateCounts[state] || 0) + 1;
  }
  const topStates = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const statesSet = new Set(
    (statesResult.data || []).map((a: { participant_state: string }) => a.participant_state)
  );

  const totalMessages = messagesResult.count || 0;
  const totalActions = actionsResult.count || 0;

  const analytics = {
    kind: 'advocacy' as const,
    total_actions: totalActions,
    total_messages: totalMessages,
    states_represented: Array.from(statesSet),
    daily_counts: dailyCounts,
    delivery_breakdown: deliveryBreakdown,
    top_states: topStates,
    avg_messages_per_action: totalActions > 0 ? Math.round((totalMessages / totalActions) * 10) / 10 : 0,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Campaign Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {campaign.headline}
        </p>
      </div>

      <CampaignAnalytics analytics={analytics} campaignName={campaign.headline} />
    </div>
  );
}
