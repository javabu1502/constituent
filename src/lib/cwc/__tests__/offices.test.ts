import { describe, it, expect } from 'vitest';
import {
  houseOfficeCode,
  senateOfficeCode,
  senateSeatCodesForState,
  resolveOfficeCode,
  isValidOfficeCode,
  SENATE_SEAT_CODES,
} from '../offices';
import type { Official } from '@/lib/types';

const official = (o: Partial<Official>): Official => ({
  id: 'x', name: 'Test', title: 'Senator', level: 'federal', party: 'D', state: 'NY', ...o,
});

describe('houseOfficeCode', () => {
  it('formats state + district, zero-padded', () => {
    expect(houseOfficeCode('NY', '12')).toEqual({ ok: true, code: 'HNY12' });
    expect(houseOfficeCode('ca', 3)).toEqual({ ok: true, code: 'HCA03' });
  });
  it('treats at-large / missing district as 00', () => {
    expect(houseOfficeCode('AK', undefined)).toEqual({ ok: true, code: 'HAK00' });
    expect(houseOfficeCode('WY', 'At-Large')).toEqual({ ok: true, code: 'HWY00' });
  });
  it('parses a district embedded like NY-12', () => {
    expect(houseOfficeCode('NY', 'NY-12')).toEqual({ ok: true, code: 'HNY12' });
  });
  it('remaps American Samoa to the AQ00 office code (not HAS00)', () => {
    expect(houseOfficeCode('AS', undefined)).toEqual({ ok: true, code: 'HAQ00' });
  });
  it('rejects an unknown state', () => {
    const r = houseOfficeCode('ZZ', '1');
    expect(r.ok).toBe(false);
  });
});

describe('senateOfficeCode', () => {
  it('builds the seat code from state + class and validates it exists', () => {
    expect(senateOfficeCode('NY', 1)).toEqual({ ok: true, code: 'SNY01' });
    expect(senateOfficeCode('NY', 3)).toEqual({ ok: true, code: 'SNY03' });
  });
  it('refuses a class that is not a seat in that state', () => {
    // NY seats are class 1 and 3; class 2 does not exist there.
    const r = senateOfficeCode('NY', 2);
    expect(r.ok).toBe(false);
  });
  it('refuses a missing class rather than guessing', () => {
    expect(senateOfficeCode('NY', undefined).ok).toBe(false);
  });
});

describe('resolveOfficeCode', () => {
  it('resolves a senator via senate class', () => {
    expect(resolveOfficeCode(official({ chamber: 'senate', state: 'NY', senateClass: 1 }))).toEqual({
      ok: true,
      code: 'SNY01',
    });
  });
  it('resolves a House member via district', () => {
    expect(
      resolveOfficeCode(official({ chamber: 'house', state: 'CA', district: '48', title: 'Rep' })),
    ).toEqual({ ok: true, code: 'HCA48' });
  });
  it('refuses non-federal officials instead of guessing', () => {
    expect(resolveOfficeCode(official({ level: 'state', chamber: 'upper' })).ok).toBe(false);
    expect(resolveOfficeCode(official({ level: 'local' })).ok).toBe(false);
  });
  it('refuses a senator with no class rather than mis-route', () => {
    expect(resolveOfficeCode(official({ chamber: 'senate', state: 'NY' })).ok).toBe(false);
  });
});

describe('SENATE_SEAT_CODES table', () => {
  it('covers all 50 states with exactly two seats each', () => {
    const states = Object.keys(SENATE_SEAT_CODES);
    expect(states).toHaveLength(50);
    for (const s of states) {
      expect(SENATE_SEAT_CODES[s]).toHaveLength(2);
      for (const code of SENATE_SEAT_CODES[s]) expect(isValidOfficeCode(code, 'senate')).toBe(true);
    }
  });
  it('senateSeatCodesForState returns both seats', () => {
    expect(senateSeatCodesForState('NY')).toEqual(['SNY01', 'SNY03']);
    expect(senateSeatCodesForState('ZZ')).toBeNull();
  });
});
