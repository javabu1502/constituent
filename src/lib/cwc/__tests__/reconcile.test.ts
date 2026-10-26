import { describe, it, expect } from 'vitest';
import { reconcileDeliveryStatuses, ORPHAN_GRACE_MS } from '../reconcile';

/**
 * Two real sends sat at "Sending to Congress" and "Sending to the office
 * form" for six days. One had never been queued; the other had failed three
 * times. The drain could not correct either, because the queue rows carried
 * no message id. This is the backstop.
 */
type Row = Record<string, unknown>;

function fakeDb(tables: { messages: Row[]; cwc: Row[]; webform: Row[] }) {
  const updates: Array<{ id: string; status: string }> = [];
  const make = (rows: Row[], table: string) => {
    const q: Record<string, unknown> = {};
    const self = {
      select: () => self,
      in(col: string, vals: string[]) { q[col] = vals; return self; },
      eq(col: string, val: string) { q[col] = val; return self; },
      limit() { return Promise.resolve({ data: filtered(), error: null }); },
      update(patch: Record<string, unknown>) {
        return {
          eq(_c: string, id: string) {
            updates.push({ id, status: String(patch.delivery_status) });
            const row = rows.find((r) => r.id === id);
            if (row) row.delivery_status = patch.delivery_status;
            return Promise.resolve({ error: null });
          },
        };
      },
      then(resolve: (v: { data: Row[]; error: null }) => void) { return resolve({ data: filtered(), error: null }); },
    };
    const filtered = () =>
      rows.filter((r) => {
        const want = q['delivery_status'] ?? q['status'];
        if (Array.isArray(want)) return want.includes(r.delivery_status ?? r.status);
        return true;
      });
    void table;
    return self;
  };
  return {
    db: { from: (t: string) => make(t === 'messages' ? tables.messages : t === 'cwc_send_queue' ? tables.cwc : tables.webform, t) },
    updates,
  };
}

const OLD = new Date(Date.now() - ORPHAN_GRACE_MS - 60_000).toISOString();
const NEW = new Date().toISOString();

describe('reconciling delivery status from the queues', () => {
  // Real bioguide ids, because the fallback match resolves the message's
  // legislator to an office code. K000384 = Tim Kaine (SVA01),
  // W000805 = Mark Warner (SVA02).
  it('repairs a legacy row with no messageId by matching sender AND office', async () => {
    const { db, updates } = fakeDb({
      messages: [{ id: 'm1', delivery_status: 'cwc_submitted', advocate_email: 'A@Liberty.edu', legislator_id: 'K000384', created_at: OLD }],
      cwc: [{ id: 9, status: 'sent', office_code: 'SVA01', delivery: { constituent: { email: 'a@liberty.edu' } } }],
      webform: [],
    });
    const r = await reconcileDeliveryStatuses(db as never);
    expect(updates).toEqual([{ id: 'm1', status: 'cwc_delivered' }]);
    expect(r.repaired).toBe(1);
  });

  /**
   * The case a production dry run caught. One sender wrote to three offices
   * in one sitting. Matching a legacy queue row on the email alone handed a
   * queue row for one member to a pending message addressed to another, and
   * would have reported a delivery that never happened.
   */
  it('refuses to claim a delivery from another member\u2019s queue row', async () => {
    const { db, updates } = fakeDb({
      messages: [{ id: 'warner', delivery_status: 'cwc_submitted', advocate_email: 's@liberty.edu', legislator_id: 'W000805', created_at: OLD }],
      // The only settled row belongs to Kaine's seat, not Warner's.
      cwc: [{ id: 9, status: 'sent', office_code: 'SVA01', delivery: { constituent: { email: 's@liberty.edu' } } }],
      webform: [],
    });
    const r = await reconcileDeliveryStatuses(db as never);
    expect(updates).toEqual([{ id: 'warner', status: 'cwc_failed' }]);
    expect(r.repaired).toBe(0);
    expect(r.orphaned).toBe(1);
  });

  it('prefers an explicit messageId over the email match', async () => {
    const { db, updates } = fakeDb({
      messages: [
        { id: 'm1', delivery_status: 'cwc_submitted', advocate_email: 'a@x.com', legislator_id: 'K1', created_at: OLD },
        { id: 'm2', delivery_status: 'cwc_submitted', advocate_email: 'a@x.com', legislator_id: 'K2', created_at: OLD },
      ],
      cwc: [{ id: 1, status: 'refused', office_code: 'SVA02', delivery: { messageId: 'm2', constituent: { email: 'a@x.com' } } }],
      webform: [],
    });
    const r = await reconcileDeliveryStatuses(db as never);
    // m2 is the one the queue row names, so it takes the refusal rather than
    // m1 simply because m1 shares the sender's address.
    expect(updates[0]).toEqual({ id: 'm2', status: 'cwc_refused' });
    expect(r.repaired).toBe(1);
    // m1 has no queue row of its own and is past the grace period, so it is
    // failed too. It was never going anywhere.
    expect(updates).toContainEqual({ id: 'm1', status: 'cwc_failed' });
    expect(r.orphaned).toBe(1);
  });

  it('marks a permanently failed webform send as not delivered', async () => {
    const { db, updates } = fakeDb({
      messages: [{ id: 'm1', delivery_status: 'webform_submitted', advocate_email: 'b@x.com', legislator_id: 'D1', created_at: OLD }],
      cwc: [],
      webform: [{ id: 1, status: 'failed', official_id: 'D1', constituent: { email: 'b@x.com' } }],
    });
    await reconcileDeliveryStatuses(db as never);
    expect(updates).toEqual([{ id: 'm1', status: 'webform_failed' }]);
  });

  // A 'routed' job is parked when the office leaves the active list. Nothing
  // picks it up, so it is not on its way to anyone.
  it('does not leave a routed job looking like it is in flight', async () => {
    const { db, updates } = fakeDb({
      messages: [{ id: 'm1', delivery_status: 'cwc_submitted', advocate_email: 'c@x.com', legislator_id: 'K1', created_at: OLD }],
      cwc: [{ id: 1, status: 'routed', office_code: 'SNV01', delivery: { messageId: 'm1' } }],
      webform: [],
    });
    await reconcileDeliveryStatuses(db as never);
    expect(updates).toEqual([{ id: 'm1', status: 'cwc_failed' }]);
  });

  it('fails a message that was never queued at all, once the grace period is up', async () => {
    const { db, updates } = fakeDb({
      messages: [{ id: 'm1', delivery_status: 'cwc_submitted', advocate_email: 'd@x.com', legislator_id: 'W1', created_at: OLD }],
      cwc: [],
      webform: [],
    });
    const r = await reconcileDeliveryStatuses(db as never);
    expect(updates).toEqual([{ id: 'm1', status: 'cwc_failed' }]);
    expect(r.orphaned).toBe(1);
  });

  it('leaves a just-submitted message alone while it is still being enqueued', async () => {
    const { db, updates } = fakeDb({
      messages: [{ id: 'm1', delivery_status: 'cwc_submitted', advocate_email: 'e@x.com', legislator_id: 'W1', created_at: NEW }],
      cwc: [],
      webform: [],
    });
    await reconcileDeliveryStatuses(db as never);
    expect(updates).toEqual([]);
  });

  it('never rewrites a status that already agrees with the queue', async () => {
    const { db, updates } = fakeDb({
      messages: [{ id: 'm1', delivery_status: 'cwc_submitted', advocate_email: 'f@x.com', legislator_id: 'W1', created_at: OLD }],
      cwc: [{ id: 1, status: 'sent', office_code: 'SNV01', delivery: { messageId: 'm1' } }],
      webform: [],
    });
    await reconcileDeliveryStatuses(db as never);
    expect(updates).toEqual([{ id: 'm1', status: 'cwc_delivered' }]);
    const again = await reconcileDeliveryStatuses(db as never);
    expect(again.repaired).toBe(0);
  });
});
