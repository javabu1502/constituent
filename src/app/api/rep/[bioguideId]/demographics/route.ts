import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getFederalLegislatorBio } from '@/lib/legislators';
import { fetchDistrictDemographics } from '@/lib/census-api';

const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000';
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;

  if (!bioguideId) {
    return NextResponse.json({ error: 'Missing bioguideId' }, { status: 400 });
  }

  const bio = getFederalLegislatorBio(bioguideId);
  if (!bio) {
    return NextResponse.json({ error: 'Legislator not found' }, { status: 404 });
  }

  const admin = createAdminClient();
  const feedType = `public-demographics-${bioguideId}`;

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', PUBLIC_USER_ID)
    .eq('feed_type', feedType)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  }

  const currentTerm = bio.terms[bio.terms.length - 1];
  const state = currentTerm.state;
  const district = currentTerm.type === 'sen'
    ? '00' // Senators → at-large (statewide)
    : String(currentTerm.district ?? 0);

  try {
    const demographics = await fetchDistrictDemographics(state, district);
    if (!demographics) {
      return NextResponse.json({ error: 'Demographics data not available' }, { status: 404 });
    }

    const payload = { demographics };

    // Cache result
    await admin
      .from('feed_cache')
      .upsert(
        { user_id: PUBLIC_USER_ID, feed_type: feedType, data: payload, fetched_at: new Date().toISOString() },
        { onConflict: 'user_id,feed_type' }
      );

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch demographics data' }, { status: 500 });
  }
}
