import { describe, it, expect } from 'vitest';
import { bodyForScreening, bodyWithoutSalutation } from '../compliance-gate';

/**
 * One letter sent to three offices must be screened on identical input.
 *
 * The screener used to receive the body verbatim, which begins "Dear Senator
 * <name>,". That made the input different for each office, so the three
 * copies could come back with three different verdicts, and it put the
 * recipient's name back into the model input that the payload builder
 * deliberately leaves out.
 */
describe('the screened body does not depend on the office', () => {
  const letter = (who: string) =>
    `Dear ${who},\n\nI am writing about the child care tax credit. My family needs it.\n\nSincerely,\nJane Doe`;

  it('collapses copies addressed to different members to one text', () => {
    const a = bodyForScreening(letter('Senator Rosen'));
    const b = bodyForScreening(letter('Senator Cortez Masto'));
    const c = bodyForScreening(letter('Representative Amodei'));
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('carries no member name into the screened text', () => {
    const screened = bodyForScreening(letter('Senator Rosen'));
    expect(screened).not.toMatch(/Rosen|Senator/);
    expect(screened).toContain('child care tax credit');
  });

  it('keeps the paragraphs the constituent wrote', () => {
    // The screening KEY collapses whitespace because it only needs an
    // identity. The text the model reads must not: a letter flattened to one
    // line reads more like gibberish than the letter the person wrote.
    expect(bodyForScreening(letter('Senator Rosen'))).toContain('\n');
    expect(bodyWithoutSalutation(letter('Senator Rosen'))).not.toContain('\n');
  });

  it('leaves a body alone when its first line is not a greeting', () => {
    const body = 'I am writing about the child care tax credit.\n\nThank you.';
    expect(bodyForScreening(body)).toBe(body);
  });

  /**
   * Whatever is removed here is still sent to the office, so anything the
   * screener does not see is delivered unscreened. This is the only abuse
   * screen in the pipeline.
   *
   * Deleting the whole first line whenever it began with a greeting word let
   * a threat ride in on it: "Hi, I know where you live and I will be there."
   * was removed and the letter screened as the sentence after it. Matching up
   * to the first comma had the same hole one step along.
   */
  it.each([
    ['a threat wearing a greeting', 'Hi, I know where you live and I will be there.\n\nPlease vote no on H.R. 1234.', /know where you live/],
    ['abuse after "To"', 'To hell with you and your family, I am coming\n\nPlease vote no.', /hell with you|coming/],
    ['no recipient named', 'Hi, you are a crook and I will find you\n\nPlease vote no.', /crook|find you/],
  ])('keeps %s in the screener input', (_label, body, expected) => {
    expect(bodyForScreening(body)).toMatch(expected);
  });

  it.each([
    ['Dear Senator Rosen,\n\nPlease vote no.'],
    ['Dear Rep. Amodei,\n\nPlease vote no.'],
    ['Hello Jacky Rosen,\n\nPlease vote no.'],
    ['To the Honorable Jane Doe:\n\nPlease vote no.'],
    ['Dear Congresswoman Kiggans,\n\nPlease vote no.'],
  ])('still removes a real salutation: %s', (body) => {
    expect(bodyForScreening(body)).toBe('Please vote no.');
  });
});
