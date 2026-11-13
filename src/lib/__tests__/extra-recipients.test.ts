import { describe, it, expect } from 'vitest';
import { createCampaignSchema, parseBody } from '../schemas';

const base = {
  campaign_type: 'advocacy' as const,
  headline: 'Raise the child care subsidy rate',
  description: 'Nevada sets the rate and it has not kept up with what care costs to provide.',
  target_level: 'state' as const,
  issue_area: 'Education',
  direction: 'support' as const,
  message_template: 'The rate has not kept pace with the cost of providing care.',
};

/**
 * None of the 2,699 state committees or 49 federal ones on file carry an
 * email, so an organization campaigning about a committee supplies the
 * address itself.
 */
describe('addresses an organization supplies', () => {
  it('accepts a committee inbox', () => {
    const parsed = parseBody(createCampaignSchema, {
      ...base,
      extra_recipients: [{ name: 'Senate Health and Human Services', title: 'Committee inbox', email: 'shhs@leg.state.nv.us' }],
    });
    expect(parsed.success).toBe(true);
  });

  it('does not require a title', () => {
    const parsed = parseBody(createCampaignSchema, {
      ...base,
      extra_recipients: [{ name: 'Planning Commission', email: 'comment@reno.gov' }],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an address that is not one', () => {
    const parsed = parseBody(createCampaignSchema, {
      ...base,
      extra_recipients: [{ name: 'Committee', email: 'not-an-email' }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an unnamed inbox, because the sender sees the name', () => {
    const parsed = parseBody(createCampaignSchema, {
      ...base,
      extra_recipients: [{ name: '', email: 'someone@example.com' }],
    });
    expect(parsed.success).toBe(false);
  });

  // A campaign is a campaign, not a mailing list.
  it('caps the list', () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ name: `Body ${i}`, email: `b${i}@example.com` }));
    expect(parseBody(createCampaignSchema, { ...base, extra_recipients: many }).success).toBe(false);
  });

  it('is optional', () => {
    expect(parseBody(createCampaignSchema, base).success).toBe(true);
  });
});
