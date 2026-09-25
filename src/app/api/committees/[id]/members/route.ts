import { NextRequest, NextResponse } from 'next/server';
import { getCommittee, getCommitteeMembers } from '@/lib/committees';
import { getStateCommittee, getStateCommitteeMembers } from '@/lib/state-committees';

/**
 * GET /api/committees/[id]/members            — congressional (bioguide ids)
 * GET /api/committees/[id]/members?state=NV   — state legislature (ocd-person ids)
 * Roster for a committee (vendored data). Used by the participate flow to keep
 * committee-stage messages to committee members only. `memberIds` match
 * Official.id at the corresponding level, so callers filter with a set lookup.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = request.nextUrl.searchParams.get('state');

  if (state) {
    const committee = getStateCommittee(state, id);
    const memberIds = getStateCommitteeMembers(state, id);
    if (!committee || memberIds.length === 0) {
      return NextResponse.json({ error: 'Unknown committee' }, { status: 404 });
    }
    return NextResponse.json(
      {
        committee: { id: committee.id, name: committee.name, chamber: committee.chamber },
        memberIds,
      },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } }
    );
  }

  const memberIds = getCommitteeMembers(id).map((m) => m.bioguide);
  if (memberIds.length === 0) {
    return NextResponse.json({ error: 'Unknown committee' }, { status: 404 });
  }
  // Subcommittee ids resolve their parent committee for display.
  const committee = getCommittee(id) ?? getCommittee(id.slice(0, 4));
  return NextResponse.json(
    {
      committee: committee ? { id: committee.id, name: committee.name, chamber: committee.chamber } : null,
      memberIds,
    },
    { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } }
  );
}
