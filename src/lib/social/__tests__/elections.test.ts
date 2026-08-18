import { describe, expect, it } from 'vitest';
import { upcomingElections, ELECTIONS_2026 } from '../elections';

describe('upcomingElections', () => {
  it('fires today and tomorrow, silent otherwise', () => {
    expect(upcomingElections(new Date('2026-08-18T15:00:00Z')).map((h) => h.when)).toEqual(['today']);
    expect(upcomingElections(new Date('2026-08-17T15:00:00Z')).map((h) => h.when)).toEqual(['tomorrow']);
    expect(upcomingElections(new Date('2026-08-20T15:00:00Z'))).toEqual([]);
  });
  it('general election day is in the calendar', () => {
    expect(ELECTIONS_2026.some((e) => e.date === '2026-11-03')).toBe(true);
  });
});
