import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildWebformQueueItem, captchaFreeFormFor, enqueueWebformDelivery, setWebformQueueClientFactory, setWebformGate } from '../webform/queue';

const body = {
  legislator_id: 'C001113', legislator_name: 'Catherine Cortez Masto', legislator_level: 'federal', legislator_chamber: 'senate',
  advocate_name: 'Jared Busker', advocate_city: 'Reno', advocate_state: 'NV', message_body: 'Please protect Head Start.', issue_area: 'Families',
};
const cwc = { prefix: 'Mr.', street: '770 W Golden Valley Rd', zip: '89506', email: 'jared@mydemocracy.app', subject: 'Head Start' };
const active = new Set(['SNV01']); // Rosen on CWC, Cortez Masto not

describe('webform delivery gate (dark unless WEBFORM_DELIVERY_ENABLED)', () => {
  beforeEach(() => { process.env.WEBFORM_DELIVERY_ENABLED = 'true'; });
  afterEach(() => { delete process.env.WEBFORM_DELIVERY_ENABLED; });

  it('never builds when the flag is off', async () => {
    delete process.env.WEBFORM_DELIVERY_ENABLED;
    expect(await buildWebformQueueItem(body, cwc, 'contact-families', active)).toMatchObject({ ok: false, skip: /WEBFORM_DELIVERY_ENABLED/ });
  });
  it('is Senate-only and refuses a senator who is on CWC', async () => {
    expect(await buildWebformQueueItem({ ...body, legislator_chamber: 'house', legislator_id: 'A000369' }, cwc, 'c', active)).toMatchObject({ ok: false, skip: /Senate-only/ });
    expect(await buildWebformQueueItem({ ...body, legislator_id: 'R000608', legislator_name: 'Jacky Rosen' }, cwc, 'c', active)).toMatchObject({ ok: false, skip: /participates in CWC/ });
  });
  it('refuses a senator whose form is CAPTCHA-gated (Cortez Masto is reCAPTCHA)', async () => {
    const r = await buildWebformQueueItem(body, cwc, 'c', active);
    expect(r).toMatchObject({ ok: false, skip: /no CAPTCHA-free contact form/ });
    expect(captchaFreeFormFor({ name: 'Catherine Cortez Masto', lastName: 'Cortez Masto' })).toBeNull();
    expect(captchaFreeFormFor({ name: 'Ron Wyden', lastName: 'Wyden' })).toMatch(/wyden\.senate\.gov/);
  });
  it('builds for a CAPTCHA-free non-CWC senator with a stable message key', async () => {
    const wyden = { ...body, legislator_id: 'W000779', legislator_name: 'Ron Wyden', advocate_state: 'OR', advocate_city: 'Portland' };
    const r = await buildWebformQueueItem(wyden, { ...cwc, zip: '97201' }, 'contact-families', new Set(['SOR02']));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item.formUrl).toMatch(/wyden\.senate\.gov/);
    expect(r.item.messageKey).toMatch(/^cwc:[0-9a-f]{40}$/);
    expect(r.item.constituent).toMatchObject({ firstName: 'Jared', lastName: 'Busker', state: 'OR' });
  });
});

describe('enqueueWebformDelivery (same content screen as CWC)', () => {
  let upserts: unknown[] = [];
  beforeEach(() => {
    upserts = [];
    setWebformQueueClientFactory(() => ({ from: () => ({ upsert: async (row: unknown) => { upserts.push(row); return { error: null }; } }) }) as never);
  });
  afterEach(() => { setWebformQueueClientFactory(); setWebformGate(); });
  const item = { messageKey: 'cwc:abc', officialId: 'W000779', officialName: 'Ron Wyden', formUrl: 'https://www.wyden.senate.gov/contact/', constituent: { prefix: 'Mr.', firstName: 'J', lastName: 'B', email: 'j@x.org', street: '1 Main', city: 'Portland', state: 'OR', zip: '97201' }, message: { subject: 'Hi', body: 'Please act on housing costs.', topic: 'Housing' } };
  const verdict = (decision: 'pass' | 'review' | 'block') => async () => ({ decision, verdict: { decision, reasons: [], categories: { fakeIdentity: false, threat: false, spam: false, gibberish: false, splitAbuse: false, jurisdiction: false, other: false }, model: 'm', promptVersion: 'v' } });
  it('pass → queued, review → held, block → nothing enqueued', async () => {
    setWebformGate(verdict('pass'));
    expect(await enqueueWebformDelivery(item)).toEqual({ status: 'queued' });
    setWebformGate(verdict('review'));
    expect(await enqueueWebformDelivery(item)).toEqual({ status: 'held' });
    setWebformGate(verdict('block'));
    expect(await enqueueWebformDelivery(item)).toEqual({ status: 'blocked' });
    expect(upserts).toHaveLength(2);
    expect(upserts[0]).toMatchObject({ status: 'queued', official_id: 'W000779' });
    expect(upserts[1]).toMatchObject({ status: 'held' });
  });
});
