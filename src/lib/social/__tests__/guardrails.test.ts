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

describe('reply deep-linking matcher', () => {
  const campaigns = [
    { slug: 'insulin-pricing', headline: 'Should Medicare Negotiate More Drug Prices?', issue_subtopic: 'insulin prescription drug prices' },
    { slug: 'housing-shortage', headline: 'How Should Washington Tackle the Housing Shortage?', issue_subtopic: 'rent housing affordability' },
    { slug: 'minimum-wage', headline: 'Should Congress Raise the Federal Minimum Wage to $17 by 2031?', issue_subtopic: 'minimum wage workers' },
  ];

  it('routes a rent grievance to the housing weigh-in', async () => {
    const { bestCampaignFor } = await import('../engager');
    expect(bestCampaignFor('my landlord just raised the rent again, housing costs are eating my whole paycheck', campaigns)?.slug).toBe('housing-shortage');
  });

  it('routes insulin talk to drug pricing', async () => {
    const { bestCampaignFor } = await import('../engager');
    expect(bestCampaignFor('rationing insulin because prescription prices keep climbing is insane', campaigns)?.slug).toBe('insulin-pricing');
  });

  it('returns null when nothing matches confidently', async () => {
    const { bestCampaignFor } = await import('../engager');
    expect(bestCampaignFor('what a beautiful sunset tonight over the lake', campaigns)).toBeNull();
  });
});
