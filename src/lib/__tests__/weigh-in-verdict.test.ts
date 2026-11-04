import { describe, it, expect } from 'vitest';
import { verdictFor } from '../../../scripts/audit-weigh-in-freshness';

/**
 * Real latest-action strings from congress.gov. A weigh-in is only retired on
 * a verdict, so a false 'law' silently removes a live question and a missed
 * one leaves an answered question on the page.
 */
describe('reading a verdict from a bill latest action', () => {
  it('recognises an enacted bill', () => {
    expect(verdictFor('Became Public Law No: 119-21.')).toBe('law');
    expect(verdictFor('Signed by President.')).toBe('law');
  });

  it('recognises a veto and a failed vote', () => {
    expect(verdictFor('Vetoed by President.')).toBe('vetoed');
    expect(verdictFor('Failed of passage in Senate by Yea-Nay Vote. 48 - 52.')).toBe('failed');
    expect(verdictFor('Motion to proceed to consideration of measure not agreed to in Senate')).toBe('failed');
  });

  it('leaves a bill still moving alone', () => {
    // These all mean the question is still open, and the weigh-in stays up.
    for (const t of [
      'Passed Senate without amendment by Unanimous Consent.',
      'Referred to the Subcommittee on Health.',
      'Placed on Senate Legislative Calendar under General Orders.',
      'Committee on Finance. Hearings held.',
      'Received in the Senate and Read twice and referred to the Committee on Finance.',
    ]) {
      expect(verdictFor(t), t).toBe('pending');
    }
  });

  it('treats an unknown or missing action as still open rather than resolved', () => {
    expect(verdictFor(null)).toBe('pending');
    expect(verdictFor('')).toBe('pending');
    expect(verdictFor('Something congress.gov has never said before')).toBe('pending');
  });

  it('does not mistake a passed-one-chamber bill for an enacted one', () => {
    // "Passed House" is the single most common way to be half-done; retiring
    // on it would delete the exact questions most worth asking.
    expect(verdictFor('Passed/agreed to in House: On passage Passed by recorded vote: 220 - 207.')).toBe('pending');
  });
});
