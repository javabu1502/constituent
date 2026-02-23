/**
 * State Legislator Lookup
 *
 * Reads pre-cached state legislator data (JSON files produced by
 * `npm run refresh-states`) and provides lookup by district.
 *
 * Handles both numeric districts ("5") and named districts
 * ("3rd Suffolk", "Chittenden-15", "Rockingham 30").
 *
 * Data source: https://github.com/openstates/people
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Official } from './types';

// Cache directory for state data (populated by scripts/refresh-state-data.ts)
const CACHE_DIR = path.join(process.cwd(), 'src', 'data', 'states');

// In-memory cache
const stateDataCache = new Map<string, StateLegislator[]>();

/**
 * Processed state legislator data
 */
interface StateLegislator {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  chamber: 'upper' | 'lower';
  district: string;
  party: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  website?: string;
  office?: string;
}

// Map ordinal words to numeric ordinals for district normalization.
// Covers up to 25th which exceeds any US state legislative district ordinal.
const ORDINAL_WORDS: Record<string, string> = {
  first: '1st',
  second: '2nd',
  third: '3rd',
  fourth: '4th',
  fifth: '5th',
  sixth: '6th',
  seventh: '7th',
  eighth: '8th',
  ninth: '9th',
  tenth: '10th',
  eleventh: '11th',
  twelfth: '12th',
  thirteenth: '13th',
  fourteenth: '14th',
  fifteenth: '15th',
  sixteenth: '16th',
  seventeenth: '17th',
  eighteenth: '18th',
  nineteenth: '19th',
  twentieth: '20th',
  'twenty-first': '21st',
  'twenty-second': '22nd',
  'twenty-third': '23rd',
  'twenty-fourth': '24th',
  'twenty-fifth': '25th',
};

/**
 * Normalize a district identifier for comparison.
 *
 * Handles:
 *  - Leading zeros on numeric districts ("001" → "1")
 *  - Case insensitivity ("3RD SUFFOLK" → "3rd suffolk")
 *  - Hyphens vs spaces ("Chittenden-15" → "chittenden 15")
 *  - Ordinal words ("First Middlesex" → "1st middlesex")
 */
function normalizeDistrict(district: string): string {
  let d = district.trim().toLowerCase();

  // Replace hyphens with spaces for consistent comparison
  d = d.replace(/-/g, ' ');

  // Collapse multiple spaces
  d = d.replace(/\s+/g, ' ');

  // Convert ordinal words to numeric ordinals
  for (const [word, num] of Object.entries(ORDINAL_WORDS)) {
    // word may contain hyphens (already converted to spaces above)
    const pattern = word.replace(/-/g, ' ');
    d = d.replace(new RegExp(`\\b${pattern}\\b`, 'g'), num);
  }

  // For purely numeric strings, strip leading zeros
  if (/^\d+$/.test(d)) {
    d = d.replace(/^0+/, '') || '0';
  }

  return d;
}

/**
 * Load cached state data from disk
 */
function loadFromCache(stateCode: string): StateLegislator[] | null {
  const cacheFile = path.join(CACHE_DIR, `${stateCode.toUpperCase()}.json`);

  try {
    const data = fs.readFileSync(cacheFile, 'utf-8');
    return JSON.parse(data) as StateLegislator[];
  } catch {
    return null;
  }
}

/**
 * Get state legislators for a state (from cache)
 */
function getStateLegislators(stateCode: string): StateLegislator[] {
  const code = stateCode.toUpperCase();

  // Check in-memory cache first
  if (stateDataCache.has(code)) {
    return stateDataCache.get(code)!;
  }

  // Load from disk cache
  const cached = loadFromCache(code);
  if (cached) {
    stateDataCache.set(code, cached);
    return cached;
  }

  console.warn(
    `No cached data for ${code}. Run "npm run refresh-states" to download state legislator data.`
  );
  return [];
}

/**
 * Convert StateLegislator to Official type
 */
function toOfficial(leg: StateLegislator, stateCode: string): Official {
  const chamberTitle =
    leg.chamber === 'upper' ? 'State Senator' : 'State Representative';

  // Use "District N" for numeric districts, bare name for named districts
  const isNumeric = /^\d+$/.test(leg.district);
  const districtLabel = isNumeric
    ? `District ${leg.district}`
    : leg.district;

  return {
    id: leg.id,
    name: leg.name,
    lastName: leg.lastName,
    title: `${chamberTitle}, ${districtLabel}`,
    level: 'state',
    chamber: leg.chamber,
    party: leg.party,
    state: stateCode.toUpperCase(),
    district: leg.district,
    phone: leg.phone,
    email: leg.email,
    website: leg.website,
    photoUrl: leg.photoUrl,
    office: leg.office,
  };
}

/**
 * Find the state senator for a given district
 */
export function findStateSenator(
  stateCode: string,
  district: string
): Official | null {
  const legislators = getStateLegislators(stateCode);
  const target = normalizeDistrict(district);

  const senator = legislators.find(
    (leg) =>
      leg.chamber === 'upper' && normalizeDistrict(leg.district) === target
  );

  return senator ? toOfficial(senator, stateCode) : null;
}

/**
 * Find the state representative for a given district
 */
export function findStateRep(
  stateCode: string,
  district: string
): Official | null {
  const legislators = getStateLegislators(stateCode);
  const target = normalizeDistrict(district);

  const rep = legislators.find(
    (leg) =>
      leg.chamber === 'lower' && normalizeDistrict(leg.district) === target
  );

  return rep ? toOfficial(rep, stateCode) : null;
}

/**
 * Find both state legislators (senator and rep) for a location
 */
export function findStateLegislators(
  stateCode: string,
  upperDistrict: string | null,
  lowerDistrict: string | null
): Official[] {
  const results: Official[] = [];

  if (upperDistrict) {
    const senator = findStateSenator(stateCode, upperDistrict);
    if (senator) results.push(senator);
  }

  if (lowerDistrict) {
    const rep = findStateRep(stateCode, lowerDistrict);
    if (rep) results.push(rep);
  }

  return results;
}
