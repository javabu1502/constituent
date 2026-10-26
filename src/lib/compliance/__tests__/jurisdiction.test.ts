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

describe('a salutation is not a federal ask', () => {
  it('holds a municipal complaint even when it is addressed to a Representative', () => {
    const a = assessFederalJurisdiction({
      message: 'Dear Representative,\n\nThe potholes on my street have not been fixed in two years. Please repave Vassar Street.',
    });
    expect(a.outsideFederal).toBe(true);
  });

  it('holds a zoning request that calls the reader Senator mid-sentence', () => {
    const a = assessFederalJurisdiction({
      message: 'My city council approved a tower next door, Senator please help. Deny the variance.',
    });
    expect(a.outsideFederal).toBe(true);
  });

  it('still lets a genuine federal ask through with a salutation on top', () => {
    const a = assessFederalJurisdiction({
      message: 'Dear Senator,\n\nPlease urge HHS to withdraw the proposed rule on Head Start performance standards.',
    });
    expect(a.outsideFederal).toBe(false);
  });

  it('still lets a federal bill through', () => {
    const a = assessFederalJurisdiction({
      message: 'Dear Representative,\n\nPlease vote no on H.R. 1234 when it reaches the floor.',
    });
    expect(a.outsideFederal).toBe(false);
  });
});

describe('a topic noun is not a federal ask', () => {
  // These used to split by topic: the immigration version was waved through
  // and the identical firearm version was held, because the pattern treated
  // "immigration" as proof of a federal request.
  const local = (topic: string) =>
    assessFederalJurisdiction({
      message: `Our city council passed a ${topic} ordinance and it has to stop. Please weigh in with the council.`,
    }).outsideFederal;

  it('holds a purely local ask whatever its subject', () => {
    for (const topic of ['sanctuary', 'gun storage', 'short-term rental', 'mask']) {
      expect(local(topic)).toBe(true);
    }
  });

  it('is not switched off by the word national', () => {
    const a = assessFederalJurisdiction({
      message: 'The potholes on my street are terrible and the city does nothing. This is a national disgrace.',
    });
    expect(a.outsideFederal).toBe(true);
  });

  it('still recognises a real federal actor', () => {
    for (const msg of [
      'Please urge HHS to withdraw the proposed rule.',
      'Please vote no on H.R. 1234.',
      'Congress should fund Head Start properly.',
      'Ask ICE to stop the raids at the courthouse.',
    ]) {
      expect(assessFederalJurisdiction({ message: msg }).outsideFederal).toBe(false);
    }
  });

  /**
   * Dropping the bare topic nouns stopped the asymmetry, and then held
   * ordinary federal letters: a message that mentions a mayor or a council
   * and makes its federal ask through one of those words had no federal
   * signal left. They are back as actors and instruments.
   */
  it('does not hold a federal ask that also mentions a local body', () => {
    for (const msg of [
      'Our city council passed a resolution on Israel. I want the United States to stop arming Israel through foreign aid.',
      'Please stop the immigration raids in my neighborhood. The mayor says he cannot help.',
      'Please stop deploying the National Guard to our city. The mayor opposes it.',
      'Please vote against the new tariffs on imported ore. The county commission wrote you too.',
      'My VA disability claim has been stuck for a year. The county does nothing to help.',
    ]) {
      expect(assessFederalJurisdiction({ message: msg }).outsideFederal).toBe(false);
    }
  });

  /**
   * The acronyms are matched case-sensitively. Lowercase, they are ordinary
   * English, and matching them case-insensitively made this check fail OPEN.
   * The Virginia case is the expensive one: every constituent with a VA
   * address in their signature block bypassed the check entirely.
   */
  it('does not let a lowercase word or a state abbreviation switch the check off', () => {
    for (const msg of [
      'There is ice on the sidewalk in front of my house and the city does nothing.',
      'Potholes everywhere. The city does nothing.  Jane Doe, 123 Main St, Arlington, VA 22201',
      'The snow plows never come down our street. Sent from Richmond, VA.',
    ]) {
      expect(assessFederalJurisdiction({ message: msg }).outsideFederal).toBe(true);
    }
  });

  /**
   * The salutation strip used to delete the whole first line, which took the
   * ask with it when the greeting ran inline with the request.
   */
  it('keeps an ask that shares a line with the salutation', () => {
    const a = assessFederalJurisdiction({
      message: 'Dear Senator Rosen, please vote no on H.R. 1234.\n\nThe city council supports it but I do not.',
    });
    expect(a.outsideFederal).toBe(false);
  });
});
