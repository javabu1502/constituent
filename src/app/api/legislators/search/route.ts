import { NextResponse } from 'next/server';
import { getAllFederalLegislators } from '@/lib/legislators';
import { getStateLegislators, toOfficial } from '@/lib/state-legislators';

export interface TargetOfficialResult {
  id: string;
  name: string;
  title: string;
  level: 'federal' | 'state';
  chamber: string;
  party: string | null;
  state: string;
  district: string | null;
}

/**
 * GET /api/legislators/search?q=<name>&state=XX
 * Name search across all federal legislators, plus one state's legislature
 * when `state` is given. Powers the action targeting picker.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const state = (searchParams.get('state') || '').toUpperCase();

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results: TargetOfficialResult[] = [];

  for (const o of getAllFederalLegislators()) {
    if (!o.name.toLowerCase().includes(q)) continue;
    results.push({
      id: o.id,
      name: o.name,
      title: o.title,
      level: 'federal',
      chamber: o.chamber,
      party: o.party ?? null,
      state: o.state,
      district: o.district ?? null,
    });
  }

  if (state.length === 2) {
    for (const leg of getStateLegislators(state)) {
      const o = toOfficial(leg, state);
      if (!o.name.toLowerCase().includes(q)) continue;
      results.push({
        id: o.id,
        name: o.name,
        title: o.title,
        level: 'state',
        chamber: o.chamber ?? '',
        party: o.party ?? null,
        state,
        district: o.district ?? null,
      });
    }
  }

  return NextResponse.json({ results: results.slice(0, 25) });
}
