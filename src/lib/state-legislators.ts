/**
 * State Legislator Lookup
 *
 * Fetches state legislator data from the OpenStates GitHub repository
 * and provides lookup by district.
 *
 * Data source: https://github.com/openstates/people
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import type { Official } from './types';

// Cache directory for downloaded state data
const CACHE_DIR = path.join(process.cwd(), 'src', 'data', 'states');

// In-memory cache
const stateDataCache = new Map<string, StateLegislator[]>();

/**
 * Raw legislator data from OpenStates YAML
 */
interface OpenStatesLegislator {
  id: string;
  name: string;
  given_name?: string;
  family_name?: string;
  gender?: string;
  email?: string;
  image?: string;
  party?: Array<{ name: string }>;
  roles?: Array<{
    type: 'upper' | 'lower';
    district: string;
    start_date?: string;
    end_date?: string;
    jurisdiction?: string;
  }>;
  offices?: Array<{
    classification: string;
    address?: string;
    voice?: string;
  }>;
  links?: Array<{
    url: string;
    note?: string;
  }>;
}

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

/**
 * Get the GitHub API URL for a state's legislature directory
 */
function getGitHubApiUrl(stateCode: string): string {
  return `https://api.github.com/repos/openstates/people/contents/data/${stateCode.toLowerCase()}/legislature`;
}

/**
 * Get the cache file path for a state
 */
function getCacheFilePath(stateCode: string): string {
  return path.join(CACHE_DIR, `${stateCode.toUpperCase()}.json`);
}

/**
 * Check if cache is fresh (less than 24 hours old)
 */
function isCacheFresh(cacheFile: string): boolean {
  try {
    const stats = fs.statSync(cacheFile);
    const ageMs = Date.now() - stats.mtimeMs;
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
    return ageMs < maxAgeMs;
  } catch {
    return false;
  }
}

/**
 * Load cached state data from disk
 */
function loadFromCache(stateCode: string): StateLegislator[] | null {
  const cacheFile = getCacheFilePath(stateCode);

  if (!isCacheFresh(cacheFile)) {
    return null;
  }

  try {
    const data = fs.readFileSync(cacheFile, 'utf-8');
    return JSON.parse(data) as StateLegislator[];
  } catch {
    return null;
  }
}

/**
 * Save state data to cache
 */
function saveToCache(stateCode: string, legislators: StateLegislator[]): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const cacheFile = getCacheFilePath(stateCode);
    fs.writeFileSync(cacheFile, JSON.stringify(legislators, null, 2));
  } catch (error) {
    console.error(`Failed to save cache for ${stateCode}:`, error);
  }
}

/**
 * Parse OpenStates YAML into our format
 */
function parseOpenStatesYaml(yamlContent: string): StateLegislator | null {
  try {
    const data = parseYaml(yamlContent) as OpenStatesLegislator;

    // Find current role (no end_date or end_date in future)
    const currentRole = data.roles?.find((role) => {
      if (role.end_date) {
        return new Date(role.end_date) > new Date();
      }
      return true;
    });

    if (!currentRole) {
      return null; // No current role
    }

    // Get phone from offices
    const capitolOffice = data.offices?.find((o) => o.classification === 'capitol');
    const districtOffice = data.offices?.find((o) => o.classification === 'district');
    const phone = capitolOffice?.voice || districtOffice?.voice;
    const office = capitolOffice?.address || districtOffice?.address;

    // Get website from links
    const homepage = data.links?.find((l) => l.note === 'homepage');
    const website = homepage?.url || data.links?.[0]?.url;

    return {
      id: data.id,
      name: data.name,
      firstName: data.given_name,
      lastName: data.family_name,
      chamber: currentRole.type,
      district: currentRole.district,
      party: data.party?.[0]?.name || 'Unknown',
      email: data.email,
      phone,
      photoUrl: data.image,
      website,
      office,
    };
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    return null;
  }
}

/**
 * Fetch state legislator data from GitHub
 */
async function fetchStateData(stateCode: string): Promise<StateLegislator[]> {
  const apiUrl = getGitHubApiUrl(stateCode);

  try {
    // Get list of files
    const listResponse = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Constituent-App',
      },
    });

    if (!listResponse.ok) {
      if (listResponse.status === 404) {
        console.log(`No data available for state: ${stateCode}`);
        return [];
      }
      throw new Error(`GitHub API error: ${listResponse.status}`);
    }

    const files = (await listResponse.json()) as Array<{
      name: string;
      download_url: string;
    }>;

    // Download each YAML file
    const legislators: StateLegislator[] = [];

    for (const file of files) {
      if (!file.name.endsWith('.yml')) continue;

      try {
        const yamlResponse = await fetch(file.download_url);
        if (!yamlResponse.ok) continue;

        const yamlContent = await yamlResponse.text();
        const legislator = parseOpenStatesYaml(yamlContent);

        if (legislator) {
          legislators.push(legislator);
        }
      } catch {
        // Skip individual file errors
      }
    }

    return legislators;
  } catch (error) {
    console.error(`Failed to fetch state data for ${stateCode}:`, error);
    return [];
  }
}

/**
 * Get state legislators for a state (with caching)
 */
async function getStateLegislators(stateCode: string): Promise<StateLegislator[]> {
  const code = stateCode.toUpperCase();

  // Check in-memory cache first
  if (stateDataCache.has(code)) {
    return stateDataCache.get(code)!;
  }

  // Check disk cache
  const cached = loadFromCache(code);
  if (cached) {
    stateDataCache.set(code, cached);
    return cached;
  }

  // Fetch from GitHub
  console.log(`Fetching state legislator data for ${code}...`);
  const legislators = await fetchStateData(code);

  // Cache results
  if (legislators.length > 0) {
    stateDataCache.set(code, legislators);
    saveToCache(code, legislators);
    console.log(`Cached ${legislators.length} legislators for ${code}`);
  }

  return legislators;
}

/**
 * Convert StateLegislator to Official type
 */
function toOfficial(leg: StateLegislator, stateCode: string): Official {
  const chamberTitle =
    leg.chamber === 'upper' ? 'State Senator' : 'State Representative';

  return {
    id: leg.id,
    name: leg.name,
    lastName: leg.lastName,
    title: `${chamberTitle}, District ${leg.district}`,
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
 * Normalize district number (strip leading zeros)
 */
function normalizeDistrict(district: string): string {
  // Remove leading zeros but keep at least one digit
  return district.replace(/^0+/, '') || '0';
}

/**
 * Find the state senator for a given district
 */
export async function findStateSenator(
  stateCode: string,
  district: string
): Promise<Official | null> {
  const legislators = await getStateLegislators(stateCode);
  const normalizedDistrict = normalizeDistrict(district);

  const senator = legislators.find(
    (leg) => leg.chamber === 'upper' && normalizeDistrict(leg.district) === normalizedDistrict
  );

  return senator ? toOfficial(senator, stateCode) : null;
}

/**
 * Find the state representative for a given district
 */
export async function findStateRep(
  stateCode: string,
  district: string
): Promise<Official | null> {
  const legislators = await getStateLegislators(stateCode);
  const normalizedDistrict = normalizeDistrict(district);

  const rep = legislators.find(
    (leg) => leg.chamber === 'lower' && normalizeDistrict(leg.district) === normalizedDistrict
  );

  return rep ? toOfficial(rep, stateCode) : null;
}

/**
 * Find both state legislators (senator and rep) for a location
 */
export async function findStateLegislators(
  stateCode: string,
  upperDistrict: string | null,
  lowerDistrict: string | null
): Promise<Official[]> {
  const results: Official[] = [];

  if (upperDistrict) {
    const senator = await findStateSenator(stateCode, upperDistrict);
    if (senator) results.push(senator);
  }

  if (lowerDistrict) {
    const rep = await findStateRep(stateCode, lowerDistrict);
    if (rep) results.push(rep);
  }

  return results;
}

/**
 * Preload state data (call at startup for frequently used states)
 */
export async function preloadStateData(stateCodes: string[]): Promise<void> {
  await Promise.all(stateCodes.map(getStateLegislators));
}
