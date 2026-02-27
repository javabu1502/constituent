import type { LocalOfficial, JurisdictionLevel } from './types';

const CIVIC_API_BASE = 'https://www.googleapis.com/civicinfo/v2/representatives';

// OCD division level patterns we consider "local"
const LOCAL_LEVELS = new Set([
  'locality',
  'administrativeArea2', // county
  'subLocality1',
  'subLocality2',
  'regional',
  'special',
]);

// Levels to exclude (we already have federal + state from other sources)
const EXCLUDED_LEVELS = new Set(['country', 'administrativeArea1']);

interface CivicOffice {
  name: string;
  divisionId: string;
  levels?: string[];
  officialIndices: number[];
}

interface CivicOfficial {
  name: string;
  party?: string;
  phones?: string[];
  emails?: string[];
  urls?: string[];
  photoUrl?: string;
  channels?: { type: string; id: string }[];
  address?: { line1?: string; city?: string; state?: string; zip?: string }[];
}

interface CivicApiResponse {
  offices: CivicOffice[];
  officials: CivicOfficial[];
  divisions: Record<string, { name: string }>;
}

function normalizeParty(raw?: string): string {
  if (!raw || raw === 'Unknown') return 'Nonpartisan';
  return raw
    .replace(/ Party$/, '')
    .replace(/^Nonpartisan$/, 'Nonpartisan');
}

function deriveJurisdictionLevel(divisionId: string): JurisdictionLevel {
  if (/\/county:/.test(divisionId)) return 'county';
  if (/\/place:/.test(divisionId)) return 'city';
  if (/\/school_district:/.test(divisionId)) return 'school_district';
  if (/\/special_district:/.test(divisionId) || /\/ward:/.test(divisionId)) return 'special_district';
  return 'other';
}

function deriveJurisdiction(divisionId: string, divisionName: string): string {
  // Use the division name from the API (e.g. "Cook County", "City of Springfield")
  return divisionName || divisionId;
}

function generateId(divisionId: string, name: string): string {
  // Deterministic ID from division + name for stable deep-links
  const raw = `${divisionId}::${name}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // 32-bit int
  }
  return `local-${Math.abs(hash).toString(36)}`;
}

function extractSocialMedia(channels?: { type: string; id: string }[]): {
  twitter?: string;
  facebook?: string;
  instagram?: string;
} | undefined {
  if (!channels || channels.length === 0) return undefined;
  const social: Record<string, string> = {};
  for (const ch of channels) {
    const type = ch.type.toLowerCase();
    if (type === 'twitter') social.twitter = ch.id;
    else if (type === 'facebook') social.facebook = ch.id;
    else if (type === 'instagram') social.instagram = ch.id;
  }
  return Object.keys(social).length > 0 ? social : undefined;
}

function isLocalOffice(office: CivicOffice): boolean {
  const levels = office.levels || [];
  // Exclude if any level is federal or state
  if (levels.some((l) => EXCLUDED_LEVELS.has(l))) return false;
  // Include if any level is local
  if (levels.some((l) => LOCAL_LEVELS.has(l))) return true;
  // If no levels specified, check divisionId patterns for local indicators
  if (levels.length === 0) {
    return /\/(place|county|school_district|special_district|ward|borough|township):/.test(
      office.divisionId
    );
  }
  return false;
}

export async function fetchLocalOfficials(address: string): Promise<LocalOfficial[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
  }

  const url = `${CIVIC_API_BASE}?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      // No data for this address
      return [];
    }
    const body = await res.text();
    throw new Error(`Civic API error ${res.status}: ${body}`);
  }

  const data: CivicApiResponse = await res.json();

  if (!data.offices || !data.officials) {
    return [];
  }

  const results: LocalOfficial[] = [];

  for (const office of data.offices) {
    if (!isLocalOffice(office)) continue;

    const divisionName = data.divisions?.[office.divisionId]?.name || '';
    const jurisdictionLevel = deriveJurisdictionLevel(office.divisionId);
    const jurisdiction = deriveJurisdiction(office.divisionId, divisionName);

    for (const idx of office.officialIndices) {
      const official = data.officials[idx];
      if (!official) continue;

      const id = generateId(office.divisionId, official.name);
      const party = normalizeParty(official.party);
      const socialMedia = extractSocialMedia(official.channels);

      // Extract state from address if available
      const officialState = official.address?.[0]?.state || '';

      results.push({
        id,
        name: official.name,
        title: office.name,
        level: 'local',
        party,
        state: officialState,
        phone: official.phones?.[0],
        email: official.emails?.[0],
        website: official.urls?.[0],
        photoUrl: official.photoUrl,
        socialMedia,
        officeName: office.name,
        divisionId: office.divisionId,
        jurisdiction,
        jurisdictionLevel,
      });
    }
  }

  return results;
}
