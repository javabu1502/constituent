/**
 * Campaign impact report — the funder-facing narrative + numbers, as a single
 * SERIALIZABLE object. This is deliberately split from its presentation: the
 * report page renders it to a printable/PDF page today, and the SAME object is
 * what we'll later push to a CRM (Salesforce et al.) so an org's grant reports
 * and their pipeline tell one consistent story. Keep this JSON-clean (no React,
 * no DB handles) so it can cross that boundary untouched. See the Salesforce
 * plan for the eventual sync path.
 */
import { createAdminClient } from '@/lib/supabase';
import { getCachedInsights, type CampaignInsights } from '@/lib/insights';
import { stageOrder } from '@/lib/stages';

export interface ReportOfficial {
  name: string;
  party: string | null;
  level: string | null;
  chamber: string | null;
  messages: number;
}

export interface CampaignReport {
  campaign: {
    slug: string;
    headline: string;
    orgName: string | null;
    isOfficial: boolean;
    direction: 'support' | 'oppose' | null;
    startDate: string; // campaign created_at
  };
  reach: {
    constituents: number; // distinct participation actions
    messages: number; // messages generated/sent
    officialsContacted: number;
    statesReached: number;
    citiesReached: number;
    last30Days: number;
    weekOverWeekPct: number | null;
  };
  /** Cumulative participation since launch, ≤30 buckets — the growth story. */
  growth: { date: string; cumulative: number }[];
  topOfficials: ReportOfficial[];
  topStates: { state: string; count: number }[];
  stance: { support: number; oppose: number } | null; // null = directional/no split
  /** Messages by the receiving official's party. null = no party data. */
  parties: { democratic: number; republican: number; other: number } | null;
  /** Distinct officials contacted, by level of government. null = no level data. */
  officialLevels: { federal: number; state: number } | null;
  /** Messages by delivery channel, descending. Empty when untracked. */
  delivery: { method: string; count: number }[];
  /** Message mapping split (stage campaigns). null when untracked. */
  intents: { persuade: number; thank: number } | null;
  /** Storytelling campaigns only: consented-use + attribution rollup. */
  storyImpact: {
    total: number;
    named: number;
    firstNameOnly: number;
    anonymous: number;
    pressReady: number; // granted 'shared_with_media'
    contactable: number; // granted 'contact_me_followup'
    statesReached: number;
  } | null;
  /** Our own Social Desk posts amplifying this campaign. null = none. */
  social: { posts: number; likes: number; reposts: number; replies: number } | null;
  /** Parent campaigns only: per-stage funnel down the legislative journey. */
  stages: { slug: string; headline: string; goal: string; constituents: number; messages: number }[] | null;
  insights: CampaignInsights | null;
  generatedAt: string;
}

type CampaignRow = {
  id: string;
  slug: string;
  headline: string;
  org_name: string | null;
  is_official: boolean | null;
  direction: 'support' | 'oppose' | null;
  campaign_type: string | null;
  support_count: number | null;
  oppose_count: number | null;
  created_at: string;
};

type MessageRow = {
  legislator_name: string | null;
  legislator_party: string | null;
  legislator_level: string | null;
  legislator_chamber: string | null;
  advocate_city: string | null;
  advocate_state: string | null;
  delivery_method: string | null;
  message_intent: string | null;
  created_at: string;
};

type ActionRow = {
  participant_city: string | null;
  participant_state: string | null;
  messages_sent: number | null;
  created_at: string;
};

type StoryRow = {
  attribution_level: string | null;
  storyteller_email: string | null;
  state: string | null;
  consent_usage_snapshot: { granted_uses?: string[] } | null;
};

type SocialPostRow = {
  metrics: { likeCount?: number; repostCount?: number; replyCount?: number } | null;
};

export interface ReportSourceRows {
  messages: MessageRow[];
  actions: ActionRow[];
  stories: StoryRow[] | null; // null = not a storytelling campaign
  socialPosts: SocialPostRow[];
  insights: CampaignInsights | null;
  /** Pre-counted child stages in journey order; null = not a parent. */
  stages: { slug: string; headline: string; goal: string; constituents: number; messages: number }[] | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PRESS_USE = 'shared_with_media';
const CONTACT_USE = 'contact_me_followup';

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/**
 * Pure assembly: rows in, report out. Split from the fetch so tests exercise
 * every aggregation without a Supabase mock and `nowMs` keeps it deterministic.
 */
export function assembleCampaignReport(campaign: CampaignRow, rows: ReportSourceRows, nowMs: number): CampaignReport {
  const msgs = rows.messages;
  const acts = rows.actions;

  // Reach.
  const officialAgg = new Map<string, ReportOfficial>();
  for (const m of msgs) {
    const name = (m.legislator_name || '').trim();
    if (!name) continue;
    const existing = officialAgg.get(name);
    if (existing) existing.messages += 1;
    else
      officialAgg.set(name, {
        name,
        party: m.legislator_party || null,
        level: m.legislator_level || null,
        chamber: m.legislator_chamber || null,
        messages: 1,
      });
  }

  const stateAgg = new Map<string, number>();
  const cities = new Set<string>();
  for (const a of acts) {
    if (a.participant_state) stateAgg.set(a.participant_state, (stateAgg.get(a.participant_state) || 0) + 1);
    if (a.participant_city) cities.add(`${a.participant_city}|${a.participant_state ?? ''}`);
  }
  // Fall back to message locations if actions carry no geography.
  if (stateAgg.size === 0) {
    for (const m of msgs) {
      if (m.advocate_state) stateAgg.set(m.advocate_state, (stateAgg.get(m.advocate_state) || 0) + 1);
      if (m.advocate_city) cities.add(`${m.advocate_city}|${m.advocate_state ?? ''}`);
    }
  }

  // Growth: cumulative participation since launch. Bucket the campaign's
  // lifetime into ≤30 slices so a week-old and a year-old campaign both fill
  // the chart; cumulative (not per-day) so sparse activity still draws a line.
  const actionSource = acts.length ? acts : msgs;
  const launchMs = Math.min(new Date(campaign.created_at).getTime(), nowMs);
  const spanDays = Math.max(1, Math.ceil((nowMs - launchMs) / DAY_MS));
  const bucketDays = Math.max(1, Math.ceil(spanDays / 30));
  const numBuckets = Math.ceil(spanDays / bucketDays);
  const bucketCounts = new Array<number>(numBuckets).fill(0);
  let last30Days = 0;
  for (const r of actionSource) {
    const t = new Date(r.created_at).getTime();
    if (t >= nowMs - 30 * DAY_MS) last30Days += 1;
    const idx = Math.min(numBuckets - 1, Math.max(0, Math.floor((t - launchMs) / (bucketDays * DAY_MS))));
    bucketCounts[idx] += 1;
  }
  let running = 0;
  const growth = bucketCounts.map((count, i) => {
    running += count;
    return { date: dayKey(new Date(Math.min(nowMs, launchMs + (i + 1) * bucketDays * DAY_MS)).toISOString()), cumulative: running };
  });

  // Week over week.
  const weekMs = 7 * DAY_MS;
  let thisWeek = 0;
  let prevWeek = 0;
  for (const r of actionSource) {
    const t = new Date(r.created_at).getTime();
    if (t >= nowMs - weekMs) thisWeek += 1;
    else if (t >= nowMs - 2 * weekMs) prevWeek += 1;
  }
  const weekOverWeekPct = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : null;

  const totalMessages = msgs.length;
  const totalActions = acts.length || totalMessages;

  // Stance: only meaningful when both sides exist (neutral official weigh-ins).
  const support = Number(campaign.support_count) || 0;
  const oppose = Number(campaign.oppose_count) || 0;
  const stance = support + oppose > 0 && support > 0 && oppose > 0 ? { support, oppose } : null;

  // Party split of messages. Prefix match absorbs the label variants the
  // legislator data actually carries (D / Dem / Democratic / DFL, R / Rep /
  // Republican); everything else — independents, nonpartisan seats — is other.
  let dem = 0;
  let rep = 0;
  let otherParty = 0;
  for (const m of msgs) {
    const p = (m.legislator_party || '').trim();
    if (!p) continue;
    if (/^d/i.test(p)) dem += 1;
    else if (/^r/i.test(p)) rep += 1;
    else otherParty += 1;
  }
  const parties = dem + rep + otherParty > 0 ? { democratic: dem, republican: rep, other: otherParty } : null;

  // Distinct officials by level of government.
  let federal = 0;
  let stateLevel = 0;
  for (const o of officialAgg.values()) {
    if (o.level === 'federal') federal += 1;
    else if (o.level === 'state') stateLevel += 1;
  }
  const officialLevels = federal + stateLevel > 0 ? { federal, state: stateLevel } : null;

  // Delivery channels.
  const deliveryAgg = new Map<string, number>();
  for (const m of msgs) {
    if (m.delivery_method) deliveryAgg.set(m.delivery_method, (deliveryAgg.get(m.delivery_method) || 0) + 1);
  }
  const delivery = [...deliveryAgg.entries()]
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);

  // Message mapping: thank vs persuade (stage campaigns).
  let persuade = 0;
  let thank = 0;
  for (const m of msgs) {
    if (m.message_intent === 'persuade') persuade += 1;
    else if (m.message_intent === 'thank') thank += 1;
  }
  const intents = persuade + thank > 0 ? { persuade, thank } : null;

  // Story impact (active stories only; callers pass null for non-storytelling).
  let storyImpact: CampaignReport['storyImpact'] = null;
  if (rows.stories) {
    const storyStates = new Set<string>();
    let named = 0;
    let firstNameOnly = 0;
    let anonymous = 0;
    let pressReady = 0;
    let contactable = 0;
    for (const s of rows.stories) {
      if (s.attribution_level === 'named') named += 1;
      else if (s.attribution_level === 'first_name_only') firstNameOnly += 1;
      else anonymous += 1;
      const uses = s.consent_usage_snapshot?.granted_uses ?? [];
      if (uses.includes(PRESS_USE)) pressReady += 1;
      if (uses.includes(CONTACT_USE) && s.storyteller_email) contactable += 1;
      if (s.state) storyStates.add(s.state.trim().toUpperCase());
    }
    storyImpact = {
      total: rows.stories.length,
      named,
      firstNameOnly,
      anonymous,
      pressReady,
      contactable,
      statesReached: storyStates.size,
    };
  }

  // Social amplification from our own posts.
  let social: CampaignReport['social'] = null;
  if (rows.socialPosts.length > 0) {
    let likes = 0;
    let reposts = 0;
    let replies = 0;
    for (const p of rows.socialPosts) {
      likes += p.metrics?.likeCount ?? 0;
      reposts += p.metrics?.repostCount ?? 0;
      replies += p.metrics?.replyCount ?? 0;
    }
    social = { posts: rows.socialPosts.length, likes, reposts, replies };
  }

  return {
    campaign: {
      slug: campaign.slug,
      headline: campaign.headline,
      orgName: campaign.org_name,
      isOfficial: !!campaign.is_official,
      direction: campaign.direction,
      startDate: campaign.created_at,
    },
    reach: {
      constituents: totalActions,
      messages: totalMessages,
      officialsContacted: officialAgg.size,
      statesReached: stateAgg.size,
      citiesReached: cities.size,
      last30Days,
      weekOverWeekPct,
    },
    growth,
    topOfficials: [...officialAgg.values()].sort((a, b) => b.messages - a.messages).slice(0, 8),
    topStates: [...stateAgg.entries()]
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    stance,
    parties,
    officialLevels,
    delivery,
    intents,
    storyImpact,
    social,
    stages: rows.stages,
    insights: rows.insights,
    generatedAt: new Date(nowMs).toISOString(),
  };
}

/**
 * Build the full impact report for a campaign. Owner-gating happens in the
 * caller (route/page); this just assembles the data with the admin client.
 * `nowMs` is injected so the output is deterministic for tests.
 */
export async function buildCampaignReport(campaign: CampaignRow, nowMs: number): Promise<CampaignReport> {
  const admin = createAdminClient();
  const isStorytelling = campaign.campaign_type === 'storytelling';

  const [{ data: messages }, { data: actions }, storiesRes, { data: socialPosts }, insightsRes] = await Promise.all([
    admin
      .from('messages')
      .select(
        'legislator_name, legislator_party, legislator_level, legislator_chamber, advocate_city, advocate_state, delivery_method, message_intent, created_at'
      )
      .eq('campaign_id', campaign.id)
      .limit(5000),
    admin
      .from('campaign_actions')
      .select('participant_city, participant_state, messages_sent, created_at')
      .eq('campaign_id', campaign.id)
      .limit(5000),
    isStorytelling
      ? admin
          .from('stories')
          .select('attribution_level, storyteller_email, state, consent_usage_snapshot')
          .eq('campaign_id', campaign.id)
          .eq('status', 'active')
          .limit(5000)
      : Promise.resolve({ data: null }),
    admin.from('social_posts').select('metrics').eq('campaign_slug', campaign.slug).eq('status', 'posted').limit(500),
    getCachedInsights(campaign.id, isStorytelling ? 'stories' : 'messages'),
  ]);

  // Stage roll-up (parent campaigns only): each child stage with its reach,
  // in legislative-journey order.
  let stages: ReportSourceRows['stages'] = null;
  const { data: children } = await admin
    .from('campaigns')
    .select('id, slug, headline, stage_goal, created_at')
    .eq('parent_campaign_id', campaign.id)
    .order('created_at', { ascending: true });
  if (children && children.length > 0) {
    const counted = await Promise.all(
      children.map(async (c) => {
        const [{ count: constituents }, { count: msgCount }] = await Promise.all([
          admin.from('campaign_actions').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id),
          admin.from('messages').select('id', { count: 'exact', head: true }).eq('campaign_id', c.id),
        ]);
        return {
          slug: c.slug as string,
          headline: c.headline as string,
          goal: (c.stage_goal as string) || 'custom',
          constituents: constituents ?? 0,
          messages: msgCount ?? 0,
          created_at: c.created_at as string,
        };
      })
    );
    stages = counted
      .sort((a, b) => stageOrder(a.goal) - stageOrder(b.goal) || a.created_at.localeCompare(b.created_at))
      .map(({ slug, headline, goal, constituents, messages: m }) => ({ slug, headline, goal, constituents, messages: m }));
  }

  return assembleCampaignReport(
    campaign,
    {
      messages: (messages ?? []) as MessageRow[],
      actions: (actions ?? []) as ActionRow[],
      stories: isStorytelling ? ((storiesRes.data ?? []) as StoryRow[]) : null,
      socialPosts: (socialPosts ?? []) as SocialPostRow[],
      insights: insightsRes?.insights ?? null,
      stages,
    },
    nowMs
  );
}
