import { geocodeAddress } from '@/lib/geocode';
import type { Official } from '@/lib/types';
import { houseOfficeCode, resolveOfficeCode } from './offices';

/**
 * Verify a constituent is actually represented by the office they're about to
 * message — George's cardinal rule ("never send to an office the person isn't
 * represented by"). We RE-geocode the full street address and require it to
 * produce the SAME seat code as the intended target. If a cached/stale rep, a
 * changed address, or a bad selection makes them diverge, we refuse.
 *
 * The result is structured so callers choose their own strictness:
 *   - CWC delivery path: HARD-BLOCK on any `ok: false`.
 *   - Existing production (mailto/webform): WARN and let the user re-confirm
 *     their address (a typo is the likeliest cause), since those channels are
 *     lower-stakes than the official CWC pipe.
 */
export type VerifyReason =
  | 'NOT_FEDERAL' // state/local official — no CWC office
  | 'GEOCODE_FAILED' // couldn't geocode the address at all
  | 'STATE_MISMATCH' // senator: address state ≠ seat state
  | 'DISTRICT_MISMATCH' // house: address district ≠ target district
  | 'UNRESOLVED'; // couldn't derive a district from the geocode

export type VerifyResult =
  | { ok: true; officeCode: string }
  | { ok: false; reason: VerifyReason; detail: string };

export interface ConstituentAddress {
  street: string;
  city: string;
  state: string;
  zip?: string;
}

export async function verifyConstituent(
  address: ConstituentAddress,
  official: Official,
): Promise<VerifyResult> {
  // The intended target must itself resolve to a federal seat code.
  const target = resolveOfficeCode(official);
  if (!target.ok) return { ok: false, reason: 'NOT_FEDERAL', detail: target.reason };

  const geo = await geocodeAddress(address.street, address.city, address.state, address.zip);
  if ('error' in geo) {
    return { ok: false, reason: 'GEOCODE_FAILED', detail: geo.error };
  }

  // Senators represent the whole state — the state must match.
  if (official.chamber === 'senate') {
    if (geo.stateCode.toUpperCase() !== official.state.toUpperCase()) {
      return {
        ok: false,
        reason: 'STATE_MISMATCH',
        detail: `address is in ${geo.stateCode}, but ${official.name} represents ${official.state}`,
      };
    }
    return { ok: true, officeCode: target.code };
  }

  // House: the district the address geocodes to must produce the same seat code
  // as the target. This also catches an unresolved district ("0" against a
  // numbered target) as a mismatch, so we never fall back to a guess.
  const fromGeo = houseOfficeCode(geo.stateCode, geo.congressionalDistrict);
  if (!fromGeo.ok) {
    return { ok: false, reason: 'UNRESOLVED', detail: fromGeo.reason };
  }
  if (fromGeo.code !== target.code) {
    return {
      ok: false,
      reason: 'DISTRICT_MISMATCH',
      detail: `address maps to ${fromGeo.code}, but the message targets ${target.code}`,
    };
  }
  return { ok: true, officeCode: target.code };
}
