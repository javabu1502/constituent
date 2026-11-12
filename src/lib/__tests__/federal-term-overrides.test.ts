import { describe, it, expect } from 'vitest';
import { applyTermEndOverrides, FEDERAL_TERM_END_OVERRIDES } from '../federal-term-overrides';
import { findSenators } from '../legislators';

describe('federal term end overrides', () => {
  it('extends a term upstream ended too early', () => {
    const roster = [{ id: { bioguide: 'M001244' }, terms: [{ end: '2026-11-03' }] }];
    applyTermEndOverrides(roster);
    expect(roster[0].terms[0].end).toBe('2029-01-03');
  });

  // Upstream catching up must win. Otherwise this file quietly pins a seat to
  // a date that stopped being true.
  it('never shortens a term upstream has already moved past', () => {
    const roster = [{ id: { bioguide: 'M001244' }, terms: [{ end: '2031-01-03' }] }];
    applyTermEndOverrides(roster);
    expect(roster[0].terms[0].end).toBe('2031-01-03');
  });

  it('leaves everyone else alone', () => {
    const roster = [{ id: { bioguide: 'S001217' }, terms: [{ end: '2026-11-03' }] }];
    applyTermEndOverrides(roster);
    expect(roster[0].terms[0].end).toBe('2026-11-03');
  });

  it('survives a record with no terms or no id', () => {
    expect(() => applyTermEndOverrides([{ id: { bioguide: 'M001244' }, terms: [] }, {}])).not.toThrow();
  });

  // Every entry is a real date for a real reason, not a guess.
  it('documents why each override exists', () => {
    for (const [id, o] of Object.entries(FEDERAL_TERM_END_OVERRIDES)) {
      expect(id, 'bioguide id').toMatch(/^[A-Z]\d{6}$/);
      expect(o.end, `${id} end`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(o.reason.length, `${id} reason`).toBeGreaterThan(20);
    }
  });
});

/**
 * Florida and Ohio each showed one senator for nine days in November 2026,
 * and nothing said so. This is the check that would have said so.
 */
describe('senate coverage', () => {
  const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

  it('seats two senators in every state', () => {
    const short = STATES.map((s) => [s, findSenators(s).length] as const).filter(([, n]) => n !== 2);
    expect(short, `states not at 2: ${short.map(([s, n]) => `${s}:${n}`).join(', ')}`).toEqual([]);
  });

  it('seats 100 in total', () => {
    expect(STATES.reduce((n, s) => n + findSenators(s).length, 0)).toBe(100);
  });
});
