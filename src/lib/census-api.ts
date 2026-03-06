import type { DistrictDemographics } from '@/lib/types';

/**
 * State abbreviation → FIPS code mapping.
 */
export const STATE_FIPS: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06',
  CO: '08', CT: '09', DE: '10', FL: '12', GA: '13',
  HI: '15', ID: '16', IL: '17', IN: '18', IA: '19',
  KS: '20', KY: '21', LA: '22', ME: '23', MD: '24',
  MA: '25', MI: '26', MN: '27', MS: '28', MO: '29',
  MT: '30', NE: '31', NV: '32', NH: '33', NJ: '34',
  NM: '35', NY: '36', NC: '37', ND: '38', OH: '39',
  OK: '40', OR: '41', PA: '42', RI: '44', SC: '45',
  SD: '46', TN: '47', TX: '48', UT: '49', VT: '50',
  VA: '51', WA: '53', WV: '54', WI: '55', WY: '56',
  DC: '11',
};

const ACS_BASE = 'https://api.census.gov/data/2022/acs/acs5';
const ACS_YEAR = 2022;

// Variables:
// B01003_001E = total population
// B19013_001E = median household income
// B01002_001E = median age
// B15003_022E = bachelor's degree
// B15003_023E = master's degree
// B15003_024E = professional school degree
// B15003_025E = doctorate degree
// B15003_001E = total education universe (pop 25+)
// B17001_001E = poverty universe
// B17001_002E = below poverty level
const VARIABLES = [
  'B01003_001E',
  'B19013_001E',
  'B01002_001E',
  'B15003_022E',
  'B15003_023E',
  'B15003_024E',
  'B15003_025E',
  'B15003_001E',
  'B17001_001E',
  'B17001_002E',
].join(',');

/**
 * Fetches district demographics from the Census Bureau ACS 5-Year API.
 * @param state Two-letter state code (e.g., "CA")
 * @param district District number as string (e.g., "12"). Use "00" for at-large.
 * @returns Demographics data or null if unavailable
 */
export async function fetchDistrictDemographics(
  state: string,
  district: string
): Promise<DistrictDemographics | null> {
  const fips = STATE_FIPS[state.toUpperCase()];
  if (!fips) return null;

  // Pad district to 2 digits
  const districtPadded = district.padStart(2, '0');

  let url = `${ACS_BASE}?get=${VARIABLES}&for=congressional+district:${districtPadded}&in=state:${fips}`;

  const apiKey = process.env.CENSUS_API_KEY;
  if (apiKey) {
    url += `&key=${apiKey}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data: string[][] = await res.json();
    if (!data || data.length < 2) return null;

    const headers = data[0];
    const values = data[1];

    const get = (varName: string): number => {
      const idx = headers.indexOf(varName);
      if (idx === -1) return 0;
      const val = Number(values[idx]);
      return isNaN(val) || val < 0 ? 0 : val;
    };

    const totalPop = get('B01003_001E');
    const medianIncome = get('B19013_001E');
    const medianAge = get('B01002_001E');
    const bachelors = get('B15003_022E');
    const masters = get('B15003_023E');
    const professional = get('B15003_024E');
    const doctorate = get('B15003_025E');
    const eduTotal = get('B15003_001E');
    const povertyUniverse = get('B17001_001E');
    const belowPoverty = get('B17001_002E');

    const bachelorsPlusPercent = eduTotal > 0
      ? Math.round(((bachelors + masters + professional + doctorate) / eduTotal) * 1000) / 10
      : 0;

    const povertyRate = povertyUniverse > 0
      ? Math.round((belowPoverty / povertyUniverse) * 1000) / 10
      : 0;

    return {
      totalPopulation: totalPop,
      medianIncome,
      medianAge,
      bachelorsPlusPercent,
      povertyRate,
      district: districtPadded,
      state: state.toUpperCase(),
      source: 'U.S. Census Bureau ACS 5-Year Estimates',
      year: ACS_YEAR,
    };
  } catch {
    return null;
  }
}
