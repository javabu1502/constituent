import { toCSV } from '@/lib/csv';

/**
 * Sign-on letters: many people putting their name to one letter, rather than
 * many people sending one letter each.
 *
 * Congressional offices discount identical form mail, and a staffer handed
 * four hundred names from across the country discards the list. The letter is
 * worth reading when it arrives as "here are the 47 people who signed in your
 * district, with addresses". So the unit of delivery here is an office and
 * its own constituents, not a campaign and its total.
 *
 * Delivery is the organization's own. They email it to a staffer they know.
 * Nothing here goes through CWC, which is per-constituent by design and has
 * no shape for a letter signed by five hundred people.
 */

export interface Signature {
  name: string;
  email: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  congressional_district?: string | null;
  state_upper_district?: string | null;
  state_lower_district?: string | null;
  district_resolved?: boolean | null;
  personal_note?: string | null;
  show_name_publicly?: boolean | null;
}

export type OfficeLevel = 'federal' | 'state_upper' | 'state_lower';

export interface OfficeRoll {
  level: OfficeLevel;
  state: string;
  /** Bare district number as the roster holds it, or null for signers we could not place. */
  district: string | null;
  signers: Signature[];
}

/**
 * The words a signer agrees to, kept in one place so the page, the API and
 * the stored record cannot drift apart about what was promised.
 *
 * Sharing with the lawmaker and the organization is a condition of signing,
 * not a choice, so this states it rather than asking. The one real choice,
 * whether their name appears on the public page, is a separate control and
 * defaults to off.
 */
export function signonConsentText(orgName?: string | null): string {
  const who = orgName?.trim() || 'the organization running this letter';
  return `Your name and address go to your lawmakers with this letter, and to ${who}. That is how an office knows you live in the district.`;
}

const districtFor = (s: Signature, level: OfficeLevel): string | null => {
  const raw =
    level === 'federal' ? s.congressional_district
    : level === 'state_upper' ? s.state_upper_district
    : s.state_lower_district;
  const trimmed = (raw ?? '').trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Signers grouped into the rolls an organization actually sends.
 *
 * Signers whose address could not be placed are returned in their own roll
 * with a null district rather than dropped or guessed into a neighbouring
 * one. They signed, and an organization deciding what to do with them is a
 * better outcome than a staffer being told someone lives somewhere they do
 * not.
 *
 * Sorted by state then district, with unplaced signers last, so the export
 * reads the same way twice.
 */
export function groupByOffice(signatures: Signature[], level: OfficeLevel): OfficeRoll[] {
  const rolls = new Map<string, OfficeRoll>();
  for (const signature of signatures) {
    const state = (signature.state ?? '').trim().toUpperCase();
    const district = districtFor(signature, level);
    const key = `${state}|${district ?? ''}`;
    const existing = rolls.get(key);
    if (existing) existing.signers.push(signature);
    else rolls.set(key, { level, state, district, signers: [signature] });
  }
  return [...rolls.values()].sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    if (a.district === null) return 1;
    if (b.district === null) return -1;
    const na = Number(a.district);
    const nb = Number(b.district);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return a.district.localeCompare(b.district);
  });
}

/**
 * What the public page may show.
 *
 * Only signers who asked for it, and never the street or the email. The
 * address is collected to prove constituency to an office, which is a
 * different audience from everyone who can open the page.
 */
export function publicSignatories(signatures: Signature[]): Array<{ name: string; city: string | null; state: string | null }> {
  return signatures
    .filter((s) => s.show_name_publicly === true)
    .map((s) => ({ name: s.name, city: s.city ?? null, state: s.state ?? null }));
}

/** One office's roll, as the rows an organization pastes under the letter. */
export function rollCsv(roll: OfficeRoll): string {
  return toCSV(
    ['Name', 'Street', 'City', 'State', 'ZIP', 'Email', 'Their own words'],
    roll.signers.map((s) => [
      s.name,
      s.street ?? '',
      s.city ?? '',
      s.state ?? '',
      s.zip ?? '',
      s.email,
      s.personal_note ?? '',
    ]),
  );
}

/** How a roll is named in an export and in a subject line. */
export function rollLabel(roll: OfficeRoll): string {
  if (roll.district === null) return `${roll.state || 'Unknown'}, address not placed`;
  if (roll.level === 'federal') return `${roll.state}-${roll.district}`;
  const chamber = roll.level === 'state_upper' ? 'Senate' : 'House';
  return `${roll.state} State ${chamber} District ${roll.district}`;
}
