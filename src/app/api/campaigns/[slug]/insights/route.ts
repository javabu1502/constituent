import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { generateCampaignInsights, getCachedInsights, MIN_SOURCES, type InsightKind } from '@/lib/insights';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Storytelling campaigns theme their stories; everything else themes the
 * constituent messages sent through the campaign. */
function kindFor(campaignType: unknown): InsightKind {
  return campaignType === 'storytelling' ? 'stories' : 'messages';
}

async function loadOwnedCampaign(slug: string) {
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, creator_id, campaign_type')
    .eq('slug', slug)
    .single();
  if (!campaign) return { error: 'not_found' as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' as const };
  if (user.id !== campaign.creator_id) return { error: 'forbidden' as const };
  return { campaign };
}

/** GET — return the cached insights snapshot (fast, no LLM call). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await loadOwnedCampaign(slug);
  if ('error' in res) {
    const status = res.error === 'not_found' ? 404 : res.error === 'unauthorized' ? 401 : 403;
    return NextResponse.json({ error: res.error }, { status });
  }
  const kind = kindFor(res.campaign.campaign_type);
  const cached = await getCachedInsights(res.campaign.id, kind);
  return NextResponse.json({ insights: cached?.insights ?? null, stale: cached?.stale ?? false, kind });
}

/** POST — (re)generate insights on demand. Owner-only; runs one LLM pass. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await loadOwnedCampaign(slug);
  if ('error' in res) {
    const status = res.error === 'not_found' ? 404 : res.error === 'unauthorized' ? 401 : 403;
    return NextResponse.json({ error: res.error }, { status });
  }
  const kind = kindFor(res.campaign.campaign_type);
  const insights = await generateCampaignInsights(res.campaign.id, kind);
  if (!insights) {
    return NextResponse.json(
      { insights: null, kind, reason: `Need at least ${MIN_SOURCES} ${kind === 'stories' ? 'stories' : 'messages'} to generate insights.` },
      { status: 200 },
    );
  }
  return NextResponse.json({ insights, kind });
}
