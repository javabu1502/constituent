import { describe, it, expect } from 'vitest';
import { askAddressesOfficial, openingRepeatsBody } from '../message-quality';

describe('askAddressesOfficial (the closing ask must ask the reader to act)', () => {
  it('rejects an ask addressed to a third party', () => {
    expect(askAddressesOfficial('I urge HHS to rescind this proposed rule and instead engage parents, providers, and early childhood specialists.')).toBe(false);
    expect(askAddressesOfficial('We ask the Department of Education to restore the funding.')).toBe(false);
  });
  it('accepts an ask that asks the official to press the third party', () => {
    expect(askAddressesOfficial('Please urge HHS to rescind the proposed rule and preserve the Head Start Program Performance Standards.')).toBe(true);
    expect(askAddressesOfficial('I ask you to press the Department to withdraw the rule and to work with parents and providers on burden reduction.')).toBe(true);
    expect(askAddressesOfficial('Please vote no on H.R. 1.')).toBe(true);
  });
  it('rejects an ask with no reader at all', () => {
    expect(askAddressesOfficial('Head Start standards must be preserved.')).toBe(false);
  });
});

describe('openingRepeatsBody', () => {
  const opening = 'Having worked closely with families of Head Start children through my roles at the Children\'s Advocacy Alliance in Nevada and at ZERO TO THREE, I feel a strong responsibility to speak up.';
  it('flags a body that restates the opening', () => {
    const body = 'Through my work at the Children\'s Advocacy Alliance in Nevada and at ZERO TO THREE, I have spoken with many families whose children attend Head Start. They speak highly of it.';
    expect(openingRepeatsBody(opening, body)).toBe(true);
  });
  it('passes a body that starts with the case', () => {
    const body = 'The Performance Standards are the reason the program works. They protect health, nutrition, mental health, and family engagement alongside early learning, and the proposed rule would dismantle that foundation.';
    expect(openingRepeatsBody(opening, body)).toBe(false);
  });
});
