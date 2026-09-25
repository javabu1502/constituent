import { describe, expect, it } from 'vitest';
import { getJurisdiction, selectLevels } from '../issue-jurisdiction';
import { detectBillRefs } from '../bill-refs';
import { detectCasework } from '../casework';

/**
 * Free-text routing stress corpus (2026-08-16 audit). Each entry is a message
 * the way a real person types it. mustHave = levels that MUST be selected,
 * mustNot = levels that must NOT be. Selection = primary (weight-2) levels,
 * falling back to weight-1 when nothing is primary.
 */
const CORPUS: [string, string[], string[]][] = [
  ["my social security check hasn't come in 3 months and no one answers the phone", ['federal'], ['state', 'local']],
  ["my husband's VA disability claim has been stuck for two years", ['federal'], ['state', 'local']],
  ["the IRS still hasn't sent my tax refund from last year", ['federal'], ['state', 'local']],
  ['I need my passport expedited for a funeral overseas', ['federal'], ['state', 'local']],
  ["I was denied unemployment and can't get anyone at the state office", ['state'], ['local']],
  ['the DMV lost my paperwork and suspended my license by mistake', ['state'], ['federal']],
  ["my landlord won't return my security deposit", ['state'], ['federal']],
  ['the potholes on Maple street have blown out two of my tires', ['local'], ['federal']],
  ["the school board is cutting the music program at my kid's school", ['local', 'state'], ['federal']],
  ['my trash hasn\'t been picked up in two weeks', ['local'], ['federal']],
  ['stop sending our money to foreign wars', ['federal'], ['state', 'local']],
  ['protect social security for my generation', ['federal'], ['state', 'local']],
  ['TSA and air traffic control are a mess, flights always delayed', ['federal'], ['local']],
  ['ban members of congress from trading stocks', ['federal'], ['state', 'local']],
  ['student loan forgiveness was promised and never came', ['federal'], ['local']],
  ['our teachers are the lowest paid in the region', ['state'], []],
  ['why is our vehicle registration fee so high', ['state'], ['federal']],
  ['please support H.R. 22 when it comes to a vote', ['federal'], ['state', 'local']],
  ['vote yes on AB 156, our kids need school breakfast', ['state'], ['federal', 'local']],
  ['SB 120 would finally legalize cannabis here', ['state'], ['federal']],
  ['what is your position on S.J.Res. 104?', ['federal'], ['state']],
  ['broadband out here is dialup speed, we can\'t work from home', ['federal', 'state'], []],
  ['the water coming out of our taps smells like chemicals', ['local', 'state'], []],
  ['daylight saving time is ruining my sleep, pick one time', ['federal'], ['local']],
  ['property taxes doubled since the reassessment', ['state', 'local'], ['federal']],
  ['grocery stores charge different prices for the same thing every week', ['federal', 'state'], []],
  // The one that reached state Sen. Hansen: immigration is federal-primary;
  // state weight 1 is context, not a recipient.
  ['the United States should move toward open borders, immigration is a net positive', ['federal'], ['state', 'local']],
];

describe('free-text routing corpus', () => {
  for (const [text, mustHave, mustNot] of CORPUS) {
    it(`"${text.slice(0, 50)}"`, () => {
      const selected = selectLevels(getJurisdiction(text));
      for (const l of mustHave) expect(selected, `should include ${l}`).toContain(l);
      for (const l of mustNot) expect(selected, `should exclude ${l}`).not.toContain(l);
    });
  }
});

describe('bill reference detection', () => {
  it('classifies federal formats', () => {
    expect(detectBillRefs('support H.R. 22 and S. 1332').federal.length).toBe(2);
    expect(detectBillRefs('what about S.J.Res. 104').federal.length).toBeGreaterThan(0);
    expect(detectBillRefs('HR 40 deserves a vote').federal.length).toBe(1);
  });
  it('classifies state formats and ballot measures', () => {
    expect(detectBillRefs('vote yes on AB 156').state).toEqual(['AB 156']);
    expect(detectBillRefs('SB 120 and HB 1002').state.length).toBe(2);
    expect(detectBillRefs('Question 7 is on the ballot').state.length).toBe(1);
  });
  it('spelled-out "senate bill" stays ambiguous and does not shift routing', () => {
    const refs = detectBillRefs('please pass senate bill 12');
    expect(refs.ambiguous.length).toBe(1);
    expect(refs.federal.length + refs.state.length).toBe(0);
  });
  it('a state bill ref routes exclusively to state', () => {
    // "school breakfast" alone would pull K-12 local weight; the bill ref wins.
    expect(selectLevels(getJurisdiction('vote yes on AB 156 for school breakfast'))).toEqual(['state']);
  });
});

describe('casework detection', () => {
  it('detects federal agency cases', () => {
    expect(detectCasework("my mother's green card application has been pending since 2023")).toEqual({ isCasework: true, level: 'federal' });
    expect(detectCasework('I have been waiting on my tax refund')).toEqual({ isCasework: true, level: 'federal' });
  });
  it('detects state agency cases', () => {
    expect(detectCasework('I was denied unemployment benefits')).toEqual({ isCasework: true, level: 'state' });
  });
  it('policy opinions are NOT casework', () => {
    expect(detectCasework('protect social security for my generation').isCasework).toBe(false);
    expect(detectCasework('the VA needs more funding').isCasework).toBe(false);
  });
});

describe('VA healthcare routes federal-only (Jared caught state legislators receiving it)', () => {
  it('VA phrasings never select state', async () => {
    const { getJurisdiction, selectLevels } = await import('../issue-jurisdiction');
    expect(selectLevels(getJurisdiction('access to VA healthcare, build more VA hospitals'))).toEqual(['federal']);
    expect(selectLevels(getJurisdiction('VA Healthcare Armed Forces and National Security'))).toEqual(['federal']);
  });
  it('plain healthcare and hospitals keep state weight', async () => {
    const { getJurisdiction } = await import('../issue-jurisdiction');
    expect(getJurisdiction('our rural hospital is closing').weights.state).toBe(2);
    expect(getJurisdiction('healthcare costs are crushing us').weights.state).toBe(2);
  });
});
