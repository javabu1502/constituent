import { describe, it, expect } from 'vitest';
import { parseTalkingPoints, talkingPointCoverage, pointKeyTerms } from '../talking-points';

const TEMPLATE = `- Nevada has lost 1,200 licensed child care slots since 2020.
- The subsidy cliff cuts families off after a raise of a few cents an hour.
- Providers earn less than parking attendants; turnover tops 30% a year.`;

describe('parseTalkingPoints', () => {
  it('splits bullets and numbered lines', () => {
    expect(parseTalkingPoints(TEMPLATE)).toHaveLength(3);
    expect(parseTalkingPoints('1. First point here.\n2) Second point here.')).toEqual(['First point here.', 'Second point here.']);
  });
  it('falls back to sentences for one paragraph', () => {
    const pts = parseTalkingPoints('Slots are vanishing statewide. The cliff punishes raises. Providers cannot stay open.');
    expect(pts).toHaveLength(3);
  });
  it('returns nothing for empty input', () => {
    expect(parseTalkingPoints('')).toEqual([]);
    expect(parseTalkingPoints(null)).toEqual([]);
  });
});

describe('pointKeyTerms', () => {
  it('keeps numbers and distinctive words, drops filler', () => {
    const terms = pointKeyTerms('Nevada has lost 1,200 licensed child care slots since 2020.');
    expect(terms).toContain('1200');
    expect(terms).toContain('licens');
    expect(terms).not.toContain('nevada');
  });
});

describe('talkingPointCoverage', () => {
  const points = parseTalkingPoints(TEMPLATE);
  it('credits a point made in other words when its key ideas appear', () => {
    const body = 'My daughter waited eight months for a spot. Across the state 1,200 licensed slots have disappeared since 2020, so that wait is not unusual. When my wife got a small raise we nearly lost our subsidy, which is the cliff everyone warns about.';
    const { covered, missing } = talkingPointCoverage(body, points);
    expect(covered).toHaveLength(2);
    expect(missing).toHaveLength(1);
    expect(missing[0]).toMatch(/Providers earn/);
  });
  it('credits a point by its number alone', () => {
    const { covered } = talkingPointCoverage('Turnover in this field tops 30% a year.', points);
    expect(covered.some((p) => /parking attendants/.test(p))).toBe(true);
  });
  it('reports everything missing for an unrelated draft', () => {
    const { missing } = talkingPointCoverage('I love my town and I vote every year.', points);
    expect(missing).toHaveLength(3);
  });
});
