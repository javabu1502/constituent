/**
 * States we hold hand-built local rosters for.
 *
 * A literal, not derived from the roster files, because this is imported by
 * the campaign create form and those files are 183KB that would otherwise be
 * shipped to the browser to learn one two-letter code. A test asserts it
 * matches what src/data/local actually contains, so the two cannot drift.
 *
 * Google's Civic Information endpoint shut down in April 2025, so every
 * roster is built by hand and a state appears here only when someone builds
 * it. Offering "local" as a target in a state with no roster ends the flow
 * with nobody to write to, which is worse than not offering it.
 */
export const LOCAL_ROSTER_STATES: readonly string[] = ['NV'];

export function hasLocalRosters(stateCode: string | null | undefined): boolean {
  if (!stateCode) return false;
  return LOCAL_ROSTER_STATES.includes(stateCode.trim().toUpperCase());
}
