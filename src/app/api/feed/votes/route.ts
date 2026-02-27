import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { congressFetch } from '@/lib/congress-api';
import type { RepVote, VotingSummary, VotingRecordResponse, Official } from '@/lib/types';
import { fetchLegiscanVotes } from '@/lib/legiscan-api';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CURRENT_CONGRESS = 119;
const VOTES_LIST_LIMIT = 100;
const MEMBER_DETAILS_LIMIT = 20; // votes to fetch per-member positions for (rate-limited)

function parseRepresentatives(raw: unknown): Official[] {
  if (!raw || typeof raw !== 'object') return [];
  if (Array.isArray(raw)) return raw as Official[];
  const values = Object.values(raw as Record<string, unknown>);
  const result: Official[] = [];
  for (const val of values) {
    if (Array.isArray(val)) result.push(...(val as Official[]));
    else if (val && typeof val === 'object' && 'id' in val && 'name' in val) result.push(val as Official);
  }
  return result;
}

function getCongressSession(): number {
  const year = new Date().getFullYear();
  // Odd years = session 1, even years = session 2
  return year % 2 === 1 ? 1 : 2;
}

function getSessionYear(session: number): number {
  // 119th Congress: session 1 = 2025, session 2 = 2026
  return 2024 + session;
}

// Simple XML tag extractor
function xmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return match?.[1]?.trim() ?? '';
}

/**
 * Fetch House votes via Congress.gov /v3/house-vote/ endpoints.
 * - List: GET /v3/house-vote/{congress}?limit=N
 * - Members: GET /v3/house-vote/{congress}/{session}/{rollNumber}/members?limit=500
 */
async function fetchHouseVotes(
  bioguideId: string,
  repName: string,
): Promise<RepVote[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];

  // Fetch vote list (returns all votes across both sessions for this congress)
  const listUrl = `https://api.congress.gov/v3/house-vote/${CURRENT_CONGRESS}?limit=${VOTES_LIST_LIMIT}&api_key=${apiKey}`;
  const listRes = await congressFetch(listUrl);
  if (!listRes.ok) return [];

  const listData = await listRes.json();
  const voteList = (listData.houseRollCallVotes ?? []) as Record<string, unknown>[];

  // Sort by rollCallNumber descending (most recent first)
  voteList.sort((a, b) => (Number(b.rollCallNumber) || 0) - (Number(a.rollCallNumber) || 0));

  const votes: RepVote[] = [];
  let detailsFetched = 0;

  for (const v of voteList) {
    const rollNumber = Number(v.rollCallNumber) || 0;
    const sessionNum = Number(v.sessionNumber) || getCongressSession();
    const startDate = (v.startDate as string) ?? '';
    const result = (v.result as string) ?? '';
    const legislationNumber = (v.legislationNumber as string) ?? '';
    const legislationType = (v.legislationType as string) ?? '';
    const billNumber = legislationType && legislationNumber ? `${legislationType} ${legislationNumber}` : '';
    const voteType = (v.voteType as string) ?? '';

    let position = '';
    let yeaCount: number | undefined;
    let nayCount: number | undefined;
    let notVotingCount: number | undefined;
    let presentCount: number | undefined;
    let voteQuestion = '';

    if (detailsFetched < MEMBER_DETAILS_LIMIT) {
      // Fetch vote detail for question text and party totals
      try {
        const detailUrl = `https://api.congress.gov/v3/house-vote/${CURRENT_CONGRESS}/${sessionNum}/${rollNumber}?api_key=${apiKey}`;
        const detailRes = await congressFetch(detailUrl);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const vd = detailData.houseRollCallVote ?? {};
          if (vd.voteQuestion) voteQuestion = vd.voteQuestion as string;

          // Sum party totals for overall counts
          const partyTotals = (vd.votePartyTotal ?? []) as Record<string, unknown>[];
          let totalYea = 0, totalNay = 0, totalNotVoting = 0, totalPresent = 0;
          for (const pt of partyTotals) {
            totalYea += (pt.yeaTotal as number) ?? 0;
            totalNay += (pt.nayTotal as number) ?? 0;
            totalNotVoting += (pt.notVotingTotal as number) ?? 0;
            totalPresent += (pt.presentTotal as number) ?? 0;
          }
          yeaCount = totalYea;
          nayCount = totalNay;
          notVotingCount = totalNotVoting;
          presentCount = totalPresent;
        }
      } catch {
        // Continue without detail
      }

      // Fetch member positions (separate endpoint)
      try {
        const membersUrl = `https://api.congress.gov/v3/house-vote/${CURRENT_CONGRESS}/${sessionNum}/${rollNumber}/members?limit=500&api_key=${apiKey}`;
        const membersRes = await congressFetch(membersUrl);
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          const memberVotes = (
            membersData.houseRollCallVoteMemberVotes?.results ?? []
          ) as Record<string, unknown>[];
          for (const mv of memberVotes) {
            // Congress.gov uses bioguideID (capital ID)
            if ((mv.bioguideID as string) === bioguideId) {
              position = (mv.voteCast as string) ?? '';
              break;
            }
          }
        }
      } catch {
        // Continue without member position
      }

      detailsFetched++;
    }

    const dateStr = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
    const voteYear = getSessionYear(sessionNum);

    votes.push({
      type: 'vote' as const,
      roll_number: String(rollNumber),
      question: voteQuestion || (billNumber ? `${voteType || 'Vote'} on ${billNumber}` : voteType || `Roll Call #${rollNumber}`),
      description: '',
      result,
      date: dateStr,
      rep_position: position,
      bill_number: billNumber || undefined,
      bill_title: undefined,
      congress: CURRENT_CONGRESS,
      chamber: 'House' as const,
      vote_url: `https://clerk.house.gov/Votes/${voteYear}${rollNumber}`,
      rep_id: bioguideId,
      rep_name: repName,
      level: 'federal' as const,
      yea_count: yeaCount,
      nay_count: nayCount,
      not_voting_count: notVotingCount,
      present_count: presentCount,
    });
  }

  return votes;
}

/**
 * Fetch Senate votes via senate.gov XML feeds.
 * Congress.gov does not have Senate vote endpoints, so we use:
 * - Vote list: https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_{congress}_{session}.xml
 * - Vote detail: https://www.senate.gov/legislative/LIS/roll_call_votes/vote{congress}{session}/vote_{congress}_{session}_{paddedNumber}.xml
 * The detail XML includes per-member positions directly.
 */
async function fetchSenateVotes(
  bioguideId: string,
  repName: string,
  repLastName: string,
  repState: string,
): Promise<RepVote[]> {
  const allVotes: RepVote[] = [];
  const session = getCongressSession();

  // Fetch vote menus for current session (and previous session for more history)
  const sessions = session === 2 ? [2, 1] : [1];

  for (const sess of sessions) {
    try {
      const menuUrl = `https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_${CURRENT_CONGRESS}_${sess}.xml`;
      const menuRes = await fetch(menuUrl, { signal: AbortSignal.timeout(10000) });
      if (!menuRes.ok) continue;
      const menuXml = await menuRes.text();

      // Extract congress year for date parsing (menu dates are like "12-Feb")
      const congressYear = xmlTag(menuXml, 'congress_year') || String(getSessionYear(sess));

      // Parse vote entries from menu XML
      const voteRegex = /<vote>([\s\S]*?)<\/vote>/g;
      let match;
      const menuVotes: { number: string; date: string; issue: string; question: string; result: string; yeas: string; nays: string; title: string; session: number }[] = [];

      while ((match = voteRegex.exec(menuXml)) !== null) {
        const block = match[1];
        menuVotes.push({
          number: xmlTag(block, 'vote_number').trim(),
          date: xmlTag(block, 'vote_date').trim(),
          issue: xmlTag(block, 'issue').trim(),
          question: xmlTag(block, 'question').replace(/\s+/g, ' ').trim(),
          result: xmlTag(block, 'result').trim(),
          yeas: xmlTag(block, 'yeas').trim(),
          nays: xmlTag(block, 'nays').trim(),
          title: xmlTag(block, 'title').replace(/\s+/g, ' ').trim(),
          session: sess,
        });
      }

      // Sort by vote number descending (most recent first)
      menuVotes.sort((a, b) => Number(b.number) - Number(a.number));

      // Take up to limit
      const limited = menuVotes.slice(0, VOTES_LIST_LIMIT);

      let detailsFetched = 0;
      for (const mv of limited) {
        const paddedNumber = mv.number.padStart(5, '0');
        let position = '';
        let yeaCount = mv.yeas ? Number(mv.yeas) : undefined;
        let nayCount = mv.nays ? Number(mv.nays) : undefined;
        let notVotingCount: number | undefined;
        let presentCount: number | undefined;

        // Fetch detail XML for per-member positions (first N votes)
        if (detailsFetched < MEMBER_DETAILS_LIMIT) {
          try {
            const detailUrl = `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${CURRENT_CONGRESS}${sess}/vote_${CURRENT_CONGRESS}_${sess}_${paddedNumber}.xml`;
            const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(10000) });
            if (detailRes.ok) {
              const detailXml = await detailRes.text();

              // Parse vote counts from detail
              const countBlock = detailXml.match(/<count>([\s\S]*?)<\/count>/)?.[1] ?? '';
              if (countBlock) {
                yeaCount = Number(xmlTag(countBlock, 'yeas')) || yeaCount;
                nayCount = Number(xmlTag(countBlock, 'nays')) || nayCount;
                notVotingCount = Number(xmlTag(countBlock, 'absent')) || Number(xmlTag(countBlock, 'not_voting')) || undefined;
                presentCount = Number(xmlTag(countBlock, 'present')) || undefined;
              }

              // Find this senator's position by matching last name + state
              const memberRegex = /<member>([\s\S]*?)<\/member>/g;
              let memberMatch;
              const lastNameLower = repLastName.toLowerCase();
              const stateLower = repState.toUpperCase();

              while ((memberMatch = memberRegex.exec(detailXml)) !== null) {
                const memberBlock = memberMatch[1];
                const memberLastName = xmlTag(memberBlock, 'last_name').toLowerCase();
                const memberState = xmlTag(memberBlock, 'state').toUpperCase();

                if (memberLastName === lastNameLower && memberState === stateLower) {
                  position = xmlTag(memberBlock, 'vote_cast');
                  break;
                }
              }
            }
            detailsFetched++;
          } catch {
            // Continue without detail
          }
          // Small delay to be polite to senate.gov
          await new Promise(r => setTimeout(r, 200));
        }

        // Parse date from menu format ("12-Feb" → "2026-02-12")
        let dateStr = '';
        try {
          if (mv.date) {
            // Menu format is "DD-Mon" (e.g., "12-Feb"), append year from congress_year
            const fullDate = `${mv.date}-${congressYear}`;
            const parsed = new Date(fullDate);
            if (!isNaN(parsed.getTime())) {
              dateStr = parsed.toISOString().split('T')[0];
            } else {
              // Fallback: try parsing as-is (might be a full date in detail)
              dateStr = new Date(mv.date).toISOString().split('T')[0];
            }
          }
        } catch {
          dateStr = '';
        }

        // Bill/issue info
        const issue = mv.issue.trim();
        const billNumber = issue && !issue.startsWith('PN') ? issue : undefined;

        allVotes.push({
          type: 'vote' as const,
          roll_number: mv.number,
          question: mv.question || mv.title || `Senate Vote #${mv.number}`,
          description: mv.title && mv.question ? mv.title : '',
          result: mv.result,
          date: dateStr,
          rep_position: position,
          bill_number: billNumber,
          bill_title: mv.title || undefined,
          congress: CURRENT_CONGRESS,
          chamber: 'Senate' as const,
          vote_url: `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${CURRENT_CONGRESS}${sess}/vote_${CURRENT_CONGRESS}_${sess}_${paddedNumber}.htm`,
          rep_id: bioguideId,
          rep_name: repName,
          level: 'federal' as const,
          yea_count: yeaCount,
          nay_count: nayCount,
          not_voting_count: notVotingCount,
          present_count: presentCount,
        });
      }
    } catch {
      // Continue with next session
    }
  }

  return allVotes;
}

/**
 * Fetch voting record for a state representative via Open States GraphQL.
 */
async function fetchStateVotes(
  personId: string,
  repName: string,
  chamber: string,
): Promise<RepVote[]> {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) return [];

  const query = `
    query($personId: ID!) {
      person(id: $personId) {
        votes(first: 100) {
          edges {
            node {
              option
              voteEvent {
                identifier
                motionText
                startDate
                result
                bill {
                  identifier
                  title
                }
                counts {
                  option
                  value
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://openstates.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ query, variables: { personId } }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (data.errors) return [];

    const edges = data?.data?.person?.votes?.edges ?? [];
    return edges.map((edge: Record<string, unknown>) => {
      const node = edge.node as Record<string, unknown>;
      const ve = node.voteEvent as Record<string, unknown> | undefined;
      const bill = ve?.bill as Record<string, unknown> | undefined;
      const counts = (ve?.counts ?? []) as { option: string; value: number }[];

      const yeaCount = counts.find(c => c.option === 'yes')?.value;
      const nayCount = counts.find(c => c.option === 'no')?.value;
      const notVotingCount = counts.find(c => c.option === 'absent' || c.option === 'not voting')?.value;

      const option = (node.option as string) ?? '';
      const normalizedPosition =
        option === 'yes' ? 'Yea' :
        option === 'no' ? 'Nay' :
        option === 'not voting' || option === 'absent' ? 'Not Voting' :
        option === 'present' || option === 'abstain' ? 'Present' :
        option;

      return {
        type: 'vote' as const,
        roll_number: (ve?.identifier as string) ?? '',
        question: (ve?.motionText as string) ?? '',
        description: '',
        result: (ve?.result as string) ?? '',
        date: (ve?.startDate as string) ?? '',
        rep_position: normalizedPosition,
        bill_number: (bill?.identifier as string) ?? undefined,
        bill_title: (bill?.title as string) ?? undefined,
        congress: 0,
        chamber: (chamber === 'upper' ? 'Senate' : 'House') as 'Senate' | 'House',
        vote_url: '',
        rep_id: personId,
        rep_name: repName,
        level: 'state' as const,
        yea_count: yeaCount,
        nay_count: nayCount,
        not_voting_count: notVotingCount,
      };
    });
  } catch {
    return [];
  }
}

function computeSummary(votes: RepVote[]): VotingSummary {
  const withPosition = votes.filter(v => v.rep_position);
  const yea = withPosition.filter(v => v.rep_position === 'Yea').length;
  const nay = withPosition.filter(v => v.rep_position === 'Nay').length;
  const notVoting = withPosition.filter(v => v.rep_position === 'Not Voting').length;
  const present = withPosition.filter(v => v.rep_position === 'Present').length;
  const voted = yea + nay + present;
  const participation = withPosition.length > 0 ? (voted / withPosition.length) * 100 : 0;

  return {
    total_votes: withPosition.length,
    yea_votes: yea,
    nay_votes: nay,
    not_voting: notVoting,
    present_votes: present,
    participation_rate: Math.round(participation * 10) / 10,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repId = searchParams.get('repId');

  if (!repId) {
    return NextResponse.json({ error: 'repId is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const cacheKey = `votes-${repId}`;

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', user.id)
    .eq('feed_type', cacheKey)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    const cachedPayload = cached.data as VotingRecordResponse | null;
    if (cachedPayload?.votes && cachedPayload.votes.length > 0) {
      return NextResponse.json(cachedPayload);
    }
  }

  // Get rep info from profile
  const { data: profile } = await admin
    .from('profiles')
    .select('representatives')
    .eq('user_id', user.id)
    .single();

  const reps = parseRepresentatives(profile?.representatives);
  const rep = reps.find(r => r.id === repId);

  if (!rep) {
    return NextResponse.json({ error: 'Representative not found' }, { status: 404 });
  }

  let votes: RepVote[] = [];
  let dataSource: VotingRecordResponse['data_source'];

  if (rep.level === 'federal') {
    if (rep.chamber === 'house') {
      votes = await fetchHouseVotes(rep.id, rep.name);
    } else {
      const lastName = rep.lastName || rep.name.split(' ').pop() || rep.name;
      votes = await fetchSenateVotes(rep.id, rep.name, lastName, rep.state);
    }
    dataSource = 'congress.gov';
  } else {
    // Try Open States first
    votes = await fetchStateVotes(rep.id, rep.name, rep.chamber || '');
    if (votes.length > 0) {
      dataSource = 'openstates';
    } else {
      // Fall back to LegiScan
      const lastName = rep.lastName || rep.name.split(' ').pop() || rep.name;
      const legiscanResult = await fetchLegiscanVotes(
        rep.state,
        rep.name,
        lastName,
        rep.chamber || '',
        rep.id,
      );
      if (legiscanResult && legiscanResult.votes.length > 0) {
        votes = legiscanResult.votes;
        dataSource = 'legiscan';
      } else {
        dataSource = 'openstates';
      }
    }
  }

  // Sort by date descending
  votes.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  const summary = computeSummary(votes);
  const payload: VotingRecordResponse = {
    votes,
    summary,
    total_available: votes.length,
    data_source: dataSource,
  };

  // Cache for 24 hours
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: user.id, feed_type: cacheKey, data: payload, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json(payload);
}
