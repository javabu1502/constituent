/**
 * LegiScan API integration for state legislator vote data.
 *
 * API docs: https://legiscan.com/legiscan
 * Limits: 30,000 queries/month. Uses change_hash caching to minimize calls.
 *
 * Flow:
 *  1. getSessionList → find current session for the state
 *  2. getSessionPeople → map legislator name to LegiScan person_id
 *  3. getMasterListRaw → get bills with change_hash (skip unchanged)
 *  4. getBill → get roll_call_ids from bills the person voted on
 *  5. getRollCall → get individual vote records
 */

import { createAdminClient } from '@/lib/supabase';
import type { RepVote } from '@/lib/types';

const BASE_URL = 'https://api.legiscan.com/';

// US state codes to LegiScan state abbreviation (they match)
// LegiScan uses standard 2-letter codes

interface LegiScanSession {
  session_id: number;
  state_id: number;
  session_name: string;
  session_title: string;
  year_start: number;
  year_end: number;
  special: number;
}

interface LegiScanPerson {
  people_id: number;
  person_id: number;
  name: string;
  first_name: string;
  last_name: string;
  role: string;
  party: string;
  district: string;
}

interface LegiScanRollCallVote {
  people_id: number;
  vote_id: number;
  vote_text: string; // "Yea", "Nay", "NV", "Absent", etc.
}

interface LegiScanRollCall {
  roll_call_id: number;
  bill_id: number;
  date: string;
  desc: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  passed: number;
  chamber: string;
  votes: LegiScanRollCallVote[];
}

async function legiscanFetch(op: string, params: Record<string, string> = {}): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.LEGISCAN_API_KEY;
  if (!apiKey) return null;

  const url = new URL(BASE_URL);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('op', op);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'ERROR') return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Get the current (most recent) session for a state.
 * Caches session info in feed_cache with key `legiscan-sessions-{state}`.
 */
export async function getCurrentSession(stateCode: string): Promise<LegiScanSession | null> {
  const admin = createAdminClient();
  const cacheKey = `legiscan-sessions-${stateCode}`;

  // Check cache (sessions don't change often — cache for 7 days)
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', 'public')
    .eq('feed_type', cacheKey)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < 7 * 24 * 60 * 60 * 1000) {
    const sessions = cached.data as LegiScanSession[];
    if (sessions && sessions.length > 0) return sessions[0];
  }

  const data = await legiscanFetch('getSessionList', { state: stateCode });
  if (!data?.sessions) return null;

  const sessions = Object.values(data.sessions as Record<string, LegiScanSession>);
  // Sort by year_end descending, prefer non-special sessions
  sessions.sort((a, b) => {
    if (a.year_end !== b.year_end) return b.year_end - a.year_end;
    return a.special - b.special; // 0 (regular) before 1 (special)
  });

  // Cache sessions
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: 'public', feed_type: cacheKey, data: sessions, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return sessions[0] ?? null;
}

/**
 * Find a legislator's LegiScan people_id by matching name.
 * Uses getSessionPeople and caches the results.
 */
export async function findLegiscanPersonId(
  sessionId: number,
  repName: string,
  repLastName?: string,
): Promise<number | null> {
  const admin = createAdminClient();
  const cacheKey = `legiscan-people-${sessionId}`;

  // Check cache (people in a session don't change — cache for 7 days)
  let people: LegiScanPerson[];
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', 'public')
    .eq('feed_type', cacheKey)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < 7 * 24 * 60 * 60 * 1000) {
    people = cached.data as LegiScanPerson[];
  } else {
    const data = await legiscanFetch('getSessionPeople', { id: String(sessionId) });
    const sessionpeople = data?.sessionpeople as Record<string, unknown> | undefined;
    if (!sessionpeople?.people) return null;

    people = Object.values(sessionpeople.people as Record<string, LegiScanPerson>);

    await admin
      .from('feed_cache')
      .upsert(
        { user_id: 'public', feed_type: cacheKey, data: people, fetched_at: new Date().toISOString() },
        { onConflict: 'user_id,feed_type' }
      );
  }

  // Match by last name first, then full name
  const lastName = (repLastName || repName.split(' ').pop() || '').toLowerCase();
  const fullNameLower = repName.toLowerCase();

  // Try exact full name match
  let match = people.find(p =>
    p.name.toLowerCase() === fullNameLower ||
    `${p.first_name} ${p.last_name}`.toLowerCase() === fullNameLower
  );

  // Try last name match (may have multiple — return first)
  if (!match) {
    match = people.find(p => p.last_name.toLowerCase() === lastName);
  }

  return match?.people_id ?? null;
}

/**
 * Fetch vote records for a state legislator from LegiScan.
 *
 * Strategy to minimize API calls:
 *  1. getMasterListRaw → get all bills with change_hash (1 call)
 *  2. Compare change_hash with cached values to skip unchanged bills
 *  3. getBill for changed bills → get roll_call IDs (N calls, only for changed bills)
 *  4. getRollCall for each roll call the person voted on (M calls)
 *
 * With aggressive caching, subsequent requests typically cost 1 API call
 * (just getMasterListRaw to check hashes).
 */
export async function fetchLegiscanVotes(
  stateCode: string,
  repName: string,
  repLastName: string | undefined,
  chamber: string,
  personId: string,
): Promise<{ votes: RepVote[]; source: 'legiscan' } | null> {
  const session = await getCurrentSession(stateCode);
  if (!session) return null;

  const legiscanPeopleId = await findLegiscanPersonId(session.session_id, repName, repLastName);
  if (!legiscanPeopleId) return null;

  const admin = createAdminClient();
  const votesCacheKey = `legiscan-votes-${personId}`;
  const hashCacheKey = `legiscan-hashes-${session.session_id}`;

  // Check if we have cached votes that are still fresh (24h)
  const { data: votesCached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', 'public')
    .eq('feed_type', votesCacheKey)
    .single();

  if (votesCached && Date.now() - new Date(votesCached.fetched_at).getTime() < 24 * 60 * 60 * 1000) {
    const cachedVotes = votesCached.data as { votes: RepVote[] };
    if (cachedVotes?.votes) {
      return { votes: cachedVotes.votes, source: 'legiscan' };
    }
  }

  // Get master bill list with change_hash values (1 API call)
  const masterData = await legiscanFetch('getMasterListRaw', { id: String(session.session_id) });
  if (!masterData?.masterlist) return null;

  const masterList = masterData.masterlist as Record<string, {
    bill_id: number;
    number: string;
    title: string;
    change_hash: string;
    status: number;
    last_action_date: string;
  }>;

  // Load cached hashes
  const { data: hashCached } = await admin
    .from('feed_cache')
    .select('data')
    .eq('user_id', 'public')
    .eq('feed_type', hashCacheKey)
    .single();

  const cachedHashes = (hashCached?.data ?? {}) as Record<string, string>;
  const newHashes: Record<string, string> = {};

  // Find bills that have changed since last check
  // Also collect all bill_ids we need to check for this person's votes
  const billsToFetch: { bill_id: number; number: string; title: string; last_action_date: string }[] = [];
  const unchangedBillIds = new Set<number>();

  for (const [key, bill] of Object.entries(masterList)) {
    if (key === 'session') continue; // skip session metadata
    if (!bill?.bill_id) continue;

    newHashes[String(bill.bill_id)] = bill.change_hash;

    if (cachedHashes[String(bill.bill_id)] === bill.change_hash) {
      unchangedBillIds.add(bill.bill_id);
    } else {
      billsToFetch.push({
        bill_id: bill.bill_id,
        number: bill.number,
        title: bill.title,
        last_action_date: bill.last_action_date,
      });
    }
  }

  // Save updated hashes
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: 'public', feed_type: hashCacheKey, data: newHashes, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  // Load cached roll calls for unchanged bills
  const rollCallCacheKey = `legiscan-rollcalls-${personId}`;
  const { data: rollCallCached } = await admin
    .from('feed_cache')
    .select('data')
    .eq('user_id', 'public')
    .eq('feed_type', rollCallCacheKey)
    .single();

  const cachedRollCalls = (rollCallCached?.data ?? { votes: [], rollCallIds: {} }) as {
    votes: RepVote[];
    rollCallIds: Record<string, boolean>; // roll_call_id → fetched
  };

  // Start with cached votes from unchanged bills
  const allVotes: RepVote[] = cachedRollCalls.votes.filter(v => {
    // Keep votes from unchanged bills
    const billId = (v as unknown as Record<string, unknown>)._legiscan_bill_id as number | undefined;
    return billId !== undefined && unchangedBillIds.has(billId);
  });
  const fetchedRollCallIds = new Set<string>(Object.keys(cachedRollCalls.rollCallIds));

  // For changed bills, fetch bill details to get roll_call_ids
  // Limit to 20 most recent bills to control API usage
  billsToFetch.sort((a, b) => {
    const da = a.last_action_date ? new Date(a.last_action_date).getTime() : 0;
    const db = b.last_action_date ? new Date(b.last_action_date).getTime() : 0;
    return db - da;
  });
  const billsToProcess = billsToFetch.slice(0, 20);

  for (const bill of billsToProcess) {
    const billData = await legiscanFetch('getBill', { id: String(bill.bill_id) });
    if (!billData?.bill) continue;

    const billDetail = billData.bill as Record<string, unknown>;
    const rollCalls = (billDetail.votes ?? []) as { roll_call_id: number; date: string; desc: string }[];

    for (const rc of rollCalls) {
      const rcIdStr = String(rc.roll_call_id);
      if (fetchedRollCallIds.has(rcIdStr)) continue;

      const rcData = await legiscanFetch('getRollCall', { id: rcIdStr });
      if (!rcData?.roll_call) continue;

      const rollCall = rcData.roll_call as LegiScanRollCall;
      fetchedRollCallIds.add(rcIdStr);

      // Find this person's vote
      const personVote = rollCall.votes.find(v => v.people_id === legiscanPeopleId);
      if (!personVote) continue;

      // Normalize vote_text
      const voteText = personVote.vote_text;
      const normalizedPosition =
        voteText === 'Yea' ? 'Yea' :
        voteText === 'Nay' ? 'Nay' :
        voteText === 'NV' || voteText === 'Absent' ? 'Not Voting' :
        voteText === 'Present' ? 'Present' :
        voteText;

      const resultText = rollCall.passed === 1 ? 'Passed' : rollCall.passed === 2 ? 'Failed' : '';
      const chamberLabel = (chamber === 'upper' ? 'Senate' : 'House') as 'Senate' | 'House';

      const vote: RepVote & { _legiscan_bill_id?: number } = {
        type: 'vote' as const,
        roll_number: String(rollCall.roll_call_id),
        question: rollCall.desc || `Vote on ${bill.number}`,
        description: '',
        result: resultText,
        date: rollCall.date,
        rep_position: normalizedPosition,
        bill_number: bill.number,
        bill_title: bill.title,
        congress: 0,
        chamber: chamberLabel,
        vote_url: `https://legiscan.com/votes/${rcIdStr}`,
        rep_id: personId,
        rep_name: repName,
        level: 'state' as const,
        yea_count: rollCall.yea,
        nay_count: rollCall.nay,
        not_voting_count: rollCall.nv + rollCall.absent,
        _legiscan_bill_id: bill.bill_id,
      };

      allVotes.push(vote);
    }
  }

  // Sort by date descending
  allVotes.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  // Cache the roll call results
  const rollCallIdsObj: Record<string, boolean> = {};
  for (const id of fetchedRollCallIds) rollCallIdsObj[id] = true;

  await admin
    .from('feed_cache')
    .upsert(
      {
        user_id: 'public',
        feed_type: rollCallCacheKey,
        data: { votes: allVotes, rollCallIds: rollCallIdsObj },
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,feed_type' }
    );

  // Cache the final votes result
  await admin
    .from('feed_cache')
    .upsert(
      {
        user_id: 'public',
        feed_type: votesCacheKey,
        data: { votes: allVotes },
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,feed_type' }
    );

  return { votes: allVotes, source: 'legiscan' };
}
