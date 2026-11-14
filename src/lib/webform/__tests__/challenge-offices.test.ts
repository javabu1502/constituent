import { describe, it, expect } from 'vitest';
import { challengeOfficeFor, needsConstituentChallenge, challengeOfficeIds, CHALLENGE_TOKEN_FIELD } from '../challenge-offices';

/**
 * Four Senate offices put a reCAPTCHA checkbox in front of their contact
 * form. The constituent answers it on our page using the office's own
 * widget, and their token travels with the message.
 *
 * The list is explicit and short on purpose. Rendering somebody else's
 * sitekey is not a thing to do by accident.
 */
describe('offices whose form asks the sender to prove they are a person', () => {
  it('covers exactly the four found on 2026-11-13', () => {
    expect(challengeOfficeIds()).toEqual(['B001236', 'B001243', 'M000355', 'T000476']);
  });

  it('carries a real sitekey and the office page it came from', () => {
    for (const id of challengeOfficeIds()) {
      const office = challengeOfficeFor(id)!;
      expect(office.sitekey, id).toMatch(/^6L[A-Za-z0-9_-]{30,}$/);
      expect(office.url, id).toMatch(/^https:\/\/www\.[a-z]+\.senate\.gov\//);
      expect(office.state, id).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('uses the standard token field every one of them had', () => {
    expect(CHALLENGE_TOKEN_FIELD).toBe('g-recaptcha-response');
  });

  // Everyone else is either deliverable without a challenge or not
  // deliverable at all. Neither should reach this path.
  it('claims nobody else', () => {
    expect(needsConstituentChallenge('C001113')).toBe(false);
    expect(needsConstituentChallenge('R000608')).toBe(false);
    expect(needsConstituentChallenge('')).toBe(false);
    expect(needsConstituentChallenge(null)).toBe(false);
    expect(challengeOfficeFor('NOPE')).toBeNull();
  });
});
