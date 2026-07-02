import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { CampaignAnalytics } from '@/components/campaign/CampaignAnalytics';
import { usageLabels } from '@/lib/story-usage';
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

  // ----- Storytelling campaigns: running count + non-identifying subjects -----
  if (campaign.campaign_type === 'storytelling') {
    const [{ data: subjectRows }, { data: storyRows }] = await Promise.all([
      admin
        .from('story_subjects')
        .select('title, created_at')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })
        .limit(100),
      admin
        .from('stories')
        // Include revoked so the collector is flagged (content hidden below).
        .select('id, created_at, attribution_level, storyteller_name, storyteller_email, city, state, title, body, status, edited_at, consent_usage_snapshot')
        .eq('campaign_id', campaign.id)
        .in('status', ['active', 'revoked'])
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const storyAnalytics = {
      kind: 'storytelling' as const,
      total_stories: campaign.story_count || 0,
      campaign_slug: campaign.slug as string,
      subjects: (subjectRows || []).map((s) => ({ title: s.title as string, created_at: s.created_at as string })),
      stories: (storyRows || []).map((s) => {
        const level = s.attribution_level as 'named' | 'first_name_only' | 'anonymous';
        const revoked = (s.status as string) === 'revoked';
        const snapshot = (s.consent_usage_snapshot ?? {}) as { granted_uses?: string[] };
        return {
          id: s.id as string,
          created_at: s.created_at as string,
          attribution_level: level,
          display_name: level === 'anonymous' ? 'Anonymous' : ((s.storyteller_name as string | null) || 'Unnamed'),
          // Revoked stories expose no content or identity.
          city: revoked ? null : ((s.city as string | null) ?? null),
          state: revoked ? null : ((s.state as string | null) ?? null),
          email: revoked ? null : ((s.storyteller_email as string | null) ?? null),
          title: revoked ? null : ((s.title as string | null) ?? null),
          body: revoked ? '' : ((s.body as string | null) ?? ''),
          granted_uses: revoked ? [] : usageLabels(snapshot.granted_uses ?? []),
          revoked,
          edited_at: (s.edited_at as string | null) ?? null,
        };
      }),
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
  const [messagesResult, actionsResult, statesResult, dailyCountsResult, deliveryBreakdownResult] = await Promise.all([
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
