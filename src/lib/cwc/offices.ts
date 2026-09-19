import type { Official } from '@/lib/types';
import { CWC_STATE_CODES } from './constants';

/**
 * Resolving a constituent's message to the CORRECT office code is the highest-
 * risk step in CWC: George was explicit that sending to an office the person
 * isn't represented by is the fastest way to lose office trust (and offices
 * can't spend taxpayer money replying to non-constituents). So this module
 * never guesses — it returns an explicit failure rather than a wrong code.
 *
 * Office codes belong to the SEAT, not the person, and are static:
 *   Senate: S + state + class    e.g. SNY01 (NY Class I seat)
 *   House:  H + state + district e.g. HNY12 (NY 12th district), at-large = 00
 */

// Static Senate seat codes by state — two per state. Source: SCWC Requirements
// & Standards packet office list; validated to exactly two codes per state.
// These do NOT change when a senator changes (the code is the seat).
export const SENATE_SEAT_CODES: Readonly<Record<string, readonly [string, string]>> = {
  AK: ['SAK02', 'SAK03'], AL: ['SAL02', 'SAL03'], AR: ['SAR02', 'SAR03'],
  AZ: ['SAZ01', 'SAZ03'], CA: ['SCA01', 'SCA03'], CO: ['SCO02', 'SCO03'],
  CT: ['SCT01', 'SCT03'], DE: ['SDE01', 'SDE02'], FL: ['SFL01', 'SFL03'],
  GA: ['SGA02', 'SGA03'], HI: ['SHI01', 'SHI03'], IA: ['SIA02', 'SIA03'],
  ID: ['SID02', 'SID03'], IL: ['SIL02', 'SIL03'], IN: ['SIN01', 'SIN03'],
  KS: ['SKS02', 'SKS03'], KY: ['SKY02', 'SKY03'], LA: ['SLA02', 'SLA03'],
  MA: ['SMA01', 'SMA02'], MD: ['SMD01', 'SMD03'], ME: ['SME01', 'SME02'],
  MI: ['SMI01', 'SMI02'], MN: ['SMN01', 'SMN02'], MO: ['SMO01', 'SMO03'],
  MS: ['SMS01', 'SMS02'], MT: ['SMT01', 'SMT02'], NC: ['SNC02', 'SNC03'],
  ND: ['SND01', 'SND03'], NE: ['SNE01', 'SNE02'], NH: ['SNH02', 'SNH03'],
  NJ: ['SNJ01', 'SNJ02'], NM: ['SNM01', 'SNM02'], NV: ['SNV01', 'SNV03'],
  NY: ['SNY01', 'SNY03'], OH: ['SOH01', 'SOH03'], OK: ['SOK02', 'SOK03'],
  OR: ['SOR02', 'SOR03'], PA: ['SPA01', 'SPA03'], RI: ['SRI01', 'SRI02'],
  SC: ['SSC02', 'SSC03'], SD: ['SSD02', 'SSD03'], TN: ['STN01', 'STN02'],
  TX: ['STX01', 'STX02'], UT: ['SUT01', 'SUT03'], VA: ['SVA01', 'SVA02'],
  VT: ['SVT01', 'SVT03'], WA: ['SWA01', 'SWA03'], WI: ['SWI01', 'SWI03'],
  WV: ['SWV01', 'SWV02'], WY: ['SWY01', 'SWY02'],
};

/**
 * The 100 Senate office codes, flattened — this IS the SCWC test-environment
 * office list. Per the SOAPBox Technical Information page (acceptance
 * requirements), the testing endpoint accepts ALL 100 Member offices (messages
 * stay in the SAA sandbox), and acceptance testing must exercise every one.
 * Production participation is voluntary and MUST come from Get Active Offices
 * instead — never from this list.
 */
export const SENATE_TEST_OFFICE_CODES: readonly string[] = Object.values(SENATE_SEAT_CODES)
  .flat()
  .sort();

export type OfficeResolution =
  | { ok: true; code: string }
  | { ok: false; reason: string };

/** House seat code from a state + district. At-large / single-district → 00. */
export function houseOfficeCode(state: string, district: string | number | undefined): OfficeResolution {
  const st = state?.toUpperCase();
  if (!CWC_STATE_CODES.has(st)) return { ok: false, reason: `unknown state "${state}"` };
  // Extract the numeric district; absent/"At-Large" means the state's single
  // seat, which CWC encodes as 00.
  const digits = district === undefined ? '' : String(district).match(/\d+/)?.[0] ?? '';
  const dd = digits === '' ? '00' : digits.padStart(2, '0');
  if (dd.length !== 2) return { ok: false, reason: `district "${district}" out of range` };
  // American Samoa's House office code is AQ00, not AS00 — the House remapped it
  // to avoid a clash with the Armed Services (AS) committee name. The
  // constituent's StateAbbreviation stays "AS"; only the office code changes.
  const officeSt = st === 'AS' ? 'AQ' : st;
  return { ok: true, code: `H${officeSt}${dd}` };
}

/** Senate seat code from a state + senate class (1/2/3). Cross-checked against
 *  the static seat table so a bad class can't produce a valid-looking code. */
export function senateOfficeCode(state: string, senateClass: number | undefined): OfficeResolution {
  const st = state?.toUpperCase();
  const seats = SENATE_SEAT_CODES[st];
  if (!seats) return { ok: false, reason: `no Senate seats for state "${state}"` };
  if (senateClass === undefined || ![1, 2, 3].includes(senateClass)) {
    return { ok: false, reason: `missing/invalid senate class for ${st} (got ${senateClass})` };
  }
  const code = `S${st}0${senateClass}`;
  if (!seats.includes(code)) {
    return { ok: false, reason: `class ${senateClass} is not a seat in ${st} (seats: ${seats.join(', ')})` };
  }
  return { ok: true, code };
}

/** Both Senate seat codes for a state (e.g. to message "both my senators"). */
export function senateSeatCodesForState(state: string): readonly string[] | null {
  return SENATE_SEAT_CODES[state?.toUpperCase()] ?? null;
}

/**
 * Resolve one of the app's federal officials to its CWC office code. Returns an
 * explicit failure for anything we can't map with certainty — state/local
 * officials, or a senator whose class we don't have — so callers must handle it
 * rather than silently send to the wrong office.
 */
export function resolveOfficeCode(official: Official): OfficeResolution {
  if (official.level !== 'federal') {
    return { ok: false, reason: `official "${official.name}" is ${official.level}, not federal (no CWC office)` };
  }
  if (official.chamber === 'senate') return senateOfficeCode(official.state, official.senateClass);
  if (official.chamber === 'house') return houseOfficeCode(official.state, official.district);
  return { ok: false, reason: `official "${official.name}" has no federal chamber` };
}

const OFFICE_CODE_PATTERN = { senate: /^S[A-Z]{2}0[1-3]$/, house: /^H[A-Z]{2}\d{2}$/ } as const;

export function isValidOfficeCode(code: string, chamber: 'senate' | 'house'): boolean {
  return OFFICE_CODE_PATTERN[chamber].test(code);
}
