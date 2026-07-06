import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { CampaignAnalytics } from '@/components/campaign/CampaignAnalytics';
import { usageLabels } from '@/lib/story-usage';
import { findSenators } from '@/lib/legislators';
import { US_STATES } from '@/lib/constants';
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
        .select('id, created_at, attribution_level, storyteller_name, storyteller_email, city, state, title, body, status, edited_at, consent_usage_snapshot, shared_reps')
        .eq('campaign_id', campaign.id)
        .in('status', ['active', 'revoked'])
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    // Normalize "NV" / "Nevada" to a two-letter code.
    const stateCodeOf = (raw: string | null): string | null => {
      if (!raw) return null;
      const t = raw.trim();
      if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
      const match = US_STATES.find((s) => s.name.toLowerCase() === t.toLowerCase());
      return match?.code ?? null;
    };

    type StoryRep = { name: string; title: string | null; party: string | null; state: string | null; level: string; inferred: boolean };

    // Fallback for stories submitted before shared_reps existed (or where the
    // rep lookup failed): a state alone pins down its two US senators exactly.
    const senatorCache = new Map<string, StoryRep[]>();
    const senatorsFor = (code: string): StoryRep[] => {
      let cached = senatorCache.get(code);
      if (!cached) {
        try {
          cached = findSenators(code).map((o) => ({
            name: o.name,
            title: o.title || 'U.S. Senator',
            party: o.party || null,
            state: o.state || code,
            level: 'federal',
            inferred: true,
          }));
        } catch {
          cached = [];
        }
        senatorCache.set(code, cached);
      }
      return cached;
    };

    const officialAgg = new Map<string, { name: string; title: string | null; party: string | null; state: string | null; level: string; story_count: number; inferred: boolean }>();

    const stories = (storyRows || []).map((s) => {
      const level = s.attribution_level as 'named' | 'first_name_only' | 'anonymous';
      const revoked = (s.status as string) === 'revoked';
      const snapshot = (s.consent_usage_snapshot ?? {}) as { granted_uses?: string[] };
      const grantedValues = snapshot.granted_uses ?? [];

      // Officials representing this storyteller: exact when shared at submit
      // time, otherwise inferred senators from the shared state.
      let reps: StoryRep[] = [];
      if (!revoked) {
        const shared = s.shared_reps as Array<{ name?: string; title?: string | null; party?: string | null; state?: string | null; level?: string | null }> | null;
        if (Array.isArray(shared) && shared.length > 0) {
          reps = shared
            .filter((r) => typeof r?.name === 'string' && r.name)
            .map((r) => ({ name: r.name as string, title: r.title ?? null, party: r.party ?? null, state: r.state ?? null, level: r.level ?? 'federal', inferred: false }));
        } else {
          const code = stateCodeOf((s.state as string | null) ?? null);
          if (code) reps = senatorsFor(code);
        }
        for (const r of reps) {
          const key = `${r.name}|${r.state ?? ''}`;
          const existing = officialAgg.get(key);
          if (existing) {
            existing.story_count += 1;
            existing.inferred = existing.inferred && r.inferred;
          } else {
            officialAgg.set(key, { name: r.name, title: r.title, party: r.party, state: r.state, level: r.level, story_count: 1, inferred: r.inferred });
          }
        }
      }

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
        granted_uses: revoked ? [] : usageLabels(grantedValues),
        granted_use_values: revoked ? [] : grantedValues,
        officials: reps.map((r) => r.name),
        revoked,
        edited_at: (s.edited_at as string | null) ?? null,
      };
    });

    const storyAnalytics = {
      kind: 'storytelling' as const,
      total_stories: campaign.story_count || 0,
      campaign_slug: campaign.slug as string,
      subjects: (subjectRows || []).map((s) => ({ title: s.title as string, created_at: s.created_at as string })),
      stories,
      officials: Array.from(officialAgg.values()).sort((a, b) => b.story_count - a.story_count),
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
  const [messagesResult, actionsResult] = await Promise.all([
    admin
      .from('messages')
      .select('delivery_method, delivery_status, legislator_name, legislator_party, legislator_level, legislator_chamber, advocate_city, advocate_state, created_at')
      .eq('campaign_id', campaign.id)
      .limit(10000),
    admin
      .from('campaign_actions')
      .select('participant_name, participant_city, participant_state, messages_sent, created_at')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false })
      .limit(10000),
  ]);

  const campaignMessages = messagesResult.data || [];
  const actions = actionsResult.data || [];

  // Daily counts (last 30 days) + weekly momentum
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const dailyCounts: Record<string, number> = {};
  let thisWeek = 0;
  let prevWeek = 0;
  for (const action of actions) {
    const ts = new Date(action.created_at).getTime();
    if (ts >= thirtyDaysAgo) {
      const date = new Date(action.created_at).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }
    if (ts >= sevenDaysAgo) thisWeek += 1;
    else if (ts >= fourteenDaysAgo) prevWeek += 1;
  }

  // Delivery breakdown (how) + outcome breakdown (how far it got)
  const deliveryBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  for (const msg of campaignMessages) {
    const method = msg.delivery_method || 'unknown';
    deliveryBreakdown[method] = (deliveryBreakdown[method] || 0) + 1;
    const status = msg.delivery_status || 'unknown';
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
  }

  // Officials contacted — which lawmakers this campaign's messages went to,
  // with level/chamber so the creator can see where pressure is landing.
  const officialCounts = new Map<string, { name: string; party: string | null; level: string | null; chamber: string | null; count: number }>();
  for (const msg of campaignMessages) {
    const name = (msg.legislator_name || '').trim();
    if (!name) continue;
    const existing = officialCounts.get(name);
    if (existing) {
      existing.count += 1;
    } else {
      officialCounts.set(name, {
        name,
        party: msg.legislator_party || null,
        level: msg.legislator_level || null,
        chamber: msg.legislator_chamber || null,
        count: 1,
      });
    }
  }
  const officialsContacted = Array.from(officialCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Party split of contacted officials' messages (is the pressure bipartisan?)
  const partySplit: Record<string, number> = {};
  for (const msg of campaignMessages) {
    const p = (msg.legislator_party || '').trim();
    if (!p) continue;
    partySplit[p] = (partySplit[p] || 0) + 1;
  }

  // Top states + cities (reach)
  const stateCounts: Record<string, number> = {};
  const cityCounts = new Map<string, { city: string; state: string | null; count: number }>();
  for (const action of actions) {
    const state = action.participant_state;
    if (state) stateCounts[state] = (stateCounts[state] || 0) + 1;
    const city = (action.participant_city || '').trim();
    if (city) {
      const key = `${city.toLowerCase()}|${state ?? ''}`;
      const existing = cityCounts.get(key);
      if (existing) existing.count += 1;
      else cityCounts.set(key, { city, state: state ?? null, count: 1 });
    }
  }
  const topStates = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const topCities = Array.from(cityCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Recent activity pulse — first name + last initial only.
  const recentActions = actions.slice(0, 8).map((a) => {
    const raw = (a.participant_name || '').trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    const display = parts.length === 0
      ? 'Someone'
      : parts.length === 1
        ? parts[0]
        : `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
    return {
      name: display,
      city: a.participant_city ?? null,
      state: a.participant_state ?? null,
      messages_sent: Number(a.messages_sent) || 0,
      created_at: a.created_at as string,
    };
  });

  const totalMessages = campaignMessages.length;
  const totalActions = actions.length;

  const analytics = {
    kind: 'advocacy' as const,
    total_actions: totalActions,
    total_messages: totalMessages,
    states_represented: Object.keys(stateCounts),
    daily_counts: dailyCounts,
    this_week: thisWeek,
    prev_week: prevWeek,
    delivery_breakdown: deliveryBreakdown,
    status_breakdown: statusBreakdown,
    party_split: partySplit,
    top_states: topStates,
    top_cities: topCities,
    officials_contacted: officialsContacted,
    recent_actions: recentActions,
    cities_count: cityCounts.size,
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
