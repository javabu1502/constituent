import { describe, it, expect } from 'vitest';
import { checkRedirectTarget, allowedHosts, buildRedirectUrl } from '../redirect-target';

const WECA = { orgUrl: 'https://wisconsinearlychildhood.org', customDomain: null };

describe('allowedHosts', () => {
  it('reads the host out of org_url', () => {
    expect(allowedHosts(WECA)).toEqual(['wisconsinearlychildhood.org']);
  });

  it('accepts a bare domain in org_url', () => {
    expect(allowedHosts({ orgUrl: 'example.org' })).toEqual(['example.org']);
  });

  it('treats www as the same organization', () => {
    expect(allowedHosts({ orgUrl: 'https://www.example.org' })).toEqual(['example.org']);
  });

  it('includes a custom domain, stored bare', () => {
    expect(allowedHosts({ orgUrl: 'https://example.org', customDomain: 'act.example.org' }))
      .toEqual(['act.example.org', 'example.org']);
  });

  it('grants nothing for an unparseable org_url', () => {
    expect(allowedHosts({ orgUrl: 'not a url at all /// ' })).toEqual([]);
    expect(allowedHosts({})).toEqual([]);
  });
});

describe('checkRedirectTarget accepts the organization own pages', () => {
  it('accepts a page on the org site', () => {
    const r = checkRedirectTarget('https://wisconsinearlychildhood.org/thank-you', WECA);
    expect(r.ok).toBe(true);
  });

  it('accepts www when org_url is bare, and the reverse', () => {
    expect(checkRedirectTarget('https://www.example.org/ty', { orgUrl: 'https://example.org' }).ok).toBe(true);
    expect(checkRedirectTarget('https://example.org/ty', { orgUrl: 'https://www.example.org' }).ok).toBe(true);
  });

  it('accepts a subdomain, where thank-you pages often live', () => {
    expect(checkRedirectTarget('https://act.example.org/ty', { orgUrl: 'https://example.org' }).ok).toBe(true);
  });

  it('keeps the query the organization put there', () => {
    const r = checkRedirectTarget('https://example.org/ty?from=email', { orgUrl: 'example.org' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).toContain('from=email');
  });

  it('drops a fragment, which never reaches a server', () => {
    const r = checkRedirectTarget('https://example.org/ty#top', { orgUrl: 'example.org' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.url).not.toContain('#');
  });
});

describe('checkRedirectTarget refuses an open redirect', () => {
  it('refuses another site', () => {
    const r = checkRedirectTarget('https://evil.example.com/phish', WECA);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('wisconsinearlychildhood.org');
  });

  it('refuses a lookalike that merely ends with the name', () => {
    // notwisconsinearlychildhood.org must not pass as a subdomain.
    expect(checkRedirectTarget('https://notwisconsinearlychildhood.org/x', WECA).ok).toBe(false);
    expect(checkRedirectTarget('https://wisconsinearlychildhood.org.evil.com/x', WECA).ok).toBe(false);
  });

  it('refuses every scheme but https', () => {
    for (const bad of [
      'http://wisconsinearlychildhood.org/ty',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
    ]) {
      expect(checkRedirectTarget(bad, WECA).ok).toBe(false);
    }
  });

  it('refuses credentials that hide the real host', () => {
    const r = checkRedirectTarget('https://wisconsinearlychildhood.org@evil.com/x', WECA);
    expect(r.ok).toBe(false);
  });

  it('refuses anything when the organization has no website set', () => {
    const r = checkRedirectTarget('https://example.org/ty', { orgUrl: null, customDomain: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('organization website');
  });

  it('refuses an incomplete address', () => {
    expect(checkRedirectTarget('wisconsinearlychildhood.org/ty', WECA).ok).toBe(false);
    expect(checkRedirectTarget('', WECA).ok).toBe(false);
    expect(checkRedirectTarget('   ', WECA).ok).toBe(false);
  });
});

describe('buildRedirectUrl', () => {
  it('adds attribution the organization analytics can read', () => {
    const u = new URL(buildRedirectUrl('https://example.org/ty', {
      campaignSlug: 'hr-2184', actionSlug: 'senate-floor',
    }));
    expect(u.searchParams.get('utm_source')).toBe('mydemocracy');
    expect(u.searchParams.get('utm_medium')).toBe('advocacy');
    expect(u.searchParams.get('utm_campaign')).toBe('hr-2184');
    expect(u.searchParams.get('md_action')).toBe('senate-floor');
  });

  it('leaves out the action when the send was not from one', () => {
    const u = new URL(buildRedirectUrl('https://example.org/ty', { campaignSlug: 'hr-2184' }));
    expect(u.searchParams.has('md_action')).toBe(false);
  });

  it('never overwrites a parameter the organization set', () => {
    const u = new URL(buildRedirectUrl('https://example.org/ty?utm_source=newsletter', {
      campaignSlug: 'hr-2184',
    }));
    expect(u.searchParams.get('utm_source')).toBe('newsletter');
    expect(u.searchParams.get('utm_campaign')).toBe('hr-2184');
  });
});
