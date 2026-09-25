import { NextRequest, NextResponse } from 'next/server';
import { listCommittees, type Committee } from '@/lib/committees';
import { listStateCommittees } from '@/lib/state-committees';

/**
 * GET /api/committees?chamber=house|senate — congressional committees
 * GET /api/committees?state=NV — that state legislature's committees
 * Public, static vendored data, for the stage-creation form's picker.
 */
export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state');
  if (state) {
    const committees = listStateCommittees(state).map(({ id, name, chamber }) => ({ id, name, chamber }));
    return NextResponse.json(
      { committees },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } }
    );
  }

  const chamber = request.nextUrl.searchParams.get('chamber');
  const valid: Committee['chamber'][] = ['house', 'senate', 'joint'];
  const committees = listCommittees(valid.includes(chamber as Committee['chamber']) ? (chamber as Committee['chamber']) : undefined);

  return NextResponse.json(
    { committees: committees.map(({ id, name, chamber: ch }) => ({ id, name, chamber: ch })) },
    { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } }
  );
}
