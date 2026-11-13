import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { groupByOffice, rollCsv, rollLabel, type OfficeLevel, type Signature } from '@/lib/signon';

export const runtime = 'nodejs';

/**
 * GET /api/campaigns/[slug]/signatures — the signatory rolls, for the
 * organization that owns the letter.
 *
 * Owner only, and never public. Every row carries a home address, which the
 * signer gave so an office could see they live in the district, not so the
 * internet could read it.
 *
 * `?level=` picks which office the rolls are cut for, and `?format=csv`
 * returns one office's rows ready to paste under the letter. The letter goes
 * out one office at a time, so a single list of everyone is the wrong shape
 * and is not offered.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, creator_id, campaign_type, headline')
    .eq('slug', slug)
    .maybeSingle();

  if (!campaign) return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
  if (campaign.creator_id !== user.id) return NextResponse.json({ error: 'Not yours' }, { status: 403 });
  if (campaign.campaign_type !== 'signon') {
    return NextResponse.json({ error: 'This campaign is not a sign-on letter' }, { status: 400 });
  }

  const url = new URL(request.url);
  const levelParam = url.searchParams.get('level') ?? 'federal';
  const level: OfficeLevel =
    levelParam === 'state_upper' || levelParam === 'state_lower' ? levelParam : 'federal';

  const { data } = await admin
    .from('campaign_signatures')
    .select('name, email, street, city, state, zip, congressional_district, state_upper_district, state_lower_district, district_resolved, personal_note, show_name_publicly')
    .eq('campaign_id', campaign.id)
    .is('withdrawn_at', null)
    .order('created_at', { ascending: true });

  const rolls = groupByOffice((data ?? []) as Signature[], level);

  if (url.searchParams.get('format') === 'csv') {
    const wanted = url.searchParams.get('office');
    const roll = wanted ? rolls.find((r) => rollLabel(r) === wanted) : rolls[0];
    if (!roll) return NextResponse.json({ error: 'No signatures for that office' }, { status: 404 });
    return new NextResponse(rollCsv(roll), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}-${rollLabel(roll).replace(/[^A-Za-z0-9-]+/g, '-')}.csv"`,
      },
    });
  }

  return NextResponse.json({
    campaign: { slug, headline: campaign.headline },
    level,
    total: data?.length ?? 0,
    offices: rolls.map((r) => ({
      office: rollLabel(r),
      state: r.state,
      district: r.district,
      signers: r.signers.length,
      placed: r.district !== null,
    })),
  });
}
