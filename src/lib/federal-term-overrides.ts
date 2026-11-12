/**
 * Term end dates that upstream has not caught up with yet.
 *
 * The roster comes from unitedstates/congress-legislators, which records an
 * appointed senator's term as ending on the date of the special election that
 * fills the seat. It then waits for the successor to be sworn in before
 * publishing anything further. In the gap between those two dates the seat
 * reads as vacant to us, although somebody is sitting in it: an appointed
 * senator serves until their successor is qualified.
 *
 * On 2026-11-12 that gap had been open for nine days and Florida and Ohio
 * each showed one senator instead of two, so nobody in either state could
 * write to the other one at all.
 *
 * Every entry here is a date that is true, not a guess. An override whose end
 * date has passed does nothing, so these expire on their own rather than
 * outliving the problem.
 */
export interface TermEndOverride {
  /** Bioguide id of the senator whose term is mis-stated upstream. */
  end: string;
  /** Why this date, so the next person does not have to re-derive it. */
  reason: string;
}

export const FEDERAL_TERM_END_OVERRIDES: Record<string, TermEndOverride> = {
  // Moody won the 2026-11-03 special election for Rubio's seat and serves the
  // remainder of that term. Upstream still carries the appointment's end date.
  M001244: {
    end: '2029-01-03',
    reason: 'Won the 2026-11-03 Florida special election; serves the remainder of the term',
  },
  // Husted lost to Sherrod Brown on 2026-11-03 and keeps the seat until Brown
  // is sworn in on 2026-12-15. After that this override lapses and Ohio needs
  // a roster refresh to pick Brown up.
  H001104: {
    end: '2026-12-15',
    reason: 'Lost the 2026-11-03 Ohio special election; serves until Brown is sworn in on 2026-12-15',
  },
};

/** Apply the corrections above to a freshly parsed roster, in place. */
export function applyTermEndOverrides(
  legislators: Array<{ id?: { bioguide?: string }; terms?: Array<{ end: string }> }>,
): void {
  for (const legislator of legislators) {
    const override = FEDERAL_TERM_END_OVERRIDES[legislator.id?.bioguide ?? ''];
    if (!override) continue;
    const term = legislator.terms?.[legislator.terms.length - 1];
    // Only ever extends. If upstream has published something later, upstream
    // has caught up and knows better than this file does.
    if (term && override.end > term.end) term.end = override.end;
  }
}
