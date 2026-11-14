import offices from '@/data/senate-challenge-offices.json';

/**
 * Offices whose form asks the sender to prove they are a person.
 *
 * Four Senate offices put a reCAPTCHA v2 checkbox in front of their contact
 * form. Nothing automated can answer it, and nothing here tries: the
 * constituent answers it themselves, on our page, using the office's own
 * widget. Their sitekeys render on other origins, so the token Google issues
 * is valid for that office and their server accepts it.
 *
 * What the challenge exists to stop is bulk automated submission. One
 * constituent solving one challenge for their own message is exactly what it
 * is asking for. The only thing that moves is which page the checkbox is
 * drawn on, which is the same thing EFF's Phantom of the Capitol did by
 * screenshotting an image challenge back to the sender.
 *
 * This is deliberately a short, explicit list rather than anything inferred.
 * Rendering someone else's sitekey is not a thing to do by accident, and a
 * list of four is reviewable.
 */
export interface ChallengeOffice {
  name: string;
  state: string;
  /** Public reCAPTCHA sitekey, read from the office's own page. */
  sitekey: string;
  url: string;
}

const OFFICES = offices.offices as Record<string, ChallengeOffice>;

/** The form field a reCAPTCHA token travels in. */
export const CHALLENGE_TOKEN_FIELD = offices.tokenField;

export function challengeOfficeFor(bioguide: string | null | undefined): ChallengeOffice | null {
  if (!bioguide) return null;
  return OFFICES[bioguide] ?? null;
}

export function needsConstituentChallenge(bioguide: string | null | undefined): boolean {
  return challengeOfficeFor(bioguide) !== null;
}

export function challengeOfficeIds(): string[] {
  return Object.keys(OFFICES).sort();
}
