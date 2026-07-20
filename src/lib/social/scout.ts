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

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mydemocracy.app';

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
