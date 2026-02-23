/**
 * Geocoding utilities to determine districts from addresses
 * Uses free Census Geocoder API for address-to-district lookup
 */

export interface GeocodedAddress {
  street: string;
  city: string;
  state: string;
  stateCode: string;
  zip: string;
  congressionalDistrict: string;
  stateUpperDistrict?: string;
  stateLowerDistrict?: string;
  latitude?: number;
  longitude?: number;
}

export interface GeocodeError {
  error: string;
  code: 'INVALID_ADDRESS' | 'NO_MATCH' | 'API_ERROR' | 'RATE_LIMITED';
}

// State name to code mapping
const STATE_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  'puerto rico': 'PR', 'guam': 'GU', 'virgin islands': 'VI',
  'american samoa': 'AS', 'northern mariana islands': 'MP'
};

// State code to name mapping
const STATE_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [code, name])
);

/**
 * Parse state from string (handles both full names and abbreviations)
 */
function parseState(state: string): { name: string; code: string } | null {
  const normalized = state.trim().toLowerCase();

  // Check if it's already a code
  const upperCode = state.trim().toUpperCase();
  if (STATE_CODE_TO_NAME[upperCode]) {
    return {
      code: upperCode,
      name: STATE_CODE_TO_NAME[upperCode]
    };
  }

  // Check if it's a full name
  if (STATE_NAME_TO_CODE[normalized]) {
    return {
      code: STATE_NAME_TO_CODE[normalized],
      name: normalized
    };
  }

  return null;
}

/**
 * Census Geocoder API response types
 */
interface CensusGeocodeMatch {
  matchedAddress: string;
  coordinates: {
    x: number; // longitude
    y: number; // latitude
  };
  addressComponents: {
    streetName: string;
    city: string;
    state: string;
    zip: string;
  };
  geographies?: {
    // The Census API uses different key names depending on the current Congress
    // e.g., "119th Congressional Districts" or "118th Congressional Districts"
    [key: string]: Array<{
      // Congressional district fields
      CD119?: string;
      CD118?: string;
      CDSESSN?: string;
      // State legislative fields
      SLDU?: string;
      SLDL?: string;
      // Common fields
      BASENAME?: string;
      STATE?: string;
      COUNTY?: string;
      GEOID?: string;
    }>;
  };
}

interface CensusGeocodeResponse {
  result: {
    input: {
      address: {
        street: string;
        city: string;
        state: string;
        zip: string;
      };
    };
    addressMatches: CensusGeocodeMatch[];
  };
}

/**
 * Geocode an address using Census Bureau Geocoder
 * This is free and doesn't require an API key
 *
 * @param street - Street address (e.g., "123 Main St")
 * @param city - City name
 * @param state - State name or abbreviation
 * @param zip - ZIP code (optional but recommended)
 */
export async function geocodeAddress(
  street: string,
  city: string,
  state: string,
  zip?: string
): Promise<GeocodedAddress | GeocodeError> {
  const stateInfo = parseState(state);

  if (!stateInfo) {
    return { error: 'Invalid state', code: 'INVALID_ADDRESS' };
  }

  // Build the Census Geocoder URL
  // Using the onelineaddress endpoint with benchmark=Public_AR_Current and vintage=Current_Current
  const params = new URLSearchParams({
    street: street,
    city: city,
    state: stateInfo.code,
    benchmark: 'Public_AR_Current',
    vintage: 'Current_Current',
    layers: 'all',
    format: 'json'
  });

  if (zip) {
    params.set('zip', zip);
  }

  const url = `https://geocoding.geo.census.gov/geocoder/geographies/address?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { error: 'Rate limited, please try again', code: 'RATE_LIMITED' };
      }
      return { error: 'Geocoding service error', code: 'API_ERROR' };
    }

    const data = await response.json() as CensusGeocodeResponse;

    if (!data.result?.addressMatches?.length) {
      return { error: 'Address not found. Please check and try again.', code: 'NO_MATCH' };
    }

    const match = data.result.addressMatches[0];
    const geographies = match.geographies || {};

    // Find congressional district - look for keys containing "Congressional"
    let congressionalDistrict = '0';
    for (const key of Object.keys(geographies)) {
      if (key.toLowerCase().includes('congressional')) {
        const cdInfo = geographies[key]?.[0];
        // Try various field names for the district number
        congressionalDistrict = cdInfo?.CD119 || cdInfo?.CD118 || cdInfo?.BASENAME || '0';
        // BASENAME might be "Delegate District (at Large)" for DC, extract number
        if (congressionalDistrict && /^\d+$/.test(congressionalDistrict)) {
          break;
        }
        // For at-large districts (like DC, WY, VT), use "0" or "1"
        if (cdInfo?.BASENAME?.includes('at Large')) {
          congressionalDistrict = '0'; // At-large district
          break;
        }
      }
    }

    // Find state legislative districts
    let stateUpperDistrict: string | undefined;
    let stateLowerDistrict: string | undefined;

    for (const key of Object.keys(geographies)) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes('state legislative') && keyLower.includes('upper')) {
        const upperInfo = geographies[key]?.[0];
        // Prefer BASENAME (district name) over SLDU (numeric FIPS code)
        // so named districts like "3rd Suffolk" are preserved
        stateUpperDistrict = upperInfo?.BASENAME || upperInfo?.SLDU;
      }
      if (keyLower.includes('state legislative') && keyLower.includes('lower')) {
        const lowerInfo = geographies[key]?.[0];
        // Prefer BASENAME (district name) over SLDL (numeric FIPS code)
        stateLowerDistrict = lowerInfo?.BASENAME || lowerInfo?.SLDL;
      }
    }

    return {
      street: match.addressComponents.streetName || street,
      city: match.addressComponents.city || city,
      state: stateInfo.name,
      stateCode: stateInfo.code,
      zip: match.addressComponents.zip || zip || '',
      congressionalDistrict,
      stateUpperDistrict,
      stateLowerDistrict,
      latitude: match.coordinates.y,
      longitude: match.coordinates.x
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return { error: 'Failed to geocode address', code: 'API_ERROR' };
  }
}

/**
 * Parse a full address string into components
 * Handles formats like:
 * - "123 Main St, City, State 12345"
 * - "123 Main St, City, ST 12345"
 * - "123 Main St\nCity, State 12345"
 */
export function parseAddressString(fullAddress: string): {
  street: string;
  city: string;
  state: string;
  zip: string;
} | null {
  // Normalize line breaks and multiple spaces
  const normalized = fullAddress
    .replace(/\n/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split by comma
  const parts = normalized.split(',').map(p => p.trim());

  if (parts.length < 2) {
    return null;
  }

  const street = parts[0];

  // The last part should contain state and possibly zip
  const lastPart = parts[parts.length - 1];

  // Try to extract state and zip from last part
  // Format: "State 12345" or "ST 12345" or just "State"
  const stateZipMatch = lastPart.match(/^([A-Za-z\s]+?)(?:\s+(\d{5}(?:-\d{4})?))?$/);

  if (!stateZipMatch) {
    return null;
  }

  const state = stateZipMatch[1].trim();
  const zip = stateZipMatch[2] || '';

  // City is everything between street and state/zip
  const city = parts.length > 2
    ? parts.slice(1, -1).join(', ')
    : '';

  // Validate state
  const stateInfo = parseState(state);
  if (!stateInfo) {
    return null;
  }

  return {
    street,
    city,
    state: stateInfo.code,
    zip
  };
}

/**
 * Get state code from state name or code
 */
export function getStateCode(state: string): string | null {
  const info = parseState(state);
  return info?.code || null;
}

/**
 * Get state name from state code
 */
export function getStateName(code: string): string | null {
  return STATE_CODE_TO_NAME[code.toUpperCase()] || null;
}
