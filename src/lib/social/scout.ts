/**
 * Scout — stage 1. Ingests candidate items into social_signals.
 *
 * v1 source: our OWN active official weigh-in campaigns. Every one is a real,
 * neutral, already-sourced question with a ready action link, so the accuracy
 * gate passes trivially and every post links somewhere legitimate. External
 * /news drops (the "JUST IN" lane) are a later source — they carry accuracy
 * risk that we want the loop proven before we take on.
 */
import { createAdminClient } from '@/lib/supabase';
import { fetchBillCard } from '@/lib/congress-api';
import { CURRENT_CONGRESS } from '@/lib/votes';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mydemocracy.app';

// How recent a bill's latest action must be to count as a real-time signal.
// 4 days covers weekend/cron gaps without resurfacing stale movement.
const LEGISLATIVE_FRESHNESS_DAYS = 4;

export interface Signal {
  id: string;
  source: string;
  external_ref: string | null;
  title: string | null;
  summary: string | null;
  url: string | null;
  issue_area: string | null;
  classification: string | null;
  campaign_slug: string | null;
  status: string;
}

/**
 * Pull recent active official campaigns and upsert them as signals. Dedup is
 * on (source, external_ref) via the unique index, so re-running is safe.
 * Returns the number of new signals inserted.
 */
export async function scoutCampaigns(limit = 10): Promise<number> {
  const admin = createAdminClient();

  const { data: campaigns, error } = await admin
    .from('campaigns')
    .select('slug, headline, description, issue_area, is_bill_specific, created_at')
    .eq('is_official', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !campaigns?.length) return 0;

  // Skip slugs we've already ingested. We select-then-insert rather than
  // upsert: the dedup index is partial (external_ref not null), which
  // supabase-js can't target via onConflict.
  const slugs = campaigns.map((c) => c.slug);
  const { data: existing } = await admin
    .from('social_signals')
    .select('external_ref')
    .eq('source', 'weigh_in')
    .in('external_ref', slugs);
  const have = new Set((existing ?? []).map((r) => r.external_ref));

  const rows = campaigns
    .filter((c) => !have.has(c.slug))
    .map((c) => ({
      source: 'weigh_in',
      external_ref: c.slug,
      title: c.headline,
      summary: c.description,
      url: `${SITE}/campaign/${c.slug}`,
      issue_area: c.issue_area,
      classification: 'actionable',
      campaign_slug: c.slug,
      status: 'new',
      metadata: { is_bill_specific: c.is_bill_specific },
    }));

  if (!rows.length) return 0;
  const { error: insErr } = await admin.from('social_signals').insert(rows);
  if (insErr) {
    console.error('[scout] insert failed:', insErr.message);
    return 0;
  }
  return rows.length;
}

/**
 * Scout the /news system. Two signal types, both kept low-risk:
 *  - the daily brief -> ONE informational signal/day (context only, no CTA);
 *  - civic articles the news system already matched to one of our weigh-in
 *    campaigns -> actionable signals linking to that campaign.
 * Un-matched raw articles are intentionally skipped: paraphrasing arbitrary
 * news is the accuracy risk we don't take autonomously. News signals are
 * always gated downstream regardless of posting mode.
 */
export async function scoutNews(): Promise<number> {
  const admin = createAdminClient();
  type Candidate = Omit<Signal, 'id' | 'status'> & { metadata?: Record<string, unknown> };
  const candidates: Candidate[] = [];

  try {
    const res = await fetch(`${SITE}/api/news/brief`, { cache: 'no-store' });
    if (res.ok) {
      const { brief } = (await res.json()) as { brief?: { bullets?: string[]; generatedAt?: string } };
      if (brief?.bullets?.length) {
        const day = (brief.generatedAt ?? new Date().toISOString()).slice(0, 10);
        candidates.push({
          source: 'news',
          external_ref: `brief-${day}`,
          title: 'Daily civic brief',
          summary: brief.bullets.join(' • '),
          url: `${SITE}/issues`,
          issue_area: null,
          classification: 'informational',
          campaign_slug: null,
        });
      }
    }
  } catch {
    // brief unavailable this run — fine
  }

  try {
    const res = await fetch(`${SITE}/api/news/civic`, { cache: 'no-store' });
    if (res.ok) {
      const { articles } = (await res.json()) as {
        articles?: Array<{ title: string; link: string; topic?: { issueCategory?: string }; campaign?: { slug: string } | null }>;
      };
      for (const a of (articles ?? []).filter((x) => x.campaign?.slug)) {
        candidates.push({
          source: 'news',
          external_ref: a.link,
          title: a.title,
          summary: a.title,
          url: `${SITE}/campaign/${a.campaign!.slug}`,
          issue_area: a.topic?.issueCategory ?? null,
          classification: 'actionable',
          campaign_slug: a.campaign!.slug,
        });
      }
    }
  } catch {
    // civic feed unavailable this run — fine
  }

  if (!candidates.length) return 0;
  const refs = candidates.map((c) => c.external_ref).filter(Boolean) as string[];
  const { data: existing } = await admin
    .from('social_signals')
    .select('external_ref')
    .eq('source', 'news')
    .in('external_ref', refs);
  const have = new Set((existing ?? []).map((r) => r.external_ref));

  const rows = candidates.filter((c) => !have.has(c.external_ref)).map((c) => ({ ...c, status: 'new', metadata: {} }));
  if (!rows.length) return 0;
  const { error } = await admin.from('social_signals').insert(rows);
  if (error) {
    console.error('[scout-news] insert failed:', error.message);
    return 0;
  }
  return rows.length;
}

/**
 * Real-time legislative feed. Every bill-specific weigh-in campaign tracks an
 * actual bill; when that bill MOVES on Congress.gov (reported out of committee,
 * floor vote, passed a chamber, signed), that's the most timely, most
 * actionable thing we can post — a bill our users can weigh in on RIGHT NOW
 * just changed status. We poll each tracked bill's latest action and, when it
 * landed within the freshness window, emit an actionable signal linking to the
 * campaign. The exact Congress.gov action text rides along in the summary so
 * the downstream accuracy guardrail can verify every claim against source.
 * fetchBillCard day-caches per bill, so re-runs don't hammer the API.
 */
export async function scoutLegislativeActions(limit = 30): Promise<number> {
  const admin = createAdminClient();

  const { data: campaigns, error } = await admin
    .from('campaigns')
    .select('slug, headline, issue_area, bill_congress, bill_type, bill_number')
    .eq('is_official', true)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .eq('is_bill_specific', true)
    .not('bill_type', 'is', null)
    .not('bill_number', 'is', null)
    .limit(limit);

  if (error || !campaigns?.length) return 0;

  const cutoff = new Date(Date.now() - LEGISLATIVE_FRESHNESS_DAYS * 24 * 60 * 60_000);
  type Candidate = Omit<Signal, 'id' | 'status'> & { metadata?: Record<string, unknown> };
  const candidates: Candidate[] = [];

  for (const c of campaigns) {
    const congress = Number(c.bill_congress) || CURRENT_CONGRESS;
    const card = await fetchBillCard(congress, String(c.bill_type), String(c.bill_number)).catch(() => null);
    if (!card?.latestAction || !card.latestActionDate) continue;
    // Only surface genuinely recent movement.
    const actionDate = new Date(card.latestActionDate);
    if (isNaN(actionDate.getTime()) || actionDate < cutoff) continue;

    candidates.push({
      source: 'legislative',
      external_ref: `bill-action-${c.slug}-${card.latestActionDate}`,
      title: `${card.ref}: ${card.latestAction}`,
      summary: `${card.ref} — ${card.latestAction} (${card.latestActionDate}). Weigh-in: ${c.headline}`,
      url: `${SITE}/campaign/${c.slug}`,
      issue_area: c.issue_area,
      classification: 'actionable',
      campaign_slug: c.slug,
      metadata: { bill_ref: card.ref, action_date: card.latestActionDate, bill_url: card.url },
    });
  }

  if (!candidates.length) return 0;
  const refs = candidates.map((c) => c.external_ref).filter(Boolean) as string[];
  const { data: existing } = await admin
    .from('social_signals')
    .select('external_ref')
    .eq('source', 'legislative')
    .in('external_ref', refs);
  const have = new Set((existing ?? []).map((r) => r.external_ref));

  const rows = candidates
    .filter((c) => !have.has(c.external_ref))
    .map((c) => ({ ...c, status: 'new', metadata: c.metadata ?? {} }));
  if (!rows.length) return 0;
  const { error: insErr } = await admin.from('social_signals').insert(rows);
  if (insErr) {
    console.error('[scout-legislative] insert failed:', insErr.message);
    return 0;
  }
  return rows.length;
}

/**
 * Pick the next unused signal, biased toward issue-area balance: prefer the
 * freshest 'new' signal whose issue_area wasn't in the last few posts, so the
 * feed doesn't stack the same topic. Falls back to the freshest new signal.
 */
export async function nextSignal(): Promise<Signal | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('social_signals')
    .select('id, source, external_ref, title, summary, url, issue_area, classification, campaign_slug, status')
    .eq('status', 'new')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error || !data?.length) return null;

  const { data: recent } = await admin
    .from('social_posts')
    .select('issue_area')
    .eq('status', 'posted')
    .order('posted_at', { ascending: false })
    .limit(4);
  const recentIssues = new Set((recent ?? []).map((r) => r.issue_area).filter(Boolean));

  const fresh = (data as Signal[]).find((s) => !recentIssues.has(s.issue_area));
  return fresh ?? (data[0] as Signal);
}

export async function markSignalUsed(id: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from('social_signals').update({ status: 'used' }).eq('id', id);
}
