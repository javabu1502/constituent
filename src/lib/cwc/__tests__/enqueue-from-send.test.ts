import { describe, it, expect } from 'vitest';
import { buildCwcQueueItem, type TrackSendLike, type CwcSendPayload, type CampaignBillContext } from '../enqueue-from-send';

const body = (overrides: Partial<TrackSendLike> = {}): TrackSendLike => ({
  advocate_name: 'Jane Q Doe',
  advocate_city: 'Reno',
  advocate_state: 'NV',
  advocate_district: '2',
  legislator_level: 'federal',
  legislator_chamber: 'house',
  issue_area: 'Families & Children',
  issue_subtopic: 'Foster care',
  message_body: 'As a kinship caregiver, I see these children go uncounted.',
  campaign_id: 'c0ffee00-0000-4000-8000-000000000000',
  ...overrides,
});

const cwc = (overrides: Partial<CwcSendPayload> = {}): CwcSendPayload => ({
  prefix: 'Ms.',
  street: '123 Main St',
  zip: '89501',
  email: 'jane@example.com',
  subject: 'Please make hidden foster care visible',
  ...overrides,
});

const campaign = (overrides: Partial<CampaignBillContext> = {}): CampaignBillContext => ({
  slug: 'demo-nv-hidden-foster-care',
  bill_level: null,
  bill_congress: null,
  bill_type: null,
  bill_number: null,
  direction: 'support',
  headline: 'Make Hidden Foster Care Visible',
  ...overrides,
});

describe('buildCwcQueueItem', () => {
  it('builds a House delivery from a tracked campaign send', () => {
    const r = buildCwcQueueItem({ body: body(), cwc: cwc(), campaign: campaign(), messageId: 'm1' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item.delivery.officeCode).toBe('HNV02');
    expect(r.item.delivery.chamber).toBe('house');
    expect(r.item.messageKey).toBe('msg:m1');
    expect(r.item.billLevel).toBe('none');
    expect(r.item.delivery.constituent).toMatchObject({
      prefix: 'Ms.', firstName: 'Jane', lastName: 'Q Doe', state: 'NV', zip: '89501',
    });
    expect(r.item.delivery.message.topics.length).toBeGreaterThan(0);
  });

  it('builds a Senate delivery using the senate class', () => {
    const r = buildCwcQueueItem({
      body: body({ legislator_chamber: 'senate', advocate_district: undefined }),
      cwc: cwc({ senate_class: 1 }),
      campaign: campaign(),
      messageId: 'm2',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item.delivery.officeCode).toBe('SNV01');
  });

  it('normalizes full state names', () => {
    const r = buildCwcQueueItem({ body: body({ advocate_state: 'Nevada' }), cwc: cwc(), campaign: campaign(), messageId: 'm3' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item.delivery.constituent.state).toBe('NV');
  });

  it('REFUSES state-bill campaigns outright', () => {
    const r = buildCwcQueueItem({
      body: body(),
      cwc: cwc(),
      campaign: campaign({ bill_level: 'state' }),
      messageId: 'm4',
    });
    expect(r).toMatchObject({ ok: false, skip: expect.stringContaining('state-bill') });
  });

  it('federal bill campaigns carry the bill + stance from the campaign direction', () => {
    const r = buildCwcQueueItem({
      body: body(),
      cwc: cwc(),
      campaign: campaign({ bill_level: 'federal', bill_congress: 119, bill_type: 'hr', bill_number: 2184 }),
      messageId: 'm5',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item.billLevel).toBe('federal');
    expect(r.item.delivery.message.bills).toEqual([{ congress: 119, type: 'hr', number: 2184 }]);
    expect(r.item.delivery.message.stance).toBe('pro');
  });

  it('refuses a bill campaign with no stance anywhere', () => {
    const r = buildCwcQueueItem({
      body: body(),
      cwc: cwc(),
      campaign: campaign({ bill_level: 'federal', bill_congress: 119, bill_type: 'hr', bill_number: 2184, direction: null }),
      messageId: 'm6',
    });
    expect(r).toMatchObject({ ok: false, skip: expect.stringContaining('stance') });
  });

  it('refuses non-federal offices and unmappable states', () => {
    expect(buildCwcQueueItem({ body: body({ legislator_level: 'state' }), cwc: cwc(), campaign: null, messageId: 'm7' }).ok).toBe(false);
    expect(buildCwcQueueItem({ body: body({ advocate_state: 'Narnia' }), cwc: cwc(), campaign: null, messageId: 'm8' }).ok).toBe(false);
  });

  it('contact-flow sends (no campaign) build a stable slugged campaign ref', () => {
    const a = buildCwcQueueItem({ body: body({ campaign_id: undefined }), cwc: cwc(), campaign: null, messageId: 'm9' });
    const b = buildCwcQueueItem({ body: body({ campaign_id: undefined }), cwc: cwc(), campaign: null, messageId: 'm10' });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    // Same issue → same CWC campaign id (offices group by campaign).
    expect(a.item.delivery.campaignId).toBe(b.item.delivery.campaignId);
  });
});
