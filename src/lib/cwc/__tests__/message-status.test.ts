import { describe, it, expect } from 'vitest';
import {
  CWC_MESSAGE_STATUS, WEBFORM_MESSAGE_STATUS,
  countsAsSentToCongress, isNotDelivered, setMessageDeliveryStatus,
} from '../message-status';

describe('message delivery status sets', () => {
  it('counts submitted, held and delivered as sent so existing totals do not change', () => {
    for (const s of ['cwc_submitted', 'cwc_held', 'cwc_delivered', 'webform_submitted', 'webform_held', 'webform_delivered']) {
      expect(countsAsSentToCongress(s), s).toBe(true);
      expect(isNotDelivered(s), s).toBe(false);
    }
  });
  it('never counts refused, failed, skipped or blocked as sent', () => {
    for (const s of ['cwc_refused', 'cwc_failed', 'cwc_skipped', 'cwc_blocked', 'webform_failed', 'webform_skipped', 'webform_blocked']) {
      expect(countsAsSentToCongress(s), s).toBe(false);
      expect(isNotDelivered(s), s).toBe(true);
    }
  });
  it('treats legacy and email statuses as neither', () => {
    for (const s of ['email_opened', 'sent', 'called', '', null, undefined]) {
      expect(countsAsSentToCongress(s)).toBe(false);
      expect(isNotDelivered(s)).toBe(false);
    }
  });
  it('every constant is in exactly one set', () => {
    const all = [...Object.values(CWC_MESSAGE_STATUS), ...Object.values(WEBFORM_MESSAGE_STATUS)];
    for (const s of all) expect(countsAsSentToCongress(s) !== isNotDelivered(s), s).toBe(true);
  });
});

describe('setMessageDeliveryStatus', () => {
  function fakeDb(result: { error: { message: string } | null } = { error: null }) {
    const calls: Array<{ table: string; patch: Record<string, unknown>; id: unknown }> = [];
    const db = {
      from: (table: string) => ({
        update: (patch: Record<string, unknown>) => ({
          eq: async (_col: string, id: unknown) => { calls.push({ table, patch, id }); return result; },
        }),
      }),
    } as unknown as ReturnType<typeof import('@/lib/supabase').createAdminClient>;
    return { db, calls };
  }

  it('updates messages.delivery_status for the given row', async () => {
    const { db, calls } = fakeDb();
    expect(await setMessageDeliveryStatus(db, 'm1', 'cwc_delivered')).toBe(true);
    expect(calls).toEqual([{ table: 'messages', patch: { delivery_status: 'cwc_delivered' }, id: 'm1' }]);
  });
  it('is a no-op without a message id (legacy queue rows)', async () => {
    const { db, calls } = fakeDb();
    expect(await setMessageDeliveryStatus(db, undefined, 'cwc_refused')).toBe(false);
    expect(calls).toHaveLength(0);
  });
  it('never throws on a database error', async () => {
    const { db } = fakeDb({ error: { message: 'boom' } });
    expect(await setMessageDeliveryStatus(db, 'm1', 'cwc_failed')).toBe(false);
  });
});
