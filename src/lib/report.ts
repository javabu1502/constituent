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
  momentum: { date: string; count: number }[]; // last 30 days, ascending
  topOfficials: ReportOfficial[];
  topStates: { state: string; count: number }[];
  stance: { support: number; oppose: number } | null; // null = directional/no split
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

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/**
 * Build the full impact report for a campaign. Owner-gating happens in the
 * caller (route/page); this just assembles the data with the admin client.
 * `nowMs` is injected so the output is deterministic for tests.
 */
export async function buildCampaignReport(campaign: CampaignRow, nowMs: number): Promise<CampaignReport> {
  const admin = createAdminClient();

  const [{ data: messages }, { data: actions }, insightsRes] = await Promise.all([
    admin
      .from('messages')
      .select('legislator_name, legislator_party, legislator_level, legislator_chamber, advocate_city, advocate_state, created_at')
      .eq('campaign_id', campaign.id)
      .limit(5000),
    admin
      .from('campaign_actions')
      .select('participant_city, participant_state, messages_sent, created_at')
      .eq('campaign_id', campaign.id)
      .limit(5000),
    getCachedInsights(campaign.id, campaign.campaign_type === 'storytelling' ? 'stories' : 'messages'),
  ]);

  const msgs = messages ?? [];
  const acts = actions ?? [];

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

  // Momentum: last 30 days, ascending.
  const start = nowMs - 29 * DAY_MS;
  const dayCounts = new Map<string, number>();
  for (let i = 0; i < 30; i++) dayCounts.set(new Date(start + i * DAY_MS).toISOString().slice(0, 10), 0);
  const actionSource = acts.length ? acts : msgs;
  for (const r of actionSource) {
    const t = new Date(r.created_at).getTime();
    if (t >= start) {
      const k = dayKey(r.created_at);
      if (dayCounts.has(k)) dayCounts.set(k, (dayCounts.get(k) || 0) + 1);
    }
  }
  const momentum = [...dayCounts.entries()].map(([date, count]) => ({ date, count }));

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
      last30Days: momentum.reduce((n, d) => n + d.count, 0),
      weekOverWeekPct,
    },
    momentum,
    topOfficials: [...officialAgg.values()].sort((a, b) => b.messages - a.messages).slice(0, 8),
    topStates: [...stateAgg.entries()]
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    stance,
    insights: insightsRes?.insights ?? null,
    generatedAt: new Date(nowMs).toISOString(),
  };
}
