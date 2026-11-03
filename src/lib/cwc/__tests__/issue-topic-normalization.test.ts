import { describe, it, expect } from 'vitest';
import { locTopicsForIssueArea } from '../topics';

/**
 * The exact issue_area values production held on 2026-11-03, across 21 real
 * messages. Three of them are the same subject under different names and two
 * differ only in casing, which is why per-issue counts could not be trusted.
 */
const PRODUCTION_VALUES: [issueArea: string, subtopic: string, expected: string][] = [
  ['Abortion', 'Legislation treating abortion as murder under the law, with no exceptions', 'Health'],
  ['Abortion and Fetal Rights', 'Legislation recognizing personhood from conception', 'Health'],
  ['Reproductive Rights & Life', 'Equal legal rights and protections for humans from conception', 'Health'],
  ['Other', 'equal protection bill to abolish abortion', 'Health'],
  ['environment', 'nuclear energy', 'Environmental Protection'],
  ['Families', 'child welfare', 'Families'],
  ['foreign policy', 'aid', 'International Affairs'],
];

describe('issue_area normalization against real production values', () => {
  it('collapses every spelling of one subject onto one topic', () => {
    const abortionish = PRODUCTION_VALUES.filter(([, , topic]) => topic === 'Health');
    const topics = new Set(abortionish.map(([a, s]) => locTopicsForIssueArea(a, undefined, s)[0]));
    expect([...topics]).toEqual(['Health']);
  });

  it('maps each production value to its policy area', () => {
    for (const [area, subtopic, expected] of PRODUCTION_VALUES) {
      expect(locTopicsForIssueArea(area, undefined, subtopic)[0], `${area} / ${subtopic}`).toBe(expected);
    }
  });

  it('reduces the seven production spellings to four real topics', () => {
    const topics = new Set(PRODUCTION_VALUES.map(([a, s]) => locTopicsForIssueArea(a, undefined, s)[0]));
    expect(topics.size).toBe(4);
  });

  it('is case insensitive, so Environment and environment do not split', () => {
    expect(locTopicsForIssueArea('Environment', undefined, '')[0]).toBe(
      locTopicsForIssueArea('environment', undefined, '')[0],
    );
  });
});
