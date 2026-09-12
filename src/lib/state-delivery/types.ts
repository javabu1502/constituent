/**
 * State legislator email delivery — types.
 *
 * There is no CWC-equivalent for state legislatures, so delivery is authenticated
 * email sent from our domain ON BEHALF of the constituent (Reply-To the
 * constituent), with a webform fallback for the ~2% without an email. This is
 * the paid advocacy-org delivery path; it is STAGED and not wired into any live
 * flow yet. See GO-CHECKLIST.md.
 */

export interface StateConstituent {
  firstName: string;
  lastName: string;
  email: string; // becomes Reply-To so the office can respond to the real person
  city?: string;
  state: string; // 2-letter
  zip?: string;
}

export interface StateLegislatorTarget {
  name: string;
  /** Chamber label for the salutation (e.g. "State Senator", "Representative"). */
  title: string;
  /** Published email, if we have one (Open States or the enrichment override). */
  email?: string | null;
  /** Contact webform, used only when there is no email. */
  webformUrl?: string | null;
  state: string;
}

export interface StateDeliveryInput {
  constituent: StateConstituent;
  target: StateLegislatorTarget;
  subject: string;
  /** Two-block model: the org's fixed position (optional) + the constituent's
   *  own words. At least one must be present. */
  organizationStatement?: string;
  constituentMessage?: string;
  /** Disclosed sponsoring org name, shown in the on-behalf-of framing. */
  organizationName?: string;
}
