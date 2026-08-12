import { describe, it, expect } from 'vitest';
import { runGuardrails, uncoveredContactTargets } from '../guardrails';
import { isRepostSafe } from '../reposter';

describe('named contact targets', () => {
  it('blocks directing contact to a non-covered figure (the Buttigieg incident)', () => {
    const r = runGuardrails({
      text: "if single payer is your position, put it directly in Pete Buttigieg's inbox: https://mydemocracy.app",
    });
    const check = r.checks.find((c) => c.name === 'named_contact_target');
    expect(check?.passed).toBe(false);
    expect(check?.reason).toContain('Buttigieg');
  });

  it('allows generic officials phrasing', () => {
    const r = runGuardrails({ text: 'The fastest way to be heard is to message your representatives today.' });
    expect(r.checks.find((c) => c.name === 'named_contact_target')?.passed).toBe(true);
  });

  it('allows covered sitting legislators as contact targets', () => {
    expect(uncoveredContactTargets('You can email Chuck Schumer about this.')).toEqual([]);
  });
});

describe('repost safety (trusted handle is not trusted content)', () => {
  it('blocks charged news even from trusted handles (the Omar incident)', () => {
    expect(
      isRepostSafe(
        'NEW: Rep. Ilhan Omar is demanding answers from DHS after local police discovered an ICE agent sitting outside of her latest town hall.'
      )
    ).toBe(false);
  });

  it('blocks advocacy victory laps', () => {
    expect(isRepostSafe('WIN! A federal court today issued a preliminary injunction blocking the executive order.')).toBe(false);
    expect(isRepostSafe('One year later, their continued presence should not be normalized.')).toBe(false);
  });

  it('allows civic-utility content', () => {
    expect(isRepostSafe('15 bills were introduced in Congress yesterday.')).toBe(true);
    expect(isRepostSafe('South Carolina polls are open for today’s special Senate primary.')).toBe(true);
    expect(isRepostSafe('62% of U.S. adults say local news matters, our survey found.')).toBe(true);
  });
});
