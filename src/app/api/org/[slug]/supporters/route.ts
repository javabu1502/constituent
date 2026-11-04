import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { getStateLegislators } from '@/lib/state-legislators';
import { collectSupporters, type SupporterSource } from '@/lib/org-supporters';
import { verifyMapEmbedToken } from '@/lib/org-embed-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface DistrictCount {
  district: string;
  count: number;
  legislatorName: string | null;
  legislatorParty: string | null;
}

export interface PlaceCount {
  place: string;
  count: number;
}

/**
 * GET /api/org/[slug]/supporters — the org's supporter rollup for the heatmap.
 *
 * A supporter is anyone who joined through the form, took an action on one of
 * the org's campaigns, or shared a story with it, counted once. See
 * lib/org-supporters.ts for how identity and consent are handled.
 *
 * Aggregate only. Counts per district and per city, never names, emails or
 * addresses. Exporting the list is a separate, consent-governed act.
 *
 * Two ways in: the owner's session, or a signed token for a map the org has
 * chosen to embed on its own site. A slug alone is not enough.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const token = new URL(req.url).searchParams.get('t');

  const admin = createAdminClient();
  const { data: org } = await admin
    .from('profiles')
    .select('user_id, org_name, org_slug')
    .eq('org_slug', slug)
    .eq('account_type', 'organization')
    .maybeSingle();
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const viaToken = verifyMapEmbedToken(slug, token);
  if (!viaToken) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in to view this' }, { status: 401 });
    if (org.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let rollup;
  try {
    rollup = await collectSupporters(admin, org.user_id);
  } catch (e) {
    console.error('[org/supporters] fetch failed:', e);
    return NextResponse.json({ error: 'Could not load supporters' }, { status: 500 });
  }

  const { supporters, anonymousActions, anonymousStories } = rollup;

  const upper = new Map<string, number>();
  const lower = new Map<string, number>();
  const states = new Map<string, number>();
  const places = new Map<string, number>();
  const sources: Record<SupporterSource, number> = { joined: 0, acted: 0, shared: 0 };
  let mapped = 0;

  for (const s of supporters) {
    for (const src of s.sources) sources[src]++;
    if (s.state) states.set(s.state, (states.get(s.state) ?? 0) + 1);
    if (s.city) {
      const key = s.state ? `${s.city}, ${s.state}` : s.city;
      places.set(key, (places.get(key) ?? 0) + 1);
    }
    if (s.upperDistrict || s.lowerDistrict) {
      mapped++;
      if (s.upperDistrict) upper.set(s.upperDistrict, (upper.get(s.upperDistrict) ?? 0) + 1);
      if (s.lowerDistrict) lower.set(s.lowerDistrict, (lower.get(s.lowerDistrict) ?? 0) + 1);
    }
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

  const cities: PlaceCount[] = [...places.entries()]
    .map(([place, count]) => ({ place, count }))
    .sort((a, b) => b.count - a.count || a.place.localeCompare(b.place));

  return NextResponse.json({
    orgName: org.org_name ?? null,
    total: supporters.length,
    sources,
    /** Placed in a district. Only the join form collects a street address. */
    mapped,
    /** Counted as supporters but with no district to sit in. */
    unplaced: supporters.length - mapped,
    /** Real actions and stories that carry no contact detail to tie to a person. */
    anonymousActions,
    anonymousStories,
    primaryState,
    cities,
    senate: shape(upper, 'upper'),
    assembly: shape(lower, 'lower'),
  });
}
