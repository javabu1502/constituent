import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { committeesToIssueCodes, ISSUE_CODE_NAMES } from '@/lib/lobbying-constants';
import type {
  LobbyingResponse,
  LobbyingIssueArea,
  LobbyingClient,
  LobbyingFirm,
  LobbyingFiling,
  LobbyingConnection,
  Official,
  FecContributor,
} from '@/lib/types';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — lobbying data is quarterly
const LDA_BASE = 'https://lda.senate.gov/api/v1';
const MAX_PAGES_PER_QUARTER = 4;
const PAGE_SIZE = 250;
const DELAY_MS = 1100; // 1.1s between paginated requests

// Government entity names used by the LDA API
const SENATE_ENTITY = 'SENATE';
const HOUSE_ENTITY = 'HOUSE OF REPRESENTATIVES';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine the 2 most recent quarters with filings likely available.
 * Allow ~45 days after quarter end for filings to be submitted.
 */
function getRecentQuarters(): { filing_type: string; filing_year: number; label: string }[] {
  const now = Date.now();
  const year = new Date().getFullYear();

  const candidates = [
    { q: 'Q4', yr: year, endMs: new Date(year, 11, 31).getTime(), label: `Q4 ${year}` },
    { q: 'Q3', yr: year, endMs: new Date(year, 8, 30).getTime(), label: `Q3 ${year}` },
    { q: 'Q2', yr: year, endMs: new Date(year, 5, 30).getTime(), label: `Q2 ${year}` },
    { q: 'Q1', yr: year, endMs: new Date(year, 2, 31).getTime(), label: `Q1 ${year}` },
    { q: 'Q4', yr: year - 1, endMs: new Date(year - 1, 11, 31).getTime(), label: `Q4 ${year - 1}` },
    { q: 'Q3', yr: year - 1, endMs: new Date(year - 1, 8, 30).getTime(), label: `Q3 ${year - 1}` },
  ];

  const result: { filing_type: string; filing_year: number; label: string }[] = [];
  for (const c of candidates) {
    if (now > c.endMs + 45 * 86400000) {
      result.push({ filing_type: c.q, filing_year: c.yr, label: c.label });
      if (result.length >= 2) break;
    }
  }
  return result;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Fetch committee assignments for a federal representative from Congress.gov
 */
async function fetchCommittees(bioguideId: string): Promise<string[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.congress.gov/v3/member/${bioguideId}?api_key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];

    const data = await res.json();
    const member = data.member;
    if (!member) return [];

    const committees: string[] = [];

    // Current terms may list committee assignments
    const terms = member.terms ?? [];
    for (const term of terms) {
      const termComms = term.committees ?? [];
      for (const c of termComms) {
        if (c.name) committees.push(c.name);
      }
    }

    // Some responses embed committees directly
    const directComms = member.committees ?? [];
    for (const c of directComms) {
      const name = c.name ?? c.committee?.name;
      if (name) committees.push(name);
    }

    // Deduplicate
    return [...new Set(committees)];
  } catch {
    return [];
  }
}

interface LdaFiling {
  income: string | null;
  expenses: string | null;
  filing_year: number;
  filing_period_display: string;
  filing_document_url: string;
  registrant: { name: string };
  client: { name: string };
  lobbying_activities: {
    general_issue_code: string;
    general_issue_code_display: string;
    description: string;
    government_entities: { name: string }[];
  }[];
}

/**
 * Fetch filings from the LDA API for a given quarter.
 * Uses amount minimum filtering and pagination with delays.
 */
async function fetchLdaFilings(
  filingType: string,
  filingYear: number,
): Promise<LdaFiling[]> {
  const allFilings: LdaFiling[] = [];

  for (let page = 1; page <= MAX_PAGES_PER_QUARTER; page++) {
    const params = new URLSearchParams({
      filing_type: filingType,
      filing_year: String(filingYear),
      filing_amount_reported_min: '10000',
      page_size: String(PAGE_SIZE),
      page: String(page),
      ordering: '-income',
    });

    try {
      const res = await fetch(`${LDA_BASE}/filings/?${params.toString()}`, {
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) break;
      const data = await res.json();
      const results = data.results ?? [];
      allFilings.push(...(results as LdaFiling[]));

      // Stop if no more pages
      if (!data.next || results.length < PAGE_SIZE) break;

      // Rate limiting delay between paginated requests
      if (page < MAX_PAGES_PER_QUARTER) await sleep(DELAY_MS);
    } catch {
      break;
    }
  }

  return allFilings;
}

/**
 * Filter filings to only include lobbying activities that:
 * 1. Target the correct chamber (SENATE or HOUSE)
 * 2. Match the issue codes from the rep's committees
 */
function filterAndExtract(
  filings: LdaFiling[],
  chamber: string,
  issueCodes: Set<string>,
): {
  issueMap: Map<string, { name: string; income: number; count: number }>;
  clientMap: Map<string, { income: number; issues: Set<string>; count: number }>;
  firmMap: Map<string, { income: number; count: number; clients: Set<string> }>;
  recentFilings: LobbyingFiling[];
} {
  const chamberEntity = chamber === 'senate' ? SENATE_ENTITY : HOUSE_ENTITY;

  const issueMap = new Map<string, { name: string; income: number; count: number }>();
  const clientMap = new Map<string, { income: number; issues: Set<string>; count: number }>();
  const firmMap = new Map<string, { income: number; count: number; clients: Set<string> }>();
  const recentFilings: LobbyingFiling[] = [];

  for (const filing of filings) {
    const income = parseFloat(filing.income ?? '0') || parseFloat(filing.expenses ?? '0') || 0;
    const clientName = filing.client?.name ?? 'Unknown';
    const registrantName = filing.registrant?.name ?? 'Unknown';

    for (const activity of filing.lobbying_activities ?? []) {
      // Check if this activity targets the correct chamber
      const entities = activity.government_entities ?? [];
      const matchesChamber = entities.some((e) => e.name === chamberEntity);
      if (!matchesChamber) continue;

      // Check if the issue code matches the rep's committee areas
      const code = activity.general_issue_code;
      if (!issueCodes.has(code)) continue;

      const issueName = activity.general_issue_code_display || ISSUE_CODE_NAMES[code] || code;

      // Aggregate by issue area
      const existing = issueMap.get(code);
      if (existing) {
        existing.income += income;
        existing.count += 1;
      } else {
        issueMap.set(code, { name: issueName, income, count: 1 });
      }

      // Aggregate by client
      const clientEntry = clientMap.get(clientName);
      if (clientEntry) {
        clientEntry.income += income;
        clientEntry.issues.add(issueName);
        clientEntry.count += 1;
      } else {
        clientMap.set(clientName, { income, issues: new Set([issueName]), count: 1 });
      }

      // Aggregate by firm
      const firmEntry = firmMap.get(registrantName);
      if (firmEntry) {
        firmEntry.income += income;
        firmEntry.count += 1;
        firmEntry.clients.add(clientName);
      } else {
        firmMap.set(registrantName, { income, count: 1, clients: new Set([clientName]) });
      }

      // Collect for recent filings
      if (recentFilings.length < 50) {
        recentFilings.push({
          client_name: clientName,
          registrant_name: registrantName,
          issue_area: issueName,
          issue_code: code,
          income,
          description: (activity.description ?? '').slice(0, 300),
          filing_year: filing.filing_year,
          filing_period: filing.filing_period_display ?? '',
          filing_url: filing.filing_document_url ?? '',
        });
      }
    }
  }

  return { issueMap, clientMap, firmMap, recentFilings };
}

/**
 * Cross-reference FEC contributor employers with LDA client names.
 * Returns matches where the same organization both donated and lobbied.
 */
function findLobbyingConnections(
  fecContributors: FecContributor[],
  clientMap: Map<string, { income: number; issues: Set<string>; count: number }>,
): LobbyingConnection[] {
  const connections: LobbyingConnection[] = [];

  // Skip generic employer names
  const skipNames = new Set([
    'retired', 'not employed', 'self-employed', 'self employed',
    'homemaker', 'none', 'n/a', 'student', 'unemployed', 'information requested',
  ]);

  for (const contributor of fecContributors) {
    const contributorName = contributor.name.trim();
    if (skipNames.has(contributorName.toLowerCase())) continue;

    // Try exact match first, then fuzzy match
    const contributorLower = contributorName.toLowerCase();
    let matchedClient: string | null = null;
    let matchedData: { income: number; issues: Set<string> } | null = null;

    for (const [clientName, data] of clientMap) {
      const clientLower = clientName.toLowerCase();
      if (
        clientLower === contributorLower ||
        clientLower.includes(contributorLower) ||
        contributorLower.includes(clientLower)
      ) {
        matchedClient = clientName;
        matchedData = data;
        break;
      }
    }

    if (matchedClient && matchedData) {
      connections.push({
        organization: matchedClient,
        donated: contributor.total,
        lobbied_issues: [...matchedData.issues],
        lobbying_income: matchedData.income,
      });
    }
  }

  return connections.sort((a, b) => b.lobbying_income - a.lobbying_income);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repId = searchParams.get('repId');
  const chamber = searchParams.get('chamber'); // 'senate' or 'house'

  if (!repId || !chamber) {
    return NextResponse.json({ error: 'repId and chamber are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const cacheKey = `lobbying-${repId}`;

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', user.id)
    .eq('feed_type', cacheKey)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json(cached.data as LobbyingResponse);
  }

  // Get rep info from profile
  const { data: profile } = await admin
    .from('profiles')
    .select('representatives')
    .eq('user_id', user.id)
    .single();

  const reps = (profile?.representatives ?? []) as Official[];
  const rep = reps.find((r) => r.id === repId);
  const repName = rep?.name ?? 'Representative';

  // Fetch committee assignments from Congress.gov
  const committees = await fetchCommittees(repId);
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

  // Cross-reference with FEC data for lobbying connections
  let lobbyingConnections: LobbyingConnection[] = [];
  const { data: financeCache } = await admin
    .from('feed_cache')
    .select('data')
    .eq('user_id', user.id)
    .eq('feed_type', 'finance')
    .single();

  if (financeCache?.data) {
    const financeData = financeCache.data as { finance?: Record<string, { top_contributors?: FecContributor[] }> };
    const repFinance = financeData.finance?.[repId];
    if (repFinance?.top_contributors) {
      lobbyingConnections = findLobbyingConnections(repFinance.top_contributors, clientMap);
    }
  }

  const payload: LobbyingResponse = {
    rep_id: repId,
    rep_name: repName,
    committees,
    issue_areas: issueAreas,
    top_clients: topClients,
    top_firms: topFirms,
    recent_filings: sortedRecentFilings,
    lobbying_connections: lobbyingConnections,
    quarters_covered: quarters.map((q) => q.label),
  };

  // Cache for 7 days
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: user.id, feed_type: cacheKey, data: payload, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json(payload);
}
