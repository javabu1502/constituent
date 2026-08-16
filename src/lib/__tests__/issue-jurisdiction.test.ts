import { describe, it, expect } from 'vitest';
import { getJurisdiction, matchLabelForLevel, type GovLevel } from '../issue-jurisdiction';

/** Which levels get auto-selected (best/also) for a given issue text. */
function routedLevels(text: string): GovLevel[] {
  const g = getJurisdiction(text);
  return (['federal', 'state', 'local'] as GovLevel[]).filter(
    (l) => matchLabelForLevel(g, l) !== 'low'
  );
}

describe('issue jurisdiction routing (auto-selection is load-bearing now)', () => {
  it('Social Security never routes to state or local', () => {
    expect(routedLevels('my social security check is late')).toEqual(['federal']);
    expect(routedLevels('SSDI backlog')).toEqual(['federal']);
  });

  it('purely local services never reach federal officials', () => {
    const g = getJurisdiction('trash pickup keeps getting missed on my street');
    expect(matchLabelForLevel(g, 'federal')).toBe('low');
    expect(matchLabelForLevel(g, 'local')).toBe('best');
  });

  it('drug costs route as healthcare, not policing (merge beats rule order)', () => {
    const g = getJurisdiction('prescription drug costs are out of control');
    expect(matchLabelForLevel(g, 'federal')).toBe('best');
    expect(matchLabelForLevel(g, 'state')).toBe('best');
  });

  it('property tax is state/local, not federal', () => {
    const g = getJurisdiction('property tax assessment doubled');
    expect(matchLabelForLevel(g, 'local')).toBe('best');
  });

  it('family law is state-only', () => {
    expect(routedLevels('child support enforcement')).toEqual(['state']);
  });

  it('DMV and licensing are state-only', () => {
    expect(routedLevels("waited five hours at the DMV for my driver's license")).toEqual(['state']);
  });

  it('foreign policy is federal-only', () => {
    expect(routedLevels('military aid to Ukraine')).toEqual(['federal']);
  });

  it('school shooting merges education and gun jurisdiction', () => {
    const g = getJurisdiction('school shooting prevention');
    expect(matchLabelForLevel(g, 'state')).toBe('best');
    expect(matchLabelForLevel(g, 'federal')).toBe('also');
  });

  it('taxi does not trigger the tax rule', () => {
    // Unknown issue -> safe default: federal + state, never local.
    expect(routedLevels('taxi medallion rules')).toEqual(['federal', 'state']);
  });

  it('unknown issues default to federal + state, excluding local', () => {
    const g = getJurisdiction('something completely unclassifiable xyzzy');
    expect(matchLabelForLevel(g, 'local')).toBe('low');
  });
});

describe('AI jurisdiction guardrails', () => {
  it('rules stay authoritative: known issues report a rule hit', async () => {
    const { hasJurisdictionRule } = await import('../issue-jurisdiction');
    expect(hasJurisdictionRule('social security delays')).toBe(true);
    expect(hasJurisdictionRule('a totally novel grievance xyzzy')).toBe(false);
  });

  it('sanitizes AI weights: clamps values, rejects garbage and all-zeros', async () => {
    const { sanitizeAiJurisdiction } = await import('../issue-jurisdiction');
    expect(sanitizeAiJurisdiction({ federal: 5, state: '1', local: -3 })?.weights).toEqual({ federal: 2, state: 1, local: 0 });
    expect(sanitizeAiJurisdiction({ federal: 0, state: 0, local: 0 })).toBeNull();
    expect(sanitizeAiJurisdiction('nonsense')).toBeNull();
    expect(sanitizeAiJurisdiction(null)).toBeNull();
  });
});

describe('federal-only health programs', () => {
  it('ACA and Medicare never route to state legislators', async () => {
    const { getJurisdiction } = await import('../issue-jurisdiction');
    expect(getJurisdiction('protect ACA subsidies').weights).toEqual({ federal: 2, state: 0, local: 0 });
    expect(getJurisdiction('Obamacare premium costs').weights).toEqual({ federal: 2, state: 0, local: 0 });
    expect(getJurisdiction('Medicare drug coverage').weights.state).toBe(0);
  });

  it('Medicaid and insurance regulation stay shared with states', async () => {
    const { getJurisdiction } = await import('../issue-jurisdiction');
    expect(getJurisdiction('expand Medicaid in our state').weights).toEqual({ federal: 2, state: 2, local: 0 });
    // Mixed mention: max-merge keeps both levels in play.
    expect(getJurisdiction('Medicare and Medicaid cuts').weights).toEqual({ federal: 2, state: 2, local: 0 });
  });

  it('ACA health insurance phrasing keeps federal primary', async () => {
    const { getJurisdiction } = await import('../issue-jurisdiction');
    const w = getJurisdiction('ACA health insurance subsidies expiring').weights;
    expect(w.federal).toBe(2);
  });
});
