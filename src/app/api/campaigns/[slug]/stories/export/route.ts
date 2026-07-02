import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { toCSV } from '@/lib/csv';
import { usageLabels } from '@/lib/story-usage';

/**
 * GET /api/campaigns/[slug]/stories/export
 * Download all active stories for a storytelling campaign as CSV. Campaign
 * owner only. Anonymous stories are stored without identity, so their Name /
 * City / State / Contact cells come out blank automatically.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id, slug, creator_id, campaign_type')
    .eq('slug', slug)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  if (campaign.creator_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: stories, error: storiesError } = await admin
    .from('stories')
    .select('created_at, attribution_level, storyteller_name, city, state, storyteller_email, title, body, consent_usage_snapshot')
    .eq('campaign_id', campaign.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (storiesError) {
    console.error('[stories/export] query error:', storiesError);
    return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
  }

  const headers = ['Date', 'Attribution', 'Name', 'City', 'State', 'Contact Email', 'Title', 'Story', 'Granted Uses'];
  const rows = (stories ?? []).map((s) => {
    const isAnon = s.attribution_level === 'anonymous';
    const snapshot = (s.consent_usage_snapshot ?? {}) as { granted_uses?: string[] };
    const uses = usageLabels(snapshot.granted_uses ?? []).join('; ');
    return [
      s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : '',
      s.attribution_level,
      // Safety net: never emit identity for anonymous rows even if columns held data.
      isAnon ? '' : s.storyteller_name ?? '',
      isAnon ? '' : s.city ?? '',
      isAnon ? '' : s.state ?? '',
      isAnon ? '' : s.storyteller_email ?? '',
      s.title ?? '',
      s.body ?? '',
      uses,
    ];
  });

  const csv = toCSV(headers, rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-stories.csv"`,
    },
  });
}
