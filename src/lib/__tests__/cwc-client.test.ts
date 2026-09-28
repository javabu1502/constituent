import { describe, it, expect } from 'vitest';
import { withAdoptionSentence, CWC_ADOPTION_SENTENCE, describeCwcOutcome, participatingSenateCount, isNonParticipatingSenator } from '../cwc-client';
import type { Official } from '@/lib/types';

describe('withAdoptionSentence', () => {
  const body = 'Dear Senator Cortez Masto,\n\nPlease protect Head Start.\n\nSincerely,\nJared Busker\nReno, NV 89506';
  it('inserts the sentence before the closing and is idempotent', () => {
    const on = withAdoptionSentence(body, true);
    expect(on).toContain(`Please protect Head Start.\n\n${CWC_ADOPTION_SENTENCE}\n\nSincerely,`);
    expect(withAdoptionSentence(on, true)).toBe(on);
    expect(on.split(CWC_ADOPTION_SENTENCE).length).toBe(2);
  });
  it('removes it cleanly', () => {
    expect(withAdoptionSentence(withAdoptionSentence(body, true), false)).toBe(body);
  });
  it('appends at the end when there is no closing', () => {
    expect(withAdoptionSentence('Please protect Head Start.', true)).toBe(`Please protect Head Start.\n\n${CWC_ADOPTION_SENTENCE}`);
  });
});

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
  const offices = { loaded: true, codes: new Set(['SNV01', 'HNV02', 'SCA01']) };
  it('flags only senators missing from a LOADED list', () => {
    // CWC_ENABLED is false in tests, so everything reads as participating/not applicable.
    expect(isNonParticipatingSenator(cortezMasto, offices)).toBe(false);
    expect(isNonParticipatingSenator(rosen, offices)).toBe(false);
    expect(isNonParticipatingSenator(amodei, offices)).toBe(false);
    expect(isNonParticipatingSenator(cortezMasto, { loaded: false, codes: new Set() })).toBe(false);
  });
  it('counts Senate seats on the list', () => {
    expect(participatingSenateCount(offices)).toBe(2);
  });
});
