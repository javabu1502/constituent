import type { Official, FecContributor } from '@/lib/types';

export const FEC_BASE = 'https://api.open.fec.gov/v1';

export async function fecFetch(path: string, params: Record<string, string>): Promise<Response> {
  const apiKey = process.env.FEC_API_KEY;
  if (!apiKey) throw new Error('FEC_API_KEY not configured');
  const url = new URL(`${FEC_BASE}${path}`);
  url.searchParams.set('api_key', apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
}

export function getCurrentCycle(): number {
  const year = new Date().getFullYear();
  return year % 2 === 0 ? year : year + 1;
}

/**
 * Search FEC for a candidate by name and state.
 * Returns { candidate_id, committee_id } from the search results
 * (principal_committees is embedded in the response, saving a separate call).
 */
export async function findCandidate(rep: Official): Promise<{ candidateId: string; committeeId: string | null } | null> {
  const office = rep.chamber === 'senate' ? 'S' : 'H';
  const lastName = rep.lastName || rep.name.split(' ').pop() || rep.name;

  try {
    const res = await fecFetch('/candidates/search/', {
      q: lastName,
      state: rep.state,
      office: office,
      sort: '-first_file_date',
      per_page: '5',
      is_active_candidate: 'true',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) return null;

    // Try to match by name — FEC uses "LASTNAME, FIRSTNAME MIDDLE" format
    const repNameLower = rep.name.toLowerCase();
    const lastNameLower = lastName.toLowerCase();
    const match = results.find((c: Record<string, unknown>) => {
      const candidateName = ((c.name as string) ?? '').toLowerCase();
      const parts = candidateName.split(',').map((s: string) => s.trim());
      if (parts.length >= 2) {
        // Check if last name matches and first name overlaps
        if (parts[0] === lastNameLower) return true;
        const fecFull = `${parts[1]} ${parts[0]}`;
        return repNameLower.includes(parts[0]) || fecFull.includes(repNameLower) || repNameLower.includes(fecFull);
      }
      return candidateName.includes(repNameLower) || repNameLower.includes(candidateName);
    });

    const chosen = match ?? results[0];
    const candidateId = (chosen.candidate_id as string) ?? null;
    if (!candidateId) return null;

    // Extract principal committee ID from embedded data
    const principalCommittees = (chosen.principal_committees ?? []) as Record<string, unknown>[];
    const committeeId = principalCommittees.length > 0
      ? (principalCommittees[0].committee_id as string) ?? null
      : null;

    return { candidateId, committeeId };
  } catch {
    return null;
  }
}

/**
 * Fetch candidate financial totals. Tries the current cycle first,
 * then falls back to the previous cycle (since current cycle data
 * may not exist yet — FEC filings lag).
 */
export async function fetchCandidateTotals(candidateId: string, cycle: number): Promise<{
  total_raised: number;
  individual_contributions: number;
  pac_contributions: number;
  total_disbursements: number;
  cash_on_hand: number;
  debt: number;
  candidate_name: string;
  actual_cycle: number;
} | null> {
  for (const tryCycle of [cycle, cycle - 2]) {
    try {
      const res = await fecFetch('/candidates/totals/', {
        candidate_id: candidateId,
        cycle: String(tryCycle),
        per_page: '1',
      });
      if (!res.ok) continue;
      const data = await res.json();
      const results = data.results ?? [];
      if (results.length === 0) continue;

      const r = results[0];
      return {
        total_raised: (r.receipts as number) ?? 0,
        individual_contributions: (r.individual_contributions as number) ?? 0,
        pac_contributions: (r.other_political_committee_contributions as number) ?? 0,
        total_disbursements: (r.disbursements as number) ?? 0,
        cash_on_hand: (r.cash_on_hand_end_period as number) ?? (r.last_cash_on_hand_end_period as number) ?? 0,
        debt: (r.debts_owed_by_committee as number) ?? (r.last_debts_owed_by_committee as number) ?? 0,
        candidate_name: (r.candidate_name as string) ?? candidateId,
        actual_cycle: tryCycle,
      };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Fetch top contributors by employer/organization using Schedule A aggregation.
 * Tries current cycle first, falls back to previous.
 */
export async function fetchTopContributors(committeeId: string, cycle: number): Promise<FecContributor[]> {
  for (const tryCycle of [cycle, cycle - 2]) {
    try {
      const res = await fecFetch('/schedules/schedule_a/by_employer/', {
        committee_id: committeeId,
        cycle: String(tryCycle),
        sort: '-total',
        per_page: '50',
      });
      if (!res.ok) continue;
      const data = await res.json();
      const results = data.results ?? [];
      if (results.length === 0) continue;

      return results.map((r: Record<string, unknown>) => ({
        name: (r.employer as string) ?? 'Unknown',
        total: (r.total as number) ?? 0,
        count: (r.count as number) ?? 0,
      }));
    } catch {
      continue;
    }
  }
  return [];
}
