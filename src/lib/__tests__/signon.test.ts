import { describe, it, expect } from 'vitest';
import { groupByOffice, publicSignatories, rollLabel, rollCsv, signonConsentText, type Signature } from '../signon';

const sig = (over: Partial<Signature>): Signature => ({
  name: 'A Person', email: 'a@example.com', city: 'Reno', state: 'NV', ...over,
});

describe('grouping signers into the rolls an org sends', () => {
  const signatures = [
    sig({ name: 'One', email: 'one@example.com', congressional_district: '2' }),
    sig({ name: 'Two', email: 'two@example.com', congressional_district: '2' }),
    sig({ name: 'Three', email: 'three@example.com', congressional_district: '1' }),
    sig({ name: 'Four', email: 'four@example.com', state: 'CA', congressional_district: '12' }),
  ];

  it('puts each district in its own roll', () => {
    const rolls = groupByOffice(signatures, 'federal');
    expect(rolls.map(rollLabel)).toEqual(['CA-12', 'NV-1', 'NV-2']);
    expect(rolls.find((r) => r.district === '2')!.signers).toHaveLength(2);
  });

  it('orders districts numerically, not as text', () => {
    const many = ['10', '9', '2'].map((d, i) => sig({ email: `m${i}@example.com`, congressional_district: d }));
    expect(groupByOffice(many, 'federal').map((r) => r.district)).toEqual(['2', '9', '10']);
  });

  // Someone the geocoder could not place still signed. Dropping them loses a
  // real person; guessing files them with an office that does not represent
  // them, which is the thing that makes a staffer stop trusting the list.
  it('keeps unplaced signers in their own roll, last', () => {
    const rolls = groupByOffice([...signatures, sig({ name: 'Rural', email: 'r@example.com', congressional_district: null })], 'federal');
    expect(rolls[rolls.length - 1].district).toBeNull();
    expect(rollLabel(rolls[rolls.length - 1])).toContain('not placed');
  });

  it('treats an empty district as unplaced rather than as a district', () => {
    expect(groupByOffice([sig({ congressional_district: '  ' })], 'federal')[0].district).toBeNull();
  });

  it('groups by state chamber when asked for one', () => {
    const rolls = groupByOffice([sig({ state_upper_district: '13' }), sig({ email: 'b@example.com', state_upper_district: '13' })], 'state_upper');
    expect(rolls).toHaveLength(1);
    expect(rollLabel(rolls[0])).toBe('NV State Senate District 13');
  });
});

describe('what the public page may show', () => {
  const signatures = [
    sig({ name: 'Shown', email: 's@example.com', show_name_publicly: true, street: '1 Main St' }),
    sig({ name: 'Hidden', email: 'h@example.com', show_name_publicly: false }),
    sig({ name: 'Default', email: 'd@example.com' }),
  ];

  it('shows only the people who asked for it', () => {
    expect(publicSignatories(signatures).map((s) => s.name)).toEqual(['Shown']);
  });

  // Not showing a name is the default, so an unset value must not leak one.
  it('treats an unset choice as private', () => {
    expect(publicSignatories([sig({ show_name_publicly: null })])).toEqual([]);
  });

  it('never exposes the street or the email', () => {
    const shown = publicSignatories(signatures)[0] as Record<string, unknown>;
    expect(Object.keys(shown).sort()).toEqual(['city', 'name', 'state']);
  });
});

describe('the roll an organization pastes under the letter', () => {
  it('carries the address, because that is the evidence', () => {
    const roll = groupByOffice([sig({ street: '1 Main St', zip: '89506' })], 'federal')[0];
    const csv = rollCsv(roll);
    expect(csv).toContain('1 Main St');
    expect(csv).toContain('89506');
    expect(csv).toContain('a@example.com');
  });

  // Signers no longer write a line of their own, so the column would be empty
  // on every row. Signatures taken before the field went keep theirs in the
  // database, they just do not travel in the export.
  it('has no column for a line the signer cannot write', () => {
    const roll = groupByOffice([sig({ personal_note: 'from before the field was removed' })], 'federal')[0];
    const csv = rollCsv(roll);
    expect(csv).not.toContain('Their own words');
    expect(csv).not.toContain('from before the field was removed');
  });
});

describe('what a signer agrees to', () => {
  it('names the organization and says the address goes with it', () => {
    const text = signonConsentText('GEEARS');
    expect(text).toContain('GEEARS');
    expect(text).toContain('name and address');
    expect(text).toContain('lawmakers');
  });

  it('still reads correctly when the organization has no name on file', () => {
    expect(signonConsentText(null)).toContain('the organization running this letter');
    expect(signonConsentText('   ')).toContain('the organization running this letter');
  });

  // Jared's copy rules: flat declarative sentences only.
  it('uses no em dashes', () => {
    expect(signonConsentText('GEEARS')).not.toContain('—');
  });

  // It used to add that the address is how an office knows you live in the
  // district. True, and nobody asked.
  it('says what happens to your details and stops', () => {
    const text = signonConsentText('GEEARS');
    expect(text).not.toMatch(/that is how/i);
    expect(text.split('.').filter((part) => part.trim()).length).toBe(1);
  });
});
