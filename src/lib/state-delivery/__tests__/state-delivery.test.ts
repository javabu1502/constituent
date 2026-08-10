import { describe, it, expect } from 'vitest';
import { buildStateEmail, StateEmailError } from '../email';
import { resolveTargetChannel, buildOverrideMap, withOverride } from '../resolve';
import type { StateDeliveryInput, StateLegislatorTarget } from '../types';

const base = (over: Partial<StateDeliveryInput> = {}): StateDeliveryInput => ({
  constituent: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', city: 'Reno', state: 'NV' },
  target: { name: 'Pat Smith', title: 'State Senator', email: 'psmith@leg.state.nv.us', state: 'NV' },
  subject: 'Please support fair maps',
  constituentMessage: 'As a Reno resident, redistricting reform matters to my family.',
  ...over,
});

describe('buildStateEmail', () => {
  it('sends from our domain with the constituent as Reply-To (no spoofing)', () => {
    const e = buildStateEmail(base());
    expect(e.replyTo).toBe('jane@example.com');
    expect(e.from).not.toContain('example.com'); // From is OUR domain, not the constituent's
    expect(e.fromName).toBe('Jane Doe (via My Democracy)');
    expect(e.to).toBe('psmith@leg.state.nv.us');
  });

  it('renders the two-block message + a plain identity line', () => {
    const e = buildStateEmail(base({ organizationStatement: 'Our coalition urges fair maps.' }));
    expect(e.text).toContain('Dear State Senator Smith,');
    expect(e.text).toContain('Our coalition urges fair maps.');
    expect(e.text).toContain('As a Reno resident');
    expect(e.text).toContain('Jane Doe');
    expect(e.text).toContain('Reno, NV');
  });

  it('requires at least one message block and a target email', () => {
    expect(() => buildStateEmail(base({ constituentMessage: '', organizationStatement: '' }))).toThrow(StateEmailError);
    expect(() => buildStateEmail(base({ target: { name: 'X', title: 'Rep', state: 'NV', email: null } }))).toThrow(/webform/);
  });
});

describe('resolveTargetChannel + overrides', () => {
  const t = (o: Partial<StateLegislatorTarget>): StateLegislatorTarget => ({ name: 'Pat Smith', title: 'Rep', state: 'NV', ...o });

  it('routes to email, webform, or none', () => {
    expect(resolveTargetChannel(t({ email: 'a@b.gov' }))).toEqual({ channel: 'email', email: 'a@b.gov' });
    expect(resolveTargetChannel(t({ webformUrl: 'https://leg.nv/contact' }))).toEqual({ channel: 'webform', webformUrl: 'https://leg.nv/contact' });
    expect(resolveTargetChannel(t({}))).toEqual({ channel: 'none' });
  });

  it('fills a missing email from the enrichment override table', () => {
    const overrides = buildOverrideMap({ overrides: [{ name: 'Pat Smith', email: 'psmith@leg.state.nv.us' }] });
    const filled = withOverride(t({ email: null }), overrides);
    expect(resolveTargetChannel(filled)).toEqual({ channel: 'email', email: 'psmith@leg.state.nv.us' });
  });

  it('never overwrites an email Open States already has', () => {
    const overrides = buildOverrideMap({ overrides: [{ name: 'Pat Smith', email: 'wrong@x.com' }] });
    expect(withOverride(t({ email: 'right@leg.gov' }), overrides).email).toBe('right@leg.gov');
  });
});
