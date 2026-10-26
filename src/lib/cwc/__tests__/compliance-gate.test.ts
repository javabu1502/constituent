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
});
