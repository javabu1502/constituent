import { describe, expect, it } from 'vitest';
import { locTopicsForIssueArea } from '../topics';
import { LOC_TOPIC_SET } from '../constants';

// Every distinct issue_area value in production as of 2026-08-16. New values
// added to campaigns should be added here — the mapper must never emit an
// invalid topic for anything real.
const PROD_VALUES = [
  'Families & Children', 'civil rights', 'healthcare', 'Education', 'labor',
  'economy', 'foreign policy', 'guns', 'Science, Technology, Communications',
  'education', 'technology', 'Health', 'environment',
  'Technology and Online Safety', 'Finance and Financial Sector',
  'Elections and Voting', 'Economics and Public Finance', 'taxation', 'Energy',
  'Families', 'Agriculture and Food', 'Crime and Law Enforcement',
  'infrastructure', 'veterans', 'Transportation and Public Works',
  'Armed Forces and National Security', 'Immigration',
  'Government Operations and Politics', 'Commerce', 'Social Welfare',
];

describe('locTopicsForIssueArea', () => {
  it('maps every production issue_area to a valid LoC topic', () => {
    for (const v of PROD_VALUES) {
      const topics = locTopicsForIssueArea(v);
      expect(topics.length, v).toBeGreaterThan(0);
      for (const t of topics) expect(LOC_TOPIC_SET.has(t), `${v} -> ${t}`).toBe(true);
    }
  });
  it('passes exact LoC names through unchanged', () => {
    expect(locTopicsForIssueArea('Health')).toEqual(['Health']);
  });
  it('normalizes legacy lowercase names', () => {
    expect(locTopicsForIssueArea('guns')).toEqual(['Crime and Law Enforcement']);
    expect(locTopicsForIssueArea('foreign policy')).toEqual(['International Affairs']);
  });
  it('falls back via keywords, then to Government Operations', () => {
    expect(locTopicsForIssueArea('School Meals Access')).toEqual(['Education']);
    expect(locTopicsForIssueArea('zzz nothing', 'zzz')).toEqual(['Government Operations and Politics']);
    expect(locTopicsForIssueArea(null)).toEqual(['Government Operations and Politics']);
  });
});
