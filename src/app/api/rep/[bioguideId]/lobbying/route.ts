import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getFederalLegislatorBio } from '@/lib/legislators';
import { committeesToIssueCodes } from '@/lib/lobbying-constants';
import {
  fetchCommittees,
  getRecentQuarters,
  fetchLdaFilings,
  filterAndExtract,
  DELAY_MS,
  sleep,
} from '@/lib/lobbying-data';
import type { LdaFiling } from '@/lib/lobbying-data';
import type {
  LobbyingResponse,
  LobbyingIssueArea,
  LobbyingClient,
  LobbyingFirm,
} from '@/lib/types';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;

  if (!bioguideId) {
    return NextResponse.json({ error: 'bioguideId is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const cacheKey = `public-lobbying-${bioguideId}`;

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', PUBLIC_USER_ID)
    .eq('feed_type', cacheKey)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json(cached.data as LobbyingResponse, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  }

  // Look up legislator to determine chamber and name
  const bio = getFederalLegislatorBio(bioguideId);
  if (!bio) {
    return NextResponse.json({ error: 'Legislator not found' }, { status: 404 });
  }

  const repName = bio.name.official_full || `${bio.name.first} ${bio.name.last}`;

  // Determine chamber from the most recent term
  const currentTerm = bio.terms[bio.terms.length - 1];
  const chamber = currentTerm?.type === 'sen' ? 'senate' : 'house';

  // Fetch committee assignments from Congress.gov
  const committees = await fetchCommittees(bioguideId);
  const issueCodes = new Set(committeesToIssueCodes(committees));

  // Fetch LDA filings for recent quarters
  const quarters = getRecentQuarters();
  const allFilings: LdaFiling[] = [];

  for (let i = 0; i < quarters.length; i++) {
    const q = quarters[i];
    const filings = await fetchLdaFilings(q.filing_type, q.filing_year);
    allFilings.push(...filings);
    // Delay between quarters
    if (i < quarters.length - 1) await sleep(DELAY_MS);
  }

  // Filter and aggregate
  const { issueMap, clientMap, firmMap, recentFilings } = filterAndExtract(
    allFilings,
    chamber,
    issueCodes,
  );

  // Build response arrays
  const issueAreas: LobbyingIssueArea[] = [...issueMap.entries()]
    .map(([code, data]) => ({
      issue_code: code,
      issue_name: data.name,
      total_income: data.income,
      filing_count: data.count,
    }))
    .sort((a, b) => b.total_income - a.total_income);

  const topClients: LobbyingClient[] = [...clientMap.entries()]
    .map(([name, data]) => ({
      name,
      total_income: data.income,
      issue_areas: [...data.issues],
      filing_count: data.count,
    }))
    .sort((a, b) => b.total_income - a.total_income)
    .slice(0, 25);

  const topFirms: LobbyingFirm[] = [...firmMap.entries()]
    .map(([name, data]) => ({
      name,
      filing_count: data.count,
      top_clients: [...data.clients].slice(0, 5),
      total_income: data.income,
    }))
    .sort((a, b) => b.total_income - a.total_income)
    .slice(0, 15);

  // Sort recent filings by income descending, take top 10
  const sortedRecentFilings = recentFilings
    .sort((a, b) => b.income - a.income)
    .slice(0, 10);

  // No lobbying connections for public version (no user finance cache)
  const payload: LobbyingResponse = {
    rep_id: bioguideId,
    rep_name: repName,
    committees,
    issue_areas: issueAreas,
    top_clients: topClients,
    top_firms: topFirms,
    recent_filings: sortedRecentFilings,
    lobbying_connections: [],
    quarters_covered: quarters.map((q) => q.label),
  };

  // Cache for 7 days
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: PUBLIC_USER_ID, feed_type: cacheKey, data: payload, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
