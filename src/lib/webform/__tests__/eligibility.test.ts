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

  it('matches on last name when the full name differs', () => {
    expect(verifiedFormFor('Bernie Sanders', 'Sanders')).toContain('sanders.senate.gov');
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
