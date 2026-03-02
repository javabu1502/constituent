import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getFederalLegislatorBio } from '@/lib/legislators';
import { fetchHouseVotes, fetchSenateVotes, computeSummary } from '@/lib/votes';
import type { VotingRecordResponse } from '@/lib/types';

const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> },
) {
  const { bioguideId } = await params;

  if (!bioguideId) {
    return NextResponse.json({ error: 'bioguideId is required' }, { status: 400 });
  }

  // Look up legislator bio
  const bio = getFederalLegislatorBio(bioguideId);
  if (!bio) {
    return NextResponse.json({ error: 'Legislator not found' }, { status: 404 });
  }

  const admin = createAdminClient();
  const cacheKey = `public-votes-${bioguideId}`;

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', PUBLIC_USER_ID)
    .eq('feed_type', cacheKey)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    const cachedPayload = cached.data as VotingRecordResponse | null;
    if (cachedPayload?.votes && cachedPayload.votes.length > 0) {
      return NextResponse.json(cachedPayload, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      });
    }
  }

  // Determine chamber from last term
  const lastTerm = bio.terms[bio.terms.length - 1];
  const chamber = lastTerm?.type === 'sen' ? 'senate' : 'house';

  const repName = bio.name.official_full
    || `${bio.name.first} ${bio.name.last}${bio.name.suffix ? ` ${bio.name.suffix}` : ''}`;

  // Fetch votes based on chamber
  let votes;
  if (chamber === 'senate') {
    const lastName = bio.name.last;
    const state = lastTerm?.state ?? '';
    votes = await fetchSenateVotes(bioguideId, repName, lastName, state);
  } else {
    votes = await fetchHouseVotes(bioguideId, repName);
  }

  // Sort by date descending
  votes.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  const summary = computeSummary(votes);

  const payload: VotingRecordResponse = {
    votes: votes.slice(0, 10),
    summary,
    total_available: votes.length,
    data_source: 'congress.gov',
  };

  // Cache for 24 hours
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: PUBLIC_USER_ID, feed_type: cacheKey, data: payload, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' },
    );

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
