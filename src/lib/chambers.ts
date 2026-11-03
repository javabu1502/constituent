/**
 * What each state calls its lower chamber, and what it calls the people in it.
 *
 * Client-safe on purpose: src/lib/state-legislators.ts reads the roster off
 * disk with `fs`, so anything a browser component needs has to live here or
 * the whole module gets pulled into the bundle.
 *
 * The title is not cosmetic. salutationTitle() reads it, so a Nevada
 * Assemblymember labelled "State Representative" is also greeted as "Dear
 * Representative" in the letter the office receives. Wisconsin is
 * deliberately absent; its Assembly members are styled "Representative".
 */
export const LOWER_CHAMBER_TITLE: Record<string, string> = {
  CA: 'Assemblymember',
  NV: 'Assemblymember',
  NY: 'Assemblymember',
  NJ: 'Assemblymember',
  MD: 'Delegate',
  VA: 'Delegate',
  WV: 'Delegate',
};

/** The chamber's own name, for district labels ("Assembly 24"). */
export function lowerChamberName(stateCode: string): string {
  const title = LOWER_CHAMBER_TITLE[stateCode.toUpperCase()];
  if (title === 'Assemblymember') return 'Assembly';
  if (title === 'Delegate') return 'House of Delegates';
  return 'State House';
}
