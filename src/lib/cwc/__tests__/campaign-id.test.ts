import { describe, it, expect } from 'vitest';
import { buildCampaignId } from '../campaign-id';

const bill = { congress: 119, type: 's', number: 233 } as const;

describe('buildCampaignId', () => {
  it('is stable: same campaign + stance + bill → same id', () => {
    const a = buildCampaignId({ campaignRef: 'insulin-pricing', bill, stance: 'pro' });
    const b = buildCampaignId({ campaignRef: 'insulin-pricing', bill, stance: 'pro' });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/); // sha-256 hex, per spec guidance
  });

  it('case differences in the ref do not fragment the campaign', () => {
    expect(buildCampaignId({ campaignRef: 'Insulin-Pricing', bill, stance: 'pro' }))
      .toBe(buildCampaignId({ campaignRef: 'insulin-pricing', bill, stance: 'pro' }));
  });

  it('pro and con are SEPARATE campaigns (George)', () => {
    expect(buildCampaignId({ campaignRef: 'insulin-pricing', bill, stance: 'pro' }))
      .not.toBe(buildCampaignId({ campaignRef: 'insulin-pricing', bill, stance: 'con' }));
  });

  it('different campaigns and different bills never collide', () => {
    const base = buildCampaignId({ campaignRef: 'insulin-pricing', bill, stance: 'pro' });
    expect(buildCampaignId({ campaignRef: 'medicare-expansion', bill, stance: 'pro' })).not.toBe(base);
    expect(buildCampaignId({ campaignRef: 'insulin-pricing', bill: { ...bill, number: 234 }, stance: 'pro' })).not.toBe(base);
    expect(buildCampaignId({ campaignRef: 'insulin-pricing', stance: 'pro' })).not.toBe(base);
  });

  it('refuses free text — the fragmentation bug the audit flagged', () => {
    expect(() => buildCampaignId({ campaignRef: 'Lower insulin prices now' })).toThrow(/stable slug\/id/);
    expect(() => buildCampaignId({ campaignRef: '  ' })).toThrow(/stable slug\/id/);
    expect(() => buildCampaignId({ campaignRef: '' })).toThrow(/stable slug\/id/);
  });

  it('accepts slugs and uuids', () => {
    expect(() => buildCampaignId({ campaignRef: 'demo-ab156' })).not.toThrow();
    expect(() => buildCampaignId({ campaignRef: '4b8c1c2e-0d5f-4a53-9a4e-2f1f4a1b9c1d' })).not.toThrow();
  });
});
