/**
 * Election calendar signals. The desk had no source for election dates — the
 * one election-reminder ever posted came from a hand-inserted signal, so
 * election days pass silently (2026-08-18 AK/FL/WY primaries, caught by
 * Jared). Static verified table; scoutElections emits a score-10 editorial
 * signal the day before and the day of, which outranks the news stream.
 *
 * ONLY add dates verified against state election-office sources — a wrong
 * date posted publicly is worse than silence.
 */
import { createAdminClient } from '@/lib/supabase';

export interface ElectionDate {
  date: string; // YYYY-MM-DD
  label: string;
  states: string[];
}

export const ELECTIONS_2026: ElectionDate[] = [
  { date: '2026-08-18', label: 'primary elections', states: ['Alaska', 'Florida', 'Wyoming'] },
  { date: '2026-09-08', label: 'primary elections', states: ['New Hampshire', 'Rhode Island'] },
  {
    date: '2026-11-03',
    label: 'the general election — every U.S. House seat, 35 Senate seats, 36 governorships, and state ballot questions (Nevada votes on Questions 6 and 7)',
    states: ['every state'],
  },
];

/** Days with an election today or tomorrow, relative to `now` (UTC-day math
 * is fine: reminders fire on the US calendar day either way). */
export function upcomingElections(now: Date, calendar: ElectionDate[] = ELECTIONS_2026): { when: 'today' | 'tomorrow'; election: ElectionDate }[] {
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const today = day(now);
  const tomorrow = day(new Date(now.getTime() + 24 * 60 * 60_000));
  const out: { when: 'today' | 'tomorrow'; election: ElectionDate }[] = [];
  for (const e of calendar) {
    if (e.date === today) out.push({ when: 'today', election: e });
    else if (e.date === tomorrow) out.push({ when: 'tomorrow', election: e });
  }
  return out;
}

/** Insert election-reminder signals (score 10 beats all news in the picker).
 * external_ref dedupes: one signal per election per when-bucket. */
export async function scoutElections(now: Date = new Date()): Promise<number> {
  const hits = upcomingElections(now);
  if (hits.length === 0) return 0;
  const admin = createAdminClient();
  const rows = hits.map(({ when, election }) => ({
    source: 'editorial',
    external_ref: `election-${election.date}-${when}`,
    title: `Election ${when}: ${election.states.join(', ')}`,
    summary:
      when === 'today'
        ? `Polls are open TODAY (${election.date}) for ${election.label} in ${election.states.join(', ')}. Remind people to vote and to check their polling place and hours.`
        : `Tomorrow (${election.date}) is ${election.label} in ${election.states.join(', ')}. Remind people to vote and to check their polling place and hours.`,
    url: 'https://www.vote.org/polling-place-locator/',
    issue_area: 'Elections and Voting',
    classification: 'actionable',
    campaign_slug: null,
    score: 10,
    status: 'new',
    metadata: {},
  }));
  const refs = rows.map((r) => r.external_ref);
  const { data: existing } = await admin.from('social_signals').select('external_ref').in('external_ref', refs);
  const have = new Set((existing ?? []).map((r) => r.external_ref));
  const fresh = rows.filter((r) => !have.has(r.external_ref));
  if (fresh.length === 0) return 0;
  const { error } = await admin.from('social_signals').insert(fresh);
  return error ? 0 : fresh.length;
}
