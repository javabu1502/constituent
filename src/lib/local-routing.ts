import type { Official } from '@/lib/types';

/**
 * Which LOCAL body should receive a local-level message. Client-safe (no
 * roster import). A pothole should not reach the school board, and a school
 * complaint should not reach the county commission.
 *
 * Uses the `office` label the roster resolver sets ("Washoe County School
 * District Board of Trustees, District A") to classify each official.
 */
export type LocalBodyKind = 'school_district' | 'city' | 'county' | 'other';

export function localBodyKind(official: Official): LocalBodyKind {
  const label = `${official.office ?? ''} ${official.title ?? ''}`;
  if (/school/i.test(label)) return 'school_district';
  if (/\b(city|town|council|mayor|supervisor)\b/i.test(label)) return 'city';
  if (/\bcounty\b|commission/i.test(label)) return 'county';
  return 'other';
}

const SCHOOL_ISSUE = /\b(school|schools|teacher|teachers|student|students|classroom|curriculum|superintendent|principal|trustee|bus route|school bus|graduation|special education|\biep\b)\b/i;
const COUNTY_ISSUE = /\b(county|sheriff|jail|unincorporated|assessor|animal control|landfill|county road|flood control|public health district|library district)\b/i;

/**
 * Keep only the local officials whose body matches the issue: school matters
 * go to the school board; otherwise the city council when the address is in
 * a city, else the county commission; county-specific matters go to the
 * commission even inside a city. Officials from other levels pass through.
 */
export function chooseLocalOfficials(officials: Official[], issueText: string): Official[] {
  const locals = officials.filter((o) => o.level === 'local');
  if (locals.length === 0) return officials;
  const kinds = new Set(locals.map(localBodyKind));
  let want: LocalBodyKind;
  if (SCHOOL_ISSUE.test(issueText) && kinds.has('school_district')) want = 'school_district';
  else if (COUNTY_ISSUE.test(issueText) && kinds.has('county')) want = 'county';
  else if (kinds.has('city')) want = 'city';
  else if (kinds.has('county')) want = 'county';
  else return officials;
  return officials.filter((o) => o.level !== 'local' || localBodyKind(o) === want);
}
