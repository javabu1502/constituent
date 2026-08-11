/**
 * AI-themed campaign insights — "what constituents are actually saying".
 *
 * Our structural edge over template tools (Muster/VoterVoice): we collect
 * UNIQUE constituent messages and free-text STORIES, so we can theme what
 * people genuinely say. This module runs one neutral, faithful LLM pass over a
 * campaign's stories (storytelling) or message bodies (advocacy) and caches the
 * result in campaign_insights, keyed by (campaign, kind). Generation is
 * on-demand (owner clicks generate/refresh) — never on page load.
 *
 * Privacy: insights are OWNER-ONLY (the campaign creator already sees the raw
 * rows in their analytics). We still instruct the model to produce THEMES only
 * — no names, emails, or identifying details in the summary or quotes.
 */
import { createAdminClient } from '@/lib/supabase';
import { callClaude, extractJSON } from '@/lib/claude';

export type InsightKind = 'stories' | 'messages';

export interface InsightTheme {
  /** Short human label for the theme. */
  label: string;
  /** Roughly how many of the sources touch this theme. */
  prevalence: number;
  /** One short verbatim, de-identified excerpt illustrating the theme. */
  quote: string;
  /** Additional verbatim de-identified excerpts for the drill-down view. */
  quotes?: string[];
}

export interface CampaignInsights {
  summary: string;
  themes: InsightTheme[];
  sourceCount: number;
  kind: InsightKind;
  generatedAt: string;
}

/** Below this we don't theme: too little signal, and thin anonymity. */
export const MIN_SOURCES = 3;
const FRESH_MS = 24 * 60 * 60 * 1000;
const MAX_SOURCES = 200; // cap the LLM input
const PER_SOURCE_CHARS = 700; // truncate each story/message so the prompt stays bounded
const MODEL_VERSION = 'insights-v2'; // v2: per-theme drill-down quotes

const SYSTEM_PROMPT = `You are an analyst for a strictly NONPARTISAN civic-engagement platform. You are given a set of constituent submissions to ONE campaign — either personal STORIES or messages people sent their elected officials. Produce a neutral, faithful thematic read the campaign organizer can act on.

Rules:
- STRICTLY nonpartisan and faithful. Summarize only what the submissions actually say. Invent nothing, inflate nothing, take no side.
- Identify the 3 to 6 most common THEMES across the submissions. For each theme give:
  - "label": a short plain-language name (2-5 words),
  - "prevalence": an integer estimate of how many submissions touch it,
  - "quote": the single BEST short verbatim excerpt (<= 160 characters) that illustrates it,
  - "quotes": 2 to 5 MORE verbatim excerpts (each <= 240 characters, from DIFFERENT submissions than the main quote when possible) for the organizer's drill-down — the strongest, most human language people actually used.
- Every quote must be VERBATIM from a submission (light truncation with ... is fine; never paraphrase or compose).
- DE-IDENTIFY: never include a person's name, email, street address, or any identifying detail in the summary or any quote. Themes and representative language only.
- "summary": 2-3 plain sentences on what constituents are saying overall and why it matters to the organizer.

Return ONLY JSON, no markdown:
{"summary":"...","themes":[{"label":"...","prevalence":0,"quote":"...","quotes":["...","..."]}]}`;

/** Pull the raw text to theme for a campaign. A parent campaign themes the
 * whole initiative — its own material plus every stage's. Returns [] if the
 * table/columns aren't reachable (kept defensive so analytics never
 * hard-fails). */
async function gatherSources(campaignId: string, kind: InsightKind): Promise<string[]> {
  const admin = createAdminClient();
  try {
    const { data: children } = await admin.from('campaigns').select('id').eq('parent_campaign_id', campaignId);
    const ids = [campaignId, ...(children ?? []).map((c) => c.id as string)];
    if (kind === 'stories') {
      const { data } = await admin
        .from('stories')
        .select('body, created_at')
        .in('campaign_id', ids)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(MAX_SOURCES);
      return (data ?? []).map((r) => String(r.body ?? '').trim()).filter(Boolean);
    }
    const { data } = await admin
      .from('messages')
      .select('message_body, created_at')
      .in('campaign_id', ids)
      .order('created_at', { ascending: false })
      .limit(MAX_SOURCES);
    return (data ?? []).map((r) => String(r.message_body ?? '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function coerceInsights(raw: unknown, sourceCount: number, kind: InsightKind): CampaignInsights | null {
  const obj = raw as { summary?: unknown; themes?: unknown } | null;
  if (!obj || typeof obj.summary !== 'string' || !Array.isArray(obj.themes)) return null;
  const themes: InsightTheme[] = obj.themes
    .map((t) => {
      const tt = t as { label?: unknown; prevalence?: unknown; quote?: unknown; quotes?: unknown };
      const extraQuotes = Array.isArray(tt.quotes)
        ? tt.quotes
            .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
            .map((q) => q.trim().slice(0, 280))
            .slice(0, 5)
        : [];
      return {
        label: typeof tt.label === 'string' ? tt.label.trim() : '',
        prevalence: Number.isFinite(Number(tt.prevalence)) ? Math.max(0, Math.round(Number(tt.prevalence))) : 0,
        quote: typeof tt.quote === 'string' ? tt.quote.trim().slice(0, 200) : '',
        ...(extraQuotes.length ? { quotes: extraQuotes } : {}),
      };
    })
    .filter((t) => t.label)
    .slice(0, 6);
  if (!themes.length) return null;
  return { summary: obj.summary.trim(), themes, sourceCount, kind, generatedAt: new Date().toISOString() };
}

/** Read the cached insights snapshot (fast path for the analytics page). */
export async function getCachedInsights(campaignId: string, kind: InsightKind): Promise<{ insights: CampaignInsights; stale: boolean } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('campaign_insights')
    .select('insights, source_count, created_at')
    .eq('campaign_id', campaignId)
    .eq('kind', kind)
    .maybeSingle();
  if (!data?.insights) return null;
  const stale = Date.now() - new Date(data.created_at as string).getTime() > FRESH_MS;
  const insights = data.insights as CampaignInsights;
  return { insights, stale };
}

/**
 * Generate insights for a campaign and upsert the snapshot. Returns null when
 * there isn't enough material (< MIN_SOURCES) or the model output is unusable.
 */
export async function generateCampaignInsights(campaignId: string, kind: InsightKind): Promise<CampaignInsights | null> {
  const sources = await gatherSources(campaignId, kind);
  if (sources.length < MIN_SOURCES) return null;

  const numbered = sources
    .map((s, i) => `${i + 1}. ${s.slice(0, PER_SOURCE_CHARS)}`)
    .join('\n\n')
    .slice(0, 24000); // hard bound on prompt size
  const noun = kind === 'stories' ? 'stories' : 'constituent messages';

  let raw: string;
  try {
    raw = await callClaude(SYSTEM_PROMPT, `${sources.length} ${noun} for this campaign:\n\n${numbered}\n\nProduce the themed read.`, 1200);
  } catch {
    return null;
  }

  const insights = coerceInsights(extractJSON(raw), sources.length, kind);
  if (!insights) return null;

  const admin = createAdminClient();
  await admin
    .from('campaign_insights')
    .upsert(
      { campaign_id: campaignId, kind, insights, source_count: sources.length, model_version: MODEL_VERSION, created_at: new Date().toISOString() },
      { onConflict: 'campaign_id,kind' },
    );

  return insights;
}
