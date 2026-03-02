import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import type { RepVote, VotingRecordResponse, Official } from '@/lib/types';
import { fetchLegiscanVotes } from '@/lib/legiscan-api';
import { fetchHouseVotes, fetchSenateVotes, computeSummary } from '@/lib/votes';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
