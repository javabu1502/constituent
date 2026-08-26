import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { assertCwcUrl, assertProxiedEgress, senateBase } from '../client';

describe('assertCwcUrl (endpoint allowlist)', () => {
  it('accepts congressional https endpoints', () => {
    expect(assertCwcUrl('https://cwc.house.gov', 'x')).toBe('https://cwc.house.gov');
    expect(assertCwcUrl('https://soapbox.senate.gov/api/testing-messages/', 'x')).toBeTruthy();
    expect(assertCwcUrl('https://uat-cwc.house.gov/v2/message', 'x')).toBeTruthy();
  });

  it('refuses non-congressional hosts (typo/tampered env var)', () => {
    expect(() => assertCwcUrl('https://soapbox.senate.gov.evil.com/api', 'x')).toThrow(/not a house\.gov\/senate\.gov host/);
    expect(() => assertCwcUrl('https://example.com/cwc', 'x')).toThrow(/refusing/);
  });

  it('refuses plaintext http and garbage', () => {
    expect(() => assertCwcUrl('http://cwc.house.gov', 'x')).toThrow(/https/);
    expect(() => assertCwcUrl('not a url', 'x')).toThrow(/not a valid URL/);
  });
});

describe('assertProxiedEgress (static-IP fail-closed guard)', () => {
  const saved = { qg: process.env.QUOTAGUARD_URL, allow: process.env.CWC_ALLOW_DIRECT_EGRESS };
  beforeEach(() => {
    delete process.env.QUOTAGUARD_URL;
    delete process.env.CWC_ALLOW_DIRECT_EGRESS;
  });
  afterEach(() => {
    if (saved.qg !== undefined) process.env.QUOTAGUARD_URL = saved.qg; else delete process.env.QUOTAGUARD_URL;
    if (saved.allow !== undefined) process.env.CWC_ALLOW_DIRECT_EGRESS = saved.allow; else delete process.env.CWC_ALLOW_DIRECT_EGRESS;
  });

  it('refuses production sends when QUOTAGUARD_URL is missing', () => {
    expect(() => assertProxiedEgress('production')).toThrow(/QUOTAGUARD_URL/);
  });

  it('allows production when the proxy is configured', () => {
    process.env.QUOTAGUARD_URL = 'https://user:pass@shield.quotaguard.com:9294';
    expect(() => assertProxiedEgress('production')).not.toThrow();
  });

  it('allows an explicit documented override', () => {
    process.env.CWC_ALLOW_DIRECT_EGRESS = 'true';
    expect(() => assertProxiedEgress('production')).not.toThrow();
  });

  it('never blocks uat (sandbox testing without the proxy is fine)', () => {
    expect(() => assertProxiedEgress('uat')).not.toThrow();
  });
});

describe('senateBase URL validation', () => {
  it('the default endpoints pass the allowlist', () => {
    expect(senateBase('uat')).toMatch(/^https:\/\/[^/]*senate\.gov\//);
    expect(senateBase('production')).toMatch(/^https:\/\/[^/]*senate\.gov\//);
  });
});
