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

  let inserted = 0;
  for (const c of campaigns) {
    const { error: insErr, count } = await admin
      .from('social_signals')
      .upsert(
        {
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
        },
        { onConflict: 'source,external_ref', ignoreDuplicates: true, count: 'exact' },
      );
    if (!insErr && count) inserted += count;
  }
  return inserted;
}

/** Pick the highest-priority unused signal (freshest actionable one for v1). */
export async function nextSignal(): Promise<Signal | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('social_signals')
    .select('id, source, external_ref, title, summary, url, issue_area, classification, campaign_slug, status')
    .eq('status', 'new')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as Signal;
}

export async function markSignalUsed(id: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from('social_signals').update({ status: 'used' }).eq('id', id);
}
