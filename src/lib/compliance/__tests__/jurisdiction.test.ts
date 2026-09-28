import { describe, it, expect } from 'vitest';
import { assessFederalJurisdiction } from '../jurisdiction';

describe('assessFederalJurisdiction (topic jurisdiction is ENFORCED, not guided)', () => {
  it('holds a message that is only about a state bill', () => {
    const r = assessFederalJurisdiction({ message: 'Please vote yes on AB 156 when it comes to the Assembly floor. Our kids need it.' });
    expect(r.outsideFederal).toBe(true);
    expect(r.reasons.join(' ')).toMatch(/state bill \(AB 156\)/);
  });

  it('holds a message aimed at a state legislature or a local body', () => {
    expect(assessFederalJurisdiction({ message: 'The Nevada Legislature must fix the school funding formula this session.' }).outsideFederal).toBe(true);
    expect(assessFederalJurisdiction({ message: 'The city council keeps ignoring the potholes on Golden Valley Rd. Please fix them.' }).outsideFederal).toBe(true);
    expect(assessFederalJurisdiction({ message: 'Our school board voted to close the library and nobody asked parents.' }).outsideFederal).toBe(true);
    expect(assessFederalJurisdiction({ message: 'The pothole on my street has been there for months and the city does nothing.' }).outsideFederal).toBe(true);
  });

  it('passes a federal ask that uses state or local context', () => {
    expect(assessFederalJurisdiction({ message: 'Our county lost 40 Head Start slots. Please protect federal Head Start funding and urge HHS to withdraw the proposed rule.' }).outsideFederal).toBe(false);
    expect(assessFederalJurisdiction({ message: 'Please support H.R. 1234 so Nevada families can keep their Medicaid coverage.' }).outsideFederal).toBe(false);
    expect(assessFederalJurisdiction({ message: 'The state legislature passed AB 156 but it needs federal matching funds. Please support the appropriations request in Congress.' }).outsideFederal).toBe(false);
  });

  it('does not mistake "HR 1" (federal shorthand) for a state bill', () => {
    expect(assessFederalJurisdiction({ message: 'Please vote no on HR 1, it would gut voting protections nationwide.' }).outsideFederal).toBe(false);
  });

  it('passes an ordinary federal message with no bill at all', () => {
    expect(assessFederalJurisdiction({ message: 'I am a nurse in Reno and insulin prices are hurting my patients. Please act to lower drug prices.' }).outsideFederal).toBe(false);
  });
});
