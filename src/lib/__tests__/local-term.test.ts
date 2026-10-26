import { describe, it, expect } from 'vitest';
import { termHasEnded } from '../local-officials';

/**
 * Three Humboldt County school board seats in the Nevada roster carry
 * termEnd 2024 with live personal email addresses, two of them private.
 * A constituent's story must not be mailed to someone who left in 2024.
 */
describe('termHasEnded', () => {
  const now = new Date('2026-10-25T00:00:00Z');

  it('a bare year in the past has ended', () => {
    expect(termHasEnded(2024, now)).toBe(true);
    expect(termHasEnded('2024', now)).toBe(true);
  });

  it('a bare year still running has not', () => {
    expect(termHasEnded(2026, now)).toBe(false);
    expect(termHasEnded(2028, now)).toBe(false);
  });

  it('handles full dates either side of today', () => {
    expect(termHasEnded('2025-01-05', now)).toBe(true);
    expect(termHasEnded('2027-01-04', now)).toBe(false);
  });

  it('says nothing when there is no term on record', () => {
    expect(termHasEnded(null, now)).toBe(false);
    expect(termHasEnded(undefined, now)).toBe(false);
    expect(termHasEnded('sometime', now)).toBe(false);
  });
});
