import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { assertCwcUrl, assertProxiedEgress, senateBase, sendSenate, sendHouse } from '../client';
import { setRatePermitClientFactory, RatePermitBackpressureError } from '../rate-permit';
import type { CwcDelivery } from '../types';

// No test in this file may reach the network: undici is mocked wholesale.
const fetchMock = vi.fn(async () => ({ status: 201, text: async () => '', json: async () => [] }));
vi.mock('undici', () => ({
  ProxyAgent: class {},
  fetch: (...args: unknown[]) => fetchMock(...(args as [])),
}));

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

describe('rate permit at the POST choke point (raw exports cannot bypass)', () => {
  const delivery: CwcDelivery = {
    chamber: 'senate',
    officeCode: 'SNY01',
    campaignId: 'campaign-1',
    constituent: {
      prefix: 'Ms.', firstName: 'Jane', lastName: 'Doe',
      address1: '350 5th Ave', city: 'New York', state: 'NY', zip: '10118-0110', email: 'jane@example.com',
    },
    message: {
      subject: 'Please support lowering insulin prices',
      topics: ['Health'],
      constituentMessage: 'As a nurse, I see insulin costs hurt my patients.',
    },
  };

  let permitClaims: Array<{ scope: string; gapMs: number }>;
  function stubPermits(slotOffsetMs: number) {
    setRatePermitClientFactory(() => ({
      rpc: async (_fn: string, args: { p_scope: string; p_min_gap_ms: number }) => {
        permitClaims.push({ scope: args.p_scope, gapMs: args.p_min_gap_ms });
        return { data: new Date(Date.now() + slotOffsetMs).toISOString(), error: null };
      },
    }) as never);
  }

  beforeEach(() => {
    permitClaims = [];
    fetchMock.mockClear();
    process.env.SCWC_TEST_API_KEY = 'test-key';
    process.env.CWC_HOUSE_UAT_API_KEY = 'test-key';
    process.env.CWC_DELIVERY_AGENT = 'My Democracy LLC';
    process.env.CWC_ACK_EMAIL = 'ack@mydemocracy.app';
    process.env.CWC_CONTACT_NAME = 'Jared Busker';
    process.env.CWC_CONTACT_EMAIL = 'jared@busker.consulting';
    process.env.CWC_CONTACT_PHONE = '202-555-0142';
  });
  afterEach(() => setRatePermitClientFactory());

  it('the raw sendSenate export claims the shared permit before the POST', async () => {
    stubPermits(-1000); // slot already due — proceeds straight to the POST
    const result = await sendSenate(delivery, 'uat');
    expect(result.status).toBe(201);
    expect(permitClaims).toEqual([{ scope: 'cwc:senate:test', gapMs: 200 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('the raw sendHouse export claims the house-scoped permit', async () => {
    stubPermits(-1000);
    await sendHouse({ ...delivery, chamber: 'house', officeCode: 'HNY12' }, 'uat');
    expect(permitClaims).toEqual([{ scope: 'cwc:house:test', gapMs: 200 }]);
  });

  it('a refused (deep-queue) permit stops the POST entirely — defer, never burst', async () => {
    stubPermits(60_000); // horizon beyond the 30s maxWait → backpressure
    await expect(sendSenate(delivery, 'uat')).rejects.toThrow(RatePermitBackpressureError);
    expect(permitClaims).toHaveLength(1); // the claim was attempted…
    expect(fetchMock).not.toHaveBeenCalled(); // …but nothing went out
  });

  it('ratePermit: false skips the claim (offline-verified callers only)', async () => {
    stubPermits(-1000);
    await sendSenate(delivery, 'uat', false);
    expect(permitClaims).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
