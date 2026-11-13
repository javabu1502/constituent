import { describe, it, expect } from 'vitest';
import { nationalContactAccess, stateContactAccess } from '../contact-access';

/**
 * These numbers go on a public page and into a reporter's hands, so they are
 * pinned. A silent change to the audit files that moves a published figure
 * should fail here rather than on the page.
 */
describe('what the audit says, nationally', () => {
  const n = nationalContactAccess();

  it('covers every state plus DC', () => {
    expect(n.jurisdictions).toBe(51);
    expect(n.legislators).toBe(7344);
  });

  it('reports the share with a usable form', () => {
    expect(n.withForm).toBe(719);
    expect(n.withFormPercent).toBeCloseTo(9.8, 1);
  });

  it('counts the jurisdictions with none at all', () => {
    expect(n.statesWithNone).toHaveLength(32);
    expect(n.statesWithNone).toContain('NV');
    expect(n.statesWithNone).not.toContain('NH');
  });

  it('is internally consistent', () => {
    expect(n.captchaFree).toBeLessThanOrEqual(n.withForm);
    expect(n.senate.onCwc + n.senate.offCwc).toBe(100);
    expect(n.senate.realForms).toBeLessThanOrEqual(n.senate.offCwc);
  });

  it('carries the date it was measured, because it goes stale', () => {
    expect(n.measuredOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('what the audit says about one state', () => {
  it('reports Nevada having none', () => {
    const nv = stateContactAccess('NV')!;
    expect(nv.legislators).toBe(63);
    expect(nv.withForm).toBe(0);
    expect(nv.noneAtAll).toBe(true);
  });

  it('does not call a state empty when it has one', () => {
    expect(stateContactAccess('NH')!.noneAtAll).toBe(false);
  });

  it('accepts a lowercase code', () => {
    expect(stateContactAccess('nv')).toEqual(stateContactAccess('NV'));
  });

  it('returns null for something that is not a state', () => {
    expect(stateContactAccess('ZZ')).toBeNull();
  });
});
