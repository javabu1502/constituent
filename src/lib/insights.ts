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
import { callClaude, extractJSON, deDash } from '@/lib/claude';

export type InsightKind = 'stories' | 'messages';

/** Where a quote came from, so the org can trace it and consent can be honored. */
export interface QuoteMeta {
  /** stories.id (or messages.id) the excerpt was copied from. */
  sourceId: string | null;
  /** The storyteller chose anonymity. */
  anonymous: boolean;
  /** The storyteller allowed use in reports (stories only; messages true). */
  reportOk: boolean;
}

export interface InsightTheme {
  /** Short human label for the theme. */
  label: string;
  /** Roughly how many of the sources touch this theme. */
  prevalence: number;
  /** One short verbatim, de-identified excerpt illustrating the theme. */
  quote: string;
  quoteMeta?: QuoteMeta;
  /** Additional verbatim de-identified excerpts for the drill-down view. */
  quotes?: string[];
  quotesMeta?: QuoteMeta[];
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
const PER_SOURCE_CHARS = 2000; // per story/message; the 24k total cap still bounds the prompt
const MODEL_VERSION = 'insights-v3'; // v3: quotes carry their source, anonymous marking, consent-aware

const SYSTEM_PROMPT = `You are an analyst for a strictly NONPARTISAN civic-engagement platform. You are given a set of constituent submissions to ONE campaign — either personal STORIES or messages people sent their elected officials. Produce a neutral, faithful thematic read the campaign organizer can act on.

Rules:
- STRICTLY nonpartisan and faithful. Summarize only what the submissions actually say. Invent nothing, inflate nothing, take no side.
- Identify the 3 to 6 most common THEMES across the submissions. For each theme give:
  - "label": a short plain-language name (2-5 words),
  - "prevalence": an integer estimate of how many submissions touch it,
  - "quote": the single BEST short verbatim excerpt (<= 160 characters) that illustrates it, as {"text": "...", "source": N} where N is the number of the submission it was copied from,
  - "quotes": 2 to 5 MORE verbatim excerpts (each <= 240 characters, from DIFFERENT submissions than the main quote when possible), each {"text": "...", "source": N}.
- Every quote must be VERBATIM from ONE submission (light truncation with ... is fine; never paraphrase, never compose, never combine text from two submissions). "source" must be the submission number.
- DE-IDENTIFY: a quote must not contain any person's name. This includes the author, children, spouses, coworkers, employers, and elected officials. If the best excerpt contains a name, choose a different excerpt. Do not edit a quote to remove a name. Never include an email or street address.
- Do not build a theme from a single submission when that submission describes a medical diagnosis, immigration status, a criminal record, or abuse. Fold that material into a broader theme or leave it out.
- Submissions marked [anonymous]: do not quote them unless no other submission illustrates the theme. When you do, keep the excerpt under 120 characters and avoid place, employer, tenure, and wage details.
- "summary": 2-3 plain declarative sentences on what constituents are saying overall and why it matters to the organizer. Do not use em dashes or en dashes. Do not use lists of three, "not X but Y", or a closing flourish.

Return ONLY JSON, no markdown:
{"summary":"...","themes":[{"label":"...","prevalence":0,"quote":{"text":"...","source":1},"quotes":[{"text":"...","source":2}]}]}`;

/** Pull the raw text to theme for a campaign. A parent campaign themes the
 * whole initiative — its own material plus every stage's. Returns [] if the
 * table/columns aren't reachable (kept defensive so analytics never
 * hard-fails). */
export interface InsightSource {
  id: string;
  body: string;
  anonymous: boolean;
  reportOk: boolean;
  /** Names that must never appear in a quote (storyteller, their officials). */
  names: string[];
}

async function gatherSources(campaignId: string, kind: InsightKind): Promise<InsightSource[]> {
  const admin = createAdminClient();
  try {
    const { data: children } = await admin.from('campaigns').select('id').eq('parent_campaign_id', campaignId);
    const ids = [campaignId, ...(children ?? []).map((c) => c.id as string)];
    if (kind === 'stories') {
      const { data } = await admin
        .from('stories')
        .select('id, body, body_en, attribution_level, storyteller_name, shared_reps, consent_usage_snapshot, created_at')
        .in('campaign_id', ids)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(MAX_SOURCES);
      return (data ?? [])
        .map((r) => {
          const snap = (r.consent_usage_snapshot ?? {}) as { granted_uses?: string[] };
          const reps = Array.isArray(r.shared_reps) ? (r.shared_reps as Array<{ name?: string }>).map((x) => x.name ?? '') : [];
          return {
            id: String(r.id),
            // Spanish stories carry an English rendering; the insight model reads that.
            body: String((r as { body_en?: string | null }).body_en || r.body || '').trim(),
            anonymous: r.attribution_level === 'anonymous',
            reportOk: Array.isArray(snap.granted_uses) && snap.granted_uses.includes('included_in_reports'),
            names: [String(r.storyteller_name ?? ''), ...reps].filter((n) => n.trim().length >= 3),
          };
        })
        .filter((r) => r.body);
    }
    const { data } = await admin
      .from('messages')
      .select('id, message_body, advocate_name, created_at')
      .in('campaign_id', ids)
      .order('created_at', { ascending: false })
      .limit(MAX_SOURCES);
    return (data ?? [])
      .map((r) => ({ id: String(r.id), body: String(r.message_body ?? '').trim(), anonymous: false, reportOk: true, names: [String(r.advocate_name ?? '')].filter((n) => n.trim().length >= 3) }))
      .filter((r) => r.body);
  } catch {
    return [];
  }
}

/** Does this quote contain any name from the source set (case-insensitive, whole word)? */
function quoteNamesAnyone(text: string, sources: InsightSource[]): boolean {
  const lower = text.toLowerCase();
  for (const src of sources) {
    for (const full of src.names) {
      const parts = full.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
      for (const part of parts) {
        if (new RegExp(`\\b${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower)) return true;
      }
    }
  }
  return false;
}

function coerceInsights(raw: unknown, sources: InsightSource[], kind: InsightKind): CampaignInsights | null {
  const obj = raw as { summary?: unknown; themes?: unknown } | null;
  if (!obj || typeof obj.summary !== 'string' || !Array.isArray(obj.themes)) return null;
  const metaFor = (n: unknown): QuoteMeta => {
    const idx = Number(n);
    const src = Number.isInteger(idx) && idx >= 1 && idx <= sources.length ? sources[idx - 1] : null;
    return { sourceId: src?.id ?? null, anonymous: src?.anonymous ?? true, reportOk: src?.reportOk ?? false };
  };
  const readQuote = (q: unknown, max: number): { text: string; meta: QuoteMeta } | null => {
    if (!q || typeof q !== 'object') return typeof q === 'string' && q.trim() ? { text: q.trim().slice(0, max), meta: metaFor(NaN) } : null;
    const qq = q as { text?: unknown; source?: unknown };
    if (typeof qq.text !== 'string' || !qq.text.trim()) return null;
    const meta = metaFor(qq.source);
    if (!meta.sourceId) return null; // unknown source: cannot be traced or consent-checked, drop it
    const text = qq.text.trim().slice(0, max);
    if (quoteNamesAnyone(text, sources)) return null; // a name slipped through
    return { text, meta };
  };
  const themes: InsightTheme[] = obj.themes
    .map((t) => {
      const tt = t as { label?: unknown; prevalence?: unknown; quote?: unknown; quotes?: unknown };
      const main = readQuote(tt.quote, 200);
      const extras = (Array.isArray(tt.quotes) ? tt.quotes : []).map((q) => readQuote(q, 280)).filter((q): q is { text: string; meta: QuoteMeta } => !!q).slice(0, 5);
      return {
        label: typeof tt.label === 'string' ? tt.label.trim() : '',
        prevalence: Number.isFinite(Number(tt.prevalence)) ? Math.max(0, Math.round(Number(tt.prevalence))) : 0,
        quote: main?.text ?? '',
        ...(main ? { quoteMeta: main.meta } : {}),
        ...(extras.length ? { quotes: extras.map((q) => q.text), quotesMeta: extras.map((q) => q.meta) } : {}),
      };
    })
    .filter((t) => t.label)
    .slice(0, 6);
  if (!themes.length) return null;
  return { summary: deDash(obj.summary.trim()), themes, sourceCount: sources.length, kind, generatedAt: new Date().toISOString() };
}

/** Read the cached insights snapshot (fast path for the analytics page). */
export async function getCachedInsights(campaignId: string, kind: InsightKind): Promise<{ insights: CampaignInsights; stale: boolean } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('campaign_insights')
    .select('insights, source_count, created_at, model_version')
    .eq('campaign_id', campaignId)
    .eq('kind', kind)
    .maybeSingle();
  if (!data?.insights) return null;
  // Older-version snapshots (e.g. pre-drill-down) surface as stale so the
  // owner sees the refresh hint and picks up the new format.
  // Stale when old, generated by an older prompt, or when the set of active
  // stories changed since (a revoke or edit also deletes the snapshot).
  let countChanged = false;
  try {
    const { count } = await admin.from(kind === 'stories' ? 'stories' : 'messages').select('id', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'active');
    countChanged = typeof count === 'number' && count !== Number(data.source_count);
  } catch { /* messages has no status column; ignore */ }
  const stale =
    Date.now() - new Date(data.created_at as string).getTime() > FRESH_MS || data.model_version !== MODEL_VERSION || countChanged;
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
    .map((s, i) => `${i + 1}. ${s.anonymous ? '[anonymous] ' : ''}${s.body.slice(0, PER_SOURCE_CHARS)}`)
    .join('\n\n')
    .slice(0, 24000); // hard bound on prompt size
  const noun = kind === 'stories' ? 'stories' : 'constituent messages';

  let raw: string;
  try {
    // v2 returns up to 6 verbatim quotes per theme — needs real headroom or
    // the JSON truncates and parsing fails.
    raw = await callClaude(SYSTEM_PROMPT, `${sources.length} ${noun} for this campaign:\n\n${numbered}\n\nProduce the themed read.`, 4000);
  } catch (err) {
    console.error('[insights] generation failed:', err);
    return null;
  }

  const insights = coerceInsights(extractJSON(raw), sources, kind);
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
