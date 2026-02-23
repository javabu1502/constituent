/**
 * Legislator lookup library using local cached data
 * Data sources:
 * - Federal: https://github.com/unitedstates/congress-legislators
 * - State: https://github.com/openstates/people
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

// Types for the YAML data structures
interface FederalLegislatorId {
  bioguide: string;
  thomas?: string;
  lis?: string;
  govtrack?: number;
  opensecrets?: string;
  votesmart?: number;
  fec?: string[];
  cspan?: number;
  wikipedia?: string;
  house_history?: number;
  ballotpedia?: string;
  maplight?: number;
  icpsr?: number;
  wikidata?: string;
  google_entity_id?: string;
}

interface FederalLegislatorName {
  first: string;
  middle?: string;
  last: string;
  suffix?: string;
  nickname?: string;
  official_full?: string;
}

interface FederalLegislatorTerm {
  type: 'sen' | 'rep';
  start: string;
  end: string;
  state: string;
  district?: number;
  class?: number;
  party: string;
  url?: string;
  address?: string;
  phone?: string;
  fax?: string;
  contact_form?: string;
  office?: string;
  state_rank?: 'junior' | 'senior';
  rss_url?: string;
  caucus?: string;
}

interface FederalLegislatorBio {
  birthday?: string;
  gender?: string;
  religion?: string;
}

interface FederalLegislator {
  id: FederalLegislatorId;
  name: FederalLegislatorName;
  bio?: FederalLegislatorBio;
  terms: FederalLegislatorTerm[];
}

interface FederalSocialMedia {
  id: {
    bioguide: string;
    govtrack?: number;
  };
  social?: {
    twitter?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };
}

// OpenStates person structure (YAML format from openstates/people repo)
interface OpenStatesRole {
  type: 'upper' | 'lower';
  district: string;
  jurisdiction: string;
  start_date?: string;
  end_date?: string;
}

interface OpenStatesOffice {
  classification: string;
  address?: string;
  voice?: string;
  fax?: string;
}

interface OpenStatesPerson {
  id: string;
  name: string;
  given_name?: string;
  family_name?: string;
  gender?: string;
  email?: string;
  image?: string;
  party?: Array<{ name: string }>;
  roles?: OpenStatesRole[];
  offices?: OpenStatesOffice[];
  links?: Array<{ url: string }>;
}

// Output types
export interface Official {
  id: string;
  name: string;
  lastName?: string;
  stafferFirstName?: string;
  stafferLastName?: string;
  title: string;
  level: 'federal' | 'state';
  chamber: 'senate' | 'house' | 'upper' | 'lower';
  party: string;
  state: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactForm?: string;
  photoUrl?: string;
  office?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

export interface LookupResult {
  officials: Official[];
  address: {
    state: string;
    stateCode: string;
    congressionalDistrict?: string;
    stateUpperDistrict?: string;
    stateLowerDistrict?: string;
  };
}

// Staff email entry from LegiStorm CSV
interface StaffEmailEntry {
  email: string;
  stafferFirstName: string;
  stafferLastName: string;
}

// Cache for loaded data
let federalLegislatorsCache: FederalLegislator[] | null = null;
let federalSocialMediaCache: Map<string, FederalSocialMedia> | null = null;
const stateLegislatorsCache: Map<string, OpenStatesPerson[]> = new Map();
let staffEmailCache: Map<string, StaffEmailEntry> | null = null;

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'legislators');

/**
 * Parse a single CSV line, handling quoted fields (e.g. "Cortez Masto")
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Normalize a member name for lookup: lowercase, strip non-alpha characters
 */
function normalizeMemberName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * Load staff emails from LegiStorm CSV.
 * Builds a lookup map:
 *   Senate: sen_{STATE}_{normalizedLastName}
 *   House: rep_{STATE}_{district}
 * First match per key wins.
 */
function loadStaffEmails(): Map<string, StaffEmailEntry> {
  if (staffEmailCache) return staffEmailCache;

  staffEmailCache = new Map();

  const filePath = path.join(DATA_DIR, 'staff-emails.csv');
  if (!fs.existsSync(filePath)) {
    return staffEmailCache;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);

    const stafferFirstName = fields[2]?.trim();  // FirstName
    const stafferLastName = fields[3]?.trim();    // LastName
    const memberLastName = fields[10]?.trim();    // MemberLastName
    const state = fields[12]?.trim();             // Congressional State
    const district = fields[13]?.trim();          // Congressional District
    const chamber = fields[14]?.trim();           // Chamber
    const email = fields[21]?.trim();             // Email

    if (!email || !state) continue;

    let key: string;
    if (chamber === 'Senate Member') {
      if (!memberLastName) continue;
      key = `sen_${state}_${normalizeMemberName(memberLastName)}`;
    } else {
      // House Member
      key = `rep_${state}_${district}`;
    }

    // First match per key wins
    if (!staffEmailCache.has(key)) {
      staffEmailCache.set(key, {
        email,
        stafferFirstName: stafferFirstName || '',
        stafferLastName: stafferLastName || '',
      });
    }
  }

  return staffEmailCache;
}

/**
 * Look up a verified staff email from the LegiStorm CSV, falling back to
 * auto-generated House emails. Returns the email and optional staffer name.
 *
 * Senate: CSV lookup only (no auto-generated fallback).
 * House: CSV lookup first, then fallback to firstname.lastname@mail.house.gov.
 *
 * At-large fix: YAML uses district 0 for at-large, CSV uses 1.
 * If exact key misses for House, retry with the alternate.
 */
function getFederalEmailInfo(
  legislator: FederalLegislator,
  term: FederalLegislatorTerm
): { email?: string; stafferFirstName?: string; stafferLastName?: string } {
  const staffEmails = loadStaffEmails();
  const state = term.state;

  if (term.type === 'sen') {
    // Senate lookup by state + normalized last name
    const key = `sen_${state}_${normalizeMemberName(legislator.name.last)}`;
    const entry = staffEmails.get(key);
    if (entry) {
      return {
        email: entry.email,
        stafferFirstName: entry.stafferFirstName,
        stafferLastName: entry.stafferLastName,
      };
    }
    return {};
  }

  // House lookup by state + district
  const district = term.district ?? 0;
  const key = `rep_${state}_${district}`;
  let entry = staffEmails.get(key);

  // At-large fix: try alternate district (0 <-> 1)
  if (!entry) {
    const altDistrict = district === 0 ? 1 : district === 1 ? 0 : null;
    if (altDistrict !== null) {
      entry = staffEmails.get(`rep_${state}_${altDistrict}`);
    }
  }

  if (entry) {
    return {
      email: entry.email,
      stafferFirstName: entry.stafferFirstName,
      stafferLastName: entry.stafferLastName,
    };
  }

  // Fallback: auto-generated House email
  const firstName = legislator.name.first.toLowerCase().replace(/[^a-z]/g, '');
  const lastName = legislator.name.last.toLowerCase().replace(/[^a-z]/g, '');
  return { email: `${firstName}.${lastName}@mail.house.gov` };
}

/**
 * Load federal legislators from YAML file
 */
function loadFederalLegislators(): FederalLegislator[] {
  if (federalLegislatorsCache) return federalLegislatorsCache;

  const filePath = path.join(DATA_DIR, 'federal', 'legislators-current.yaml');

  if (!fs.existsSync(filePath)) {
    console.warn('Federal legislators file not found:', filePath);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  federalLegislatorsCache = yaml.parse(content) as FederalLegislator[];

  return federalLegislatorsCache;
}

/**
 * Load federal social media data
 */
function loadFederalSocialMedia(): Map<string, FederalSocialMedia> {
  if (federalSocialMediaCache) return federalSocialMediaCache;

  const filePath = path.join(DATA_DIR, 'federal', 'legislators-social-media.yaml');
  federalSocialMediaCache = new Map();

  if (!fs.existsSync(filePath)) {
    return federalSocialMediaCache;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = yaml.parse(content) as FederalSocialMedia[];

  for (const item of data) {
    federalSocialMediaCache.set(item.id.bioguide, item);
  }

  return federalSocialMediaCache;
}

/**
 * Load state legislators for a given state
 * Reads YAML files from data/{state}/legislature/
 */
function loadStateLegislators(stateCode: string): OpenStatesPerson[] {
  const code = stateCode.toLowerCase();

  if (stateLegislatorsCache.has(code)) {
    return stateLegislatorsCache.get(code)!;
  }

  const legislatureDir = path.join(DATA_DIR, 'states', code, 'legislature');
  const legislators: OpenStatesPerson[] = [];

  if (!fs.existsSync(legislatureDir)) {
    // Silently return empty if no data - state data is optional
    stateLegislatorsCache.set(code, legislators);
    return legislators;
  }

  const files = fs.readdirSync(legislatureDir);

  for (const file of files) {
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      try {
        const content = fs.readFileSync(path.join(legislatureDir, file), 'utf-8');
        const person = yaml.parse(content) as OpenStatesPerson;

        // Only include legislators with current roles
        if (person.roles && person.roles.length > 0) {
          legislators.push(person);
        }
      } catch {
        // Skip invalid files
      }
    }
  }

  stateLegislatorsCache.set(code, legislators);
  return legislators;
}

/**
 * Get the current term for a federal legislator
 */
function getCurrentTerm(legislator: FederalLegislator): FederalLegislatorTerm | null {
  const today = new Date().toISOString().split('T')[0];

  // Find the most recent term that hasn't ended
  const currentTerms = legislator.terms.filter(term => term.end >= today);

  if (currentTerms.length === 0) {
    return null;
  }

  // Sort by start date descending and return the most recent
  return currentTerms.sort((a, b) => b.start.localeCompare(a.start))[0];
}

/**
 * Convert federal legislator to Official
 */
function federalToOfficial(
  legislator: FederalLegislator,
  term: FederalLegislatorTerm,
  socialMedia?: FederalSocialMedia
): Official {
  const name = legislator.name.official_full ||
    `${legislator.name.first} ${legislator.name.last}${legislator.name.suffix ? ` ${legislator.name.suffix}` : ''}`;

  const title = term.type === 'sen'
    ? `U.S. Senator (${term.state_rank || 'Class ' + term.class})`
    : `U.S. Representative (${term.state}-${term.district})`;

  // Look up verified staff email (or fallback to auto-generated)
  const emailInfo = getFederalEmailInfo(legislator, term);

  return {
    id: legislator.id.bioguide,
    name,
    lastName: legislator.name.last,
    stafferFirstName: emailInfo.stafferFirstName,
    stafferLastName: emailInfo.stafferLastName,
    title,
    level: 'federal',
    chamber: term.type === 'sen' ? 'senate' : 'house',
    party: term.party,
    state: term.state,
    district: term.district?.toString(),
    phone: term.phone,
    email: emailInfo.email,
    website: term.url,
    contactForm: term.contact_form,
    photoUrl: `https://raw.githubusercontent.com/unitedstates/images/gh-pages/congress/225x275/${legislator.id.bioguide}.jpg`,
    office: term.address,
    socialMedia: socialMedia?.social ? {
      twitter: socialMedia.social.twitter,
      facebook: socialMedia.social.facebook,
      instagram: socialMedia.social.instagram,
    } : undefined,
  };
}

/**
 * Get current role from OpenStates person
 */
function getCurrentRole(person: OpenStatesPerson): OpenStatesRole | null {
  if (!person.roles || person.roles.length === 0) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  // Find role that is current (no end_date or end_date >= today)
  for (const role of person.roles) {
    if (!role.end_date || role.end_date >= today) {
      return role;
    }
  }

  // If no explicitly current role, return the first one
  return person.roles[0];
}

/**
 * Convert state legislator to Official
 */
function stateToOfficial(person: OpenStatesPerson, stateCode: string, role: OpenStatesRole): Official {
  const chamber = role.type;
  const chamberName = chamber === 'upper' ? 'Senate' : 'House';
  const title = `State ${chamberName === 'Senate' ? 'Senator' : 'Representative'} (District ${role.district})`;

  // Get party from array
  const party = person.party?.[0]?.name || 'Unknown';

  // Get phone from offices
  let phone: string | undefined;
  if (person.offices) {
    for (const office of person.offices) {
      if (office.voice) {
        phone = office.voice;
        break;
      }
    }
  }

  // Get website from links
  let website: string | undefined;
  if (person.links && person.links.length > 0) {
    website = person.links[0].url;
  }

  return {
    id: person.id,
    name: person.name,
    title,
    level: 'state',
    chamber,
    party,
    state: stateCode.toUpperCase(),
    district: role.district,
    phone,
    email: person.email,
    website,
    photoUrl: person.image,
  };
}

/**
 * Find federal senators for a state
 */
export function findSenators(stateCode: string): Official[] {
  const legislators = loadFederalLegislators();
  const socialMedia = loadFederalSocialMedia();
  const state = stateCode.toUpperCase();

  const senators: Official[] = [];

  for (const legislator of legislators) {
    const term = getCurrentTerm(legislator);
    if (term && term.type === 'sen' && term.state === state) {
      senators.push(federalToOfficial(
        legislator,
        term,
        socialMedia.get(legislator.id.bioguide)
      ));
    }
  }

  return senators;
}

/**
 * Find federal representative for a state and district
 */
export function findRepresentative(stateCode: string, district: number | string): Official | null {
  const legislators = loadFederalLegislators();
  const socialMedia = loadFederalSocialMedia();
  const state = stateCode.toUpperCase();
  const districtNum = typeof district === 'string' ? parseInt(district, 10) : district;

  for (const legislator of legislators) {
    const term = getCurrentTerm(legislator);
    if (term && term.type === 'rep' && term.state === state && term.district === districtNum) {
      return federalToOfficial(
        legislator,
        term,
        socialMedia.get(legislator.id.bioguide)
      );
    }
  }

  return null;
}

/**
 * Find state senator for a district
 */
export function findStateSenator(stateCode: string, district: string): Official | null {
  const legislators = loadStateLegislators(stateCode);

  for (const person of legislators) {
    const role = getCurrentRole(person);
    if (role && role.type === 'upper' && role.district === district) {
      return stateToOfficial(person, stateCode, role);
    }
  }

  return null;
}

/**
 * Find state representative for a district
 */
export function findStateRepresentative(stateCode: string, district: string): Official | null {
  const legislators = loadStateLegislators(stateCode);

  for (const person of legislators) {
    const role = getCurrentRole(person);
    if (role && role.type === 'lower' && role.district === district) {
      return stateToOfficial(person, stateCode, role);
    }
  }

  return null;
}

/**
 * Find all federal House representatives for a state, sorted by district
 */
export function findAllRepresentatives(stateCode: string): Official[] {
  const legislators = loadFederalLegislators();
  const socialMedia = loadFederalSocialMedia();
  const state = stateCode.toUpperCase();

  const reps: Official[] = [];

  for (const legislator of legislators) {
    const term = getCurrentTerm(legislator);
    if (term && term.type === 'rep' && term.state === state) {
      reps.push(federalToOfficial(
        legislator,
        term,
        socialMedia.get(legislator.id.bioguide)
      ));
    }
  }

  // Sort by district number
  reps.sort((a, b) => {
    const da = parseInt(a.district || '0', 10);
    const db = parseInt(b.district || '0', 10);
    return da - db;
  });

  return reps;
}

/**
 * Find all state legislators for a state (for listing purposes)
 */
export function findAllStateLegislators(stateCode: string): Official[] {
  const legislators = loadStateLegislators(stateCode);
  const officials: Official[] = [];

  for (const person of legislators) {
    const role = getCurrentRole(person);
    if (role) {
      officials.push(stateToOfficial(person, stateCode, role));
    }
  }

  return officials;
}

/**
 * Get all officials for a location
 * Requires: state code, congressional district, and state legislative districts
 */
export function getOfficialsForLocation(
  stateCode: string,
  congressionalDistrict: number | string,
  stateUpperDistrict?: string,
  stateLowerDistrict?: string
): Official[] {
  const officials: Official[] = [];

  // Federal senators (2)
  const senators = findSenators(stateCode);
  officials.push(...senators);

  // Federal representative (1)
  const rep = findRepresentative(stateCode, congressionalDistrict);
  if (rep) {
    officials.push(rep);
  }

  // State senator (1)
  if (stateUpperDistrict) {
    const stateSenator = findStateSenator(stateCode, stateUpperDistrict);
    if (stateSenator) {
      officials.push(stateSenator);
    }
  }

  // State representative (1)
  if (stateLowerDistrict) {
    const stateRep = findStateRepresentative(stateCode, stateLowerDistrict);
    if (stateRep) {
      officials.push(stateRep);
    }
  }

  return officials;
}

/**
 * Check if legislator data is available
 */
export function isDataAvailable(): boolean {
  const federalPath = path.join(DATA_DIR, 'federal', 'legislators-current.yaml');
  return fs.existsSync(federalPath);
}

/**
 * Get metadata about the cached data
 */
export function getDataMetadata(): { lastUpdated: string; sources: Record<string, string> } | null {
  const metadataPath = path.join(DATA_DIR, 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  const content = fs.readFileSync(metadataPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Clear the in-memory cache (useful for testing or refreshing data)
 */
export function clearCache(): void {
  federalLegislatorsCache = null;
  federalSocialMediaCache = null;
  stateLegislatorsCache.clear();
  staffEmailCache = null;
}
