import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getFederalLegislatorBio } from '@/lib/legislators';
import { findCandidate, getCurrentCycle, fetchCandidateTotals, fetchTopContributors } from '@/lib/fec';
import type { Official, RepFinance } from '@/lib/types';

const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;

  if (!bioguideId) {
    return NextResponse.json({ error: 'Missing bioguideId' }, { status: 400 });
  }

  if (!process.env.FEC_API_KEY) {
    return NextResponse.json({ error: 'FEC API key not configured' }, { status: 500 });
  }

  // Look up legislator bio data
  const bio = getFederalLegislatorBio(bioguideId);
  if (!bio) {
    return NextResponse.json({ error: 'Legislator not found' }, { status: 404 });
  }

  const admin = createAdminClient();
  const feedType = `public-finance-${bioguideId}`;

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', PUBLIC_USER_ID)
    .eq('feed_type', feedType)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    const cachedPayload = cached.data as { finance: RepFinance } | null;
    if (cachedPayload?.finance) {
      return NextResponse.json(cachedPayload, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      });
    }
  }

  // Build a minimal Official-like object from bio data
  const currentTerm = bio.terms[bio.terms.length - 1];
  const fullName = bio.name.official_full ||
    `${bio.name.first} ${bio.name.last}${bio.name.suffix ? ` ${bio.name.suffix}` : ''}`;
  const chamber = currentTerm.type === 'sen' ? 'senate' : 'house';
  const title = currentTerm.type === 'sen'
    ? `U.S. Senator`
    : `U.S. Representative`;

  const rep: Official = {
    id: bioguideId,
    name: fullName,
    lastName: bio.name.last,
    chamber,
    state: currentTerm.state,
    level: 'federal',
    title,
    party: currentTerm.party,
  };

  try {
    const candidate = await findCandidate(rep);
    if (!candidate) {
      return NextResponse.json({ error: 'FEC candidate not found' }, { status: 404 });
    }

    const cycle = getCurrentCycle();
    const totals = await fetchCandidateTotals(candidate.candidateId, cycle);
    if (!totals) {
      return NextResponse.json({ error: 'No FEC financial data available' }, { status: 404 });
    }

    const topContributors = candidate.committeeId
      ? await fetchTopContributors(candidate.committeeId, totals.actual_cycle)
      : [];

    const finance: RepFinance = {
      candidate_id: candidate.candidateId,
      candidate_name: totals.candidate_name,
      cycle: totals.actual_cycle,
      total_raised: totals.total_raised,
      individual_contributions: totals.individual_contributions,
      pac_contributions: totals.pac_contributions,
      total_disbursements: totals.total_disbursements,
      cash_on_hand: totals.cash_on_hand,
      debt: totals.debt,
      top_contributors: topContributors,
      rep_id: bioguideId,
      rep_name: fullName,
      fec_url: `https://www.fec.gov/data/candidate/${candidate.candidateId}/`,
    };

    const payload = { finance };

    // Cache result
    await admin
      .from('feed_cache')
      .upsert(
        { user_id: PUBLIC_USER_ID, feed_type: feedType, data: payload, fetched_at: new Date().toISOString() },
        { onConflict: 'user_id,feed_type' }
      );

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch FEC data' }, { status: 500 });
  }
}
