import { describe, it, expect } from 'vitest';
import { captchaFreeFormFor, verifiedFormFor } from '../queue';

/**
 * A senator is filable through their own contact form only when that form was
 * verified to exist. The CAPTCHA audit alone is not enough: on 2026-10-25,
 * 34 of its 51 CAPTCHA-free URLs were landing pages with no message form on
 * them, and the first production send filled a site search box because the
 * search button was the only submit button on the page.
 */
describe('webform eligibility', () => {
  it('a senator whose form was verified is filable', () => {
    expect(verifiedFormFor('Jacky Rosen')).toContain('rosen.senate.gov');
    expect(captchaFreeFormFor({ name: 'Jacky Rosen' })).toContain('rosen.senate.gov');
  });

  // The bioguide id is the key. Matching on a surname is what let Rick Scott
  // be advertised as filable off Tim Scott's verification entry, and a
  // nickname is not evidence that a particular senator's form was checked.
  it('matches a senator by bioguide id whatever name is passed', () => {
    expect(verifiedFormFor({ id: 'S000033', name: 'Bernie Sanders' })).toContain('sanders.senate.gov');
  });

  it('never resolves one senator off another senator with the same surname', () => {
    // Tim Scott is verified, Rick Scott is not. A surname match returned Tim
    // Scott's form for Rick Scott, and the worker would have filed there.
    expect(verifiedFormFor({ id: 'S001184', name: 'Tim Scott' })).toContain('scott.senate.gov');
    expect(verifiedFormFor({ id: 'S001217', name: 'Rick Scott' })).toBeNull();
    expect(captchaFreeFormFor({ id: 'S001217', name: 'Rick Scott', lastName: 'Scott' })).toBeNull();
    // Same shape in the other direction: two senators whose surnames nest.
    expect(verifiedFormFor({ id: 'H001079', name: 'Cindy Hyde-Smith' })).toContain('hydesmith.senate.gov');
  });

  it('prefers the verified form over the roster landing page', () => {
    // `contactForm` is the roster's landing page, which is the page that
    // holds no message form. Preferring it defeated the verification.
    expect(
      captchaFreeFormFor({
        id: 'S001184',
        name: 'Tim Scott',
        contactForm: 'https://www.scott.senate.gov/contact/contact',
      }),
    ).toBe('https://www.scott.senate.gov/contact/email-me');
  });

  it('a nickname alone is not enough', () => {
    expect(verifiedFormFor('Bernie Sanders')).toBeNull();
  });

  it('a CAPTCHA-free senator whose page held no form is NOT filable', () => {
    // Durbin's audited URL is a landing page. Its only submit button is the
    // site search, which is exactly what the 10-20 send clicked three times.
    expect(verifiedFormFor('Richard J. Durbin')).toBeNull();
    expect(captchaFreeFormFor({ name: 'Richard J. Durbin' })).toBeNull();
  });

  it('an unknown senator is not filable', () => {
    expect(captchaFreeFormFor({ name: 'Nobody At All' })).toBeNull();
  });

  it('every verified entry carries a senate.gov url', async () => {
    const { senators } = (await import('../../../data/senate-webform-verified.json')) as unknown as {
      senators: Array<{ name: string; url: string }>;
    };
    expect(senators.length).toBeGreaterThan(0);
    for (const s of senators) {
      expect(s.url).toMatch(/^https:\/\/[a-z0-9.-]*senate\.gov\//i);
    }
  });
});
