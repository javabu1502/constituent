import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import type { RepFinance, RepFinanceResponse, Official } from '@/lib/types';
import { getCurrentCycle, findCandidate, fetchCandidateTotals, fetchTopContributors } from '@/lib/fec';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — FEC data updates quarterly

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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.FEC_API_KEY) {
    return NextResponse.json({ error: 'FEC API key not configured' }, { status: 500 });
  }

  const admin = createAdminClient();

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', user.id)
    .eq('feed_type', 'finance')
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    const cachedPayload = cached.data as RepFinanceResponse | null;
    if (cachedPayload?.finance && Object.keys(cachedPayload.finance).length > 0) {
      // Bust cache if any rep has <=10 contributors (old per_page=10 fetch)
      const needsRefresh = Object.values(cachedPayload.finance).some(
        (f) => f.top_contributors.length > 0 && f.top_contributors.length <= 10
      );
      if (!needsRefresh) {
        return NextResponse.json(cachedPayload);
      }
    }
  }

  // Get reps from profile
  const { data: profile } = await admin
    .from('profiles')
    .select('representatives')
    .eq('user_id', user.id)
    .single();

  const reps = parseRepresentatives(profile?.representatives);
  const federalReps = reps.filter((r) => r.level === 'federal');

  if (federalReps.length === 0) {
    return NextResponse.json({ finance: {} } satisfies RepFinanceResponse);
  }

  const cycle = getCurrentCycle();
  const finance: Record<string, RepFinance> = {};

  // Process each federal rep sequentially to be nice to FEC API
  for (const rep of federalReps) {
    try {
      const candidate = await findCandidate(rep);
      if (!candidate) continue;

      const totals = await fetchCandidateTotals(candidate.candidateId, cycle);
      if (!totals) continue;

      // Use the cycle that actually had data for contributors too
      const topContributors = candidate.committeeId
        ? await fetchTopContributors(candidate.committeeId, totals.actual_cycle)
        : [];

      finance[rep.id] = {
        candidate_id: candidate.candidateId,
        candidate_name: totals.candidate_name,
        cycle: totals.actual_cycle,
        total_raised: totals.total_raised,
        individual_contributions: totals.individual_contributions,
        pac_contributions: totals.pac_contributions,
        total_disbursements: totals.total_disbursements,
        cash_on_hand: totals.cash_on_hand,
        debt: totals.debt,
        top_contributors: topContributors,
        rep_id: rep.id,
        rep_name: rep.name,
        fec_url: `https://www.fec.gov/data/candidate/${candidate.candidateId}/`,
      };
    } catch {
      // Skip failed reps
    }
  }

  const payload: RepFinanceResponse = { finance };

  // Cache for 30 days
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: user.id, feed_type: 'finance', data: payload, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json(payload);
}
