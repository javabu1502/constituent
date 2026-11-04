import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { getStateLegislators } from '@/lib/state-legislators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface DistrictCount {
  district: string;
  count: number;
  legislatorName: string | null;
  legislatorParty: string | null;
}

/**
 * GET /api/org/[slug]/supporters — district counts for the heatmap.
 *
 * Aggregate only. The org sees how many supporters sit in each district and
 * who represents it; it does not get names, emails or addresses from this
 * route. Exporting the list is a separate, consent-governed act.
 *
 * Owner only: a supporter list is the thing an org is building, and a public
 * endpoint would hand a rival (or a legislator's office) its strength map.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to view this' }, { status: 401 });

  const admin = createAdminClient();
  const { data: org } = await admin
    .from('profiles')
    .select('user_id, org_name, org_slug')
    .eq('org_slug', slug)
    .eq('account_type', 'organization')
    .maybeSingle();
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  if (org.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: rows, error } = await admin
    .from('org_supporters')
    .select('state_upper_district, state_lower_district, state, district_resolved')
    .eq('org_user_id', org.user_id)
    .is('unsubscribed_at', null);
  if (error) {
    console.error('[org/supporters] fetch failed:', error);
    return NextResponse.json({ error: 'Could not load supporters' }, { status: 500 });
  }

  const all = rows ?? [];
  const upper = new Map<string, number>();
  const lower = new Map<string, number>();
  const states = new Map<string, number>();
  let unplaced = 0;
  for (const r of all) {
    const st = (r.state as string | null)?.toUpperCase() ?? null;
    if (st) states.set(st, (states.get(st) ?? 0) + 1);
    if (!r.district_resolved) {
      unplaced++;
      continue;
    }
    const u = r.state_upper_district as string | null;
    const l = r.state_lower_district as string | null;
    if (u) upper.set(u, (upper.get(u) ?? 0) + 1);
    if (l) lower.set(l, (lower.get(l) ?? 0) + 1);
  }

  // The state the org actually organizes in: the one most of its supporters
  // live in. Districts are numbered per state, so mixing them would stack
  // Nevada's District 3 onto California's.
  const primaryState = [...states.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // The whole chamber roster, not findStateLegislators(): that one takes a
  // district per chamber and returns nothing when given none.
  const roster = primaryState ? getStateLegislators(primaryState) : [];
  const nameFor = (chamber: 'upper' | 'lower', district: string) => {
    const m = roster.find((o) => o.chamber === chamber && String(+o.district) === String(+district));
    return { legislatorName: m?.name ?? null, legislatorParty: m?.party ?? null };
  };

  const shape = (m: Map<string, number>, chamber: 'upper' | 'lower'): DistrictCount[] =>
    [...m.entries()]
      .map(([district, count]) => ({ district, count, ...nameFor(chamber, district) }))
      .sort((a, b) => b.count - a.count || Number(a.district) - Number(b.district));

  return NextResponse.json({
    orgName: org.org_name ?? null,
    total: all.length,
    unplaced,
    primaryState,
    senate: shape(upper, 'upper'),
    assembly: shape(lower, 'lower'),
  });
}
