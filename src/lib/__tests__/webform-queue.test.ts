import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hasWorkingRecipe, setRecipeResults, resetRecipeCache } from '@/lib/webform/recipe-eligibility';
import { buildWebformQueueItem, enqueueWebformDelivery, setWebformQueueClientFactory, setWebformGate } from '../webform/queue';

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
  // This named a real senator twice and was wrong twice. Cortez Masto was
  // the example until 2026-11-13, when the audit turned out to have been
  // reading /contact while her form sits at /contact/connect with no
  // challenge on it. Markey replaced her and the very next sweep walked his
  // page, found no challenge either, and recorded the recipe as binding, so
  // the test broke on a true result. The second assertion never checked what
  // it claimed: captchaFreeFormFor returns null for Markey because he is
  // absent from a 17-name verified list and a 5-row CAPTCHA audit, which it
  // would do for a senator with no challenge at all.
  //
  // Whether one office challenges today is the sweep's to decide and it
  // re-decides on every run, so it does not belong in an assertion. The
  // behaviour does: an office the sweep set aside is not filable, however it
  // came to be set aside.
  it('refuses an office the sweep did not confirm, and files for one it did', async () => {
    resetRecipeCache();
    setRecipeResults({
      checkedAt: new Date().toISOString(),
      binds: ['B000001'],
      skipped: [{ bioguide: 'C000002', reason: 'a challenge on the page needs a person to solve it' }],
    });
    expect(hasWorkingRecipe('B000001')).toBe(true);
    expect(hasWorkingRecipe('C000002')).toBe(false);
    // Not in the sweep at all is the same answer as set aside by it.
    expect(hasWorkingRecipe('D000003')).toBe(false);
    resetRecipeCache();
  });

  it('files for Cortez Masto now that her form is known to bind', async () => {
    const r = await buildWebformQueueItem(body, cwc, 'c', active);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item.formUrl).toBe('recipe:C001113');
  });
  it('builds for a CAPTCHA-free non-CWC senator with a stable message key', async () => {
    const wyden = { ...body, legislator_id: 'W000779', legislator_name: 'Ron Wyden', advocate_state: 'OR', advocate_city: 'Portland' };
    const r = await buildWebformQueueItem(wyden, { ...cwc, zip: '97201' }, 'contact-families', new Set(['SOR02']));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // The recipe route wins over the hand-verified URL: a recipe is only
    // eligible once a sweep walked it against the live page, where the URL
    // rests on a verification from October.
    expect(r.item.formUrl).toBe('recipe:W000779');
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
