import { describe, it, expect } from 'vitest';
import { describeCwcOutcome, participatingSenateCount, isNonParticipatingSenator } from '../cwc-client';
import type { Official } from '@/lib/types';

describe('describeCwcOutcome', () => {
  it('queued and held read as sent; blocked / skipped / errors fail with a note', () => {
    expect(describeCwcOutcome({ ok: true, cwc: { status: 'queued' } }).state).toBe('sent');
    expect(describeCwcOutcome({ ok: true, cwc: { status: 'held' } }).state).toBe('sent');
    expect(describeCwcOutcome({ ok: true, cwc: { status: 'blocked' } })).toMatchObject({ state: 'failed' });
    expect(describeCwcOutcome({ ok: true, cwc: { status: 'skipped', reason: 'advocate name has no last name' } }).note).toMatch(/last name/);
    expect(describeCwcOutcome({ ok: false, error: 'You already contacted this official on Monday.' }).note).toMatch(/already contacted/);
    expect(describeCwcOutcome(undefined).state).toBe('failed');
  });
});

describe('non-participating senator detection', () => {
  const rosen = { id: 'R000608', name: 'Jacky Rosen', level: 'federal', chamber: 'senate', state: 'NV', senateClass: 1 } as unknown as Official;
  const cortezMasto = { id: 'C001113', name: 'Catherine Cortez Masto', level: 'federal', chamber: 'senate', state: 'NV', senateClass: 3 } as unknown as Official;
  const amodei = { id: 'A000369', name: 'Mark Amodei', level: 'federal', chamber: 'house', state: 'NV', district: '2' } as unknown as Official;
  const offices = { loaded: true, codes: new Set(['SNV01', 'HNV02', 'SCA01']), webformIds: new Set<string>() };
  it('flags only senators missing from a LOADED list', () => {
    // CWC_ENABLED is false in tests, so everything reads as participating/not applicable.
    expect(isNonParticipatingSenator(cortezMasto, offices)).toBe(false);
    expect(isNonParticipatingSenator(rosen, offices)).toBe(false);
    expect(isNonParticipatingSenator(amodei, offices)).toBe(false);
    expect(isNonParticipatingSenator(cortezMasto, { loaded: false, codes: new Set(), webformIds: new Set() })).toBe(false);
  });
  it('counts Senate seats on the list', () => {
    expect(participatingSenateCount(offices)).toBe(2);
  });
});
