import { describe, it, expect } from 'vitest';
import { toOfficial, type StateLegislator } from '@/lib/state-legislators';
import { lowerChamberName } from '@/lib/chambers';
import { salutationTitle } from '@/lib/utils';

const leg = (chamber: 'upper' | 'lower'): StateLegislator =>
  ({
    id: 'ocd-person/test',
    name: 'Erica Roth',
    lastName: 'Roth',
    party: 'Democratic',
    chamber,
    district: '24',
  }) as StateLegislator;

describe('state legislator titles', () => {
  it('names a Nevada lower-chamber member an Assemblymember, not a State Representative', () => {
    expect(toOfficial(leg('lower'), 'NV').title).toBe('Assemblymember, District 24');
  });

  it('carries that into the greeting the office actually reads', () => {
    // salutationTitle matches /representative/ before /assembly/, so a title of
    // "State Representative" produced "Dear Representative Roth" for a Nevada
    // Assemblymember.
    expect(salutationTitle(toOfficial(leg('lower'), 'NV').title)).toBe('Assemblymember');
  });

  it('uses Delegate where the lower chamber is a House of Delegates', () => {
    for (const code of ['MD', 'VA', 'WV']) {
      expect(salutationTitle(toOfficial(leg('lower'), code).title)).toBe('Delegate');
    }
  });

  it('leaves State Representative in place where it is correct', () => {
    for (const code of ['TX', 'WI', 'OH']) {
      expect(toOfficial(leg('lower'), code).title).toBe('State Representative, District 24');
    }
  });

  it('does not touch upper chambers', () => {
    expect(toOfficial(leg('upper'), 'NV').title).toBe('State Senator, District 24');
  });
});

describe('lower chamber names for district labels', () => {
  it('calls it an Assembly where that is its name', () => {
    expect(lowerChamberName('NV')).toBe('Assembly');
    expect(lowerChamberName('CA')).toBe('Assembly');
  });

  it('calls it a House of Delegates where that is its name', () => {
    expect(lowerChamberName('VA')).toBe('House of Delegates');
  });

  it('falls back to State House elsewhere', () => {
    expect(lowerChamberName('TX')).toBe('State House');
    expect(lowerChamberName('nv')).toBe('Assembly');
  });
});
