import { describe, it, expect } from 'vitest';
import { constituentEmailCopy } from '../notify';
import { offJurisdictionLevel } from '@/lib/issue-jurisdiction';

const ref = (heldFor?: 'state' | 'local' | null) =>
  ({ channel: 'cwc' as const, officialName: 'Darin LaHood', heldFor });

/**
 * A message held because Congress does not decide the matter is not waiting
 * on a delivery. It used to be told one was coming anyway, and to sit still:
 * "You do not need to do anything. We will email you when it is delivered."
 * The constituent whose village board demolition request prompted this got
 * exactly that.
 */
describe('what a held message tells the constituent', () => {
  it('names the state legislature, and where to write', () => {
    const { html } = constituentEmailCopy(ref('state'), 'held');
    expect(html).toContain('state legislature');
    expect(html).toContain('/contact');
    expect(html).not.toContain('You do not need to do anything');
    expect(html).not.toContain('when it is delivered');
  });

  it('is honest that local is not supported, and points somewhere real', () => {
    const { html } = constituentEmailCopy(ref('local'), 'held');
    expect(html).toContain('local government');
    expect(html).toContain('village board');
    expect(html).toContain('do not yet help you contact local officials');
    expect(html).toContain('usa.gov/local-governments');
    expect(html).not.toContain('You do not need to do anything');
  });

  // An ordinary federal hold is still a real review, so that copy is unchanged.
  it('leaves a federal hold saying what it always said', () => {
    const { html } = constituentEmailCopy(ref(null), 'held');
    expect(html).toContain('You do not need to do anything');
    expect(html).toContain('We will email you when it is delivered');
  });
});

describe('picking the level a held message belongs to', () => {
  it('reads the village board case that prompted this', () => {
    expect(offJurisdictionLevel('Please reverse the village board decision to demolish the old mill.')).toBe('local');
  });

  it('reads a state matter as state', () => {
    expect(offJurisdictionLevel('Please support AB 156 in the state legislature.')).toBe('state');
  });

  // A mixed message is the reviewer's call, not this function's.
  it('stays quiet when there is any federal signal', () => {
    expect(offJurisdictionLevel('Ask Congress to stop the ICE raids; our village board cannot.')).toBeNull();
    expect(offJurisdictionLevel('')).toBeNull();
  });
});
