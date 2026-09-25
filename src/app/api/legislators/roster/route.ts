import { NextResponse } from 'next/server';
import { getAllFederalLegislators } from '@/lib/legislators';
import { getStateLegislators, toOfficial } from '@/lib/state-legislators';

/**
 * GET /api/legislators/roster?scope=us-senate|us-house|state&state=XX
 * Full browsable roster for the action targeting picker: people pick from a
 * checkbox list, they don't recall names. Sorted by state then name.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') || '';
  const state = (searchParams.get('state') || '').toUpperCase();

  if (scope === 'us-senate' || scope === 'us-house') {
    const chamber = scope === 'us-senate' ? 'senate' : 'house';
    const roster = getAllFederalLegislators()
      .filter((o) => o.chamber === chamber)
      .map((o) => ({
        id: o.id,
        name: o.name,
        level: 'federal' as const,
        party: o.party ?? null,
        state: o.state,
        district: o.district ?? null,
      }))
      .sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));
    return NextResponse.json({ roster });
  }

  if (scope === 'state') {
    if (state.length !== 2) {
      return NextResponse.json({ error: 'state required' }, { status: 400 });
    }
    const roster = getStateLegislators(state)
      .map((leg) => toOfficial(leg, state))
      .map((o) => ({
        id: o.id,
        name: o.name,
        level: 'state' as const,
        party: o.party ?? null,
        state,
        district: o.district ?? null,
        chamber: o.chamber ?? null,
      }))
      .sort((a, b) => (a.chamber ?? '').localeCompare(b.chamber ?? '') || a.name.localeCompare(b.name));
    return NextResponse.json({ roster });
  }

  return NextResponse.json({ error: 'scope must be us-senate, us-house, or state' }, { status: 400 });
}
