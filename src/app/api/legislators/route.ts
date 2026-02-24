import { NextResponse } from 'next/server';
import { getStateLegislators, toOfficial } from '@/lib/state-legislators';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state')?.toUpperCase();

  if (!state || state.length !== 2) {
    return NextResponse.json({ error: 'Missing or invalid state parameter' }, { status: 400 });
  }

  const legislators = getStateLegislators(state);

  if (legislators.length === 0) {
    return NextResponse.json({ legislators: [] });
  }

  const officials = legislators
    .map((leg) => toOfficial(leg, state))
    .sort((a, b) => {
      // Sort by chamber (upper first), then by district
      const chamberOrder = a.chamber === 'upper' ? 0 : 1;
      const chamberOrderB = b.chamber === 'upper' ? 0 : 1;
      if (chamberOrder !== chamberOrderB) return chamberOrder - chamberOrderB;
      const distA = a.district ?? '';
      const distB = b.district ?? '';
      const numA = parseInt(distA, 10);
      const numB = parseInt(distB, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return distA.localeCompare(distB);
    });

  return NextResponse.json({ legislators: officials });
}
