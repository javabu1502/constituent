import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { enqueueCwcDeliveries, processCwcSendQueue, setSendQueueClientFactory, type SendQueueJob } from '../queue';
import { CwcComplianceError } from '../content';
import { RatePermitBackpressureError } from '../rate-permit';
import type { CwcDelivery } from '../types';
import type { SendCwcOutcome } from '../send';

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

function job(overrides: Partial<SendQueueJob> = {}): SendQueueJob {
  return {
    id: 1, message_key: 'u1:c1', office_code: 'SNY01', environment: 'test',
    chamber: 'senate', campaign_id: 'campaign-1', delivery,
    bill_level: 'none', status: 'leased', attempts: 1, max_attempts: 8,
    ...overrides,
  };
}

describe('cwc send queue', () => {
  let upserts: Array<{ rows: unknown[]; opts: unknown }>;
  let updates: Array<{ patch: Record<string, unknown>; id: unknown }>;
  let claimArgs: Record<string, unknown> | null;
  let claimed: SendQueueJob[];

  function fakeDb() {
    return {
      rpc: async (_fn: string, args: Record<string, unknown>) => {
        claimArgs = args;
        return { data: claimed, error: null };
      },
      from: () => ({
        upsert: async (rows: unknown[], opts: unknown) => {
          upserts.push({ rows, opts });
          return { error: null, count: (rows as unknown[]).length };
        },
        update: (patch: Record<string, unknown>) => ({
          eq: async (_col: string, id: unknown) => {
            updates.push({ patch, id });
            return { error: null };
          },
        }),
      }),
    } as unknown as ReturnType<typeof import('@/lib/supabase').createAdminClient>;
  }

  beforeEach(() => {
    upserts = [];
    updates = [];
    claimArgs = null;
    claimed = [];
    setSendQueueClientFactory(fakeDb);
  });
  afterEach(() => setSendQueueClientFactory());

  describe('enqueueCwcDeliveries', () => {
    it('gates at the boundary: an unsendable item refuses the whole enqueue', async () => {
      await expect(
        enqueueCwcDeliveries(
          [{ delivery, messageKey: 'u1:c1', billLevel: 'state' as never }],
          'test',
        ),
      ).rejects.toThrow(CwcComplianceError);
      expect(upserts).toHaveLength(0);
    });

    it('upserts with ignoreDuplicates on the queue identity (idempotent re-enqueue)', async () => {
      const { enqueued } = await enqueueCwcDeliveries(
        [{ delivery, messageKey: 'u1:c1', billLevel: 'none' }],
        'test',
      );
      expect(enqueued).toBe(1);
      expect(upserts[0].opts).toMatchObject({
        onConflict: 'message_key,office_code,environment',
        ignoreDuplicates: true,
      });
      expect(upserts[0].rows[0]).toMatchObject({
        message_key: 'u1:c1', office_code: 'SNY01', environment: 'test',
        chamber: 'senate', bill_level: 'none',
      });
    });
  });

  describe('processCwcSendQueue', () => {
    const sent: SendCwcOutcome = { sent: true, deliveryId: 'x'.repeat(32), retried: false, result: { ok: true, status: 201 } };

    it('claims with worker/limit/lease and marks delivered jobs sent', async () => {
      claimed = [job()];
      const send = vi.fn(async () => sent);
      const summary = await processCwcSendQueue({ workerId: 'w1', environment: 'test', limit: 5, leaseSeconds: 60, send });
      expect(claimArgs).toEqual({ p_worker: 'w1', p_limit: 5, p_lease_seconds: 60 });
      expect(send).toHaveBeenCalledWith(delivery, expect.objectContaining({
        messageKey: 'u1:c1', environment: 'test', billLevel: 'none',
      }));
      expect(summary).toMatchObject({ claimed: 1, sent: 1 });
      expect(updates[0].patch).toMatchObject({ status: 'sent', leased_by: null, lease_expires_at: null });
    });

    it('retry-later re-queues with backoff and GIVES BACK the attempt', async () => {
      claimed = [job({ attempts: 3 })];
      const t0 = 1_000_000;
      const send = vi.fn(async (): Promise<SendCwcOutcome> => ({ sent: false, fallback: 'retry-later', reason: 'maintenance' }));
      const summary = await processCwcSendQueue({ workerId: 'w', environment: 'test', send, now: () => t0 });
      expect(summary.deferred).toBe(1);
      expect(updates[0].patch).toMatchObject({ status: 'queued', attempts: 2, last_error: 'maintenance' });
      expect(new Date(updates[0].patch.run_after as string).getTime()).toBeGreaterThan(t0);
    });

    it('router and not-constituent are terminal (webform path / refusal own them)', async () => {
      claimed = [job({ id: 1 }), job({ id: 2, message_key: 'u2:c1' })];
      const outcomes: SendCwcOutcome[] = [
        { sent: false, fallback: 'router', reason: 'not participating' },
        { sent: false, fallback: 'not-constituent', reason: 'state mismatch' },
      ];
      const send = vi.fn(async () => outcomes.shift()!);
      const summary = await processCwcSendQueue({ workerId: 'w', environment: 'test', send });
      expect(summary).toMatchObject({ routed: 1, refused: 1 });
      expect(updates.map((u) => u.patch.status)).toEqual(['routed', 'refused']);
    });

    it('compliance errors are terminal failures — retrying a bad payload is noise', async () => {
      claimed = [job()];
      const send = vi.fn(async () => { throw new CwcComplianceError(['bad']); });
      const summary = await processCwcSendQueue({ workerId: 'w', environment: 'test', send });
      expect(summary.failed).toBe(1);
      expect(updates[0].patch.status).toBe('failed');
    });

    it('backpressure re-queues at the allocator-hinted time, attempt given back', async () => {
      claimed = [job({ attempts: 2 })];
      const t0 = 500_000;
      const send = vi.fn(async () => { throw new RatePermitBackpressureError('cwc:senate:test', 45_000); });
      const summary = await processCwcSendQueue({ workerId: 'w', environment: 'test', send, now: () => t0 });
      expect(summary.deferred).toBe(1);
      expect(updates[0].patch).toMatchObject({ status: 'queued', attempts: 1 });
      expect(new Date(updates[0].patch.run_after as string).getTime()).toBe(t0 + 45_000);
    });

    it('transient errors back off until the budget is spent, then fail', async () => {
      claimed = [job({ attempts: 2 })];
      const send = vi.fn(async () => { throw new Error('ECONNRESET'); });
      let summary = await processCwcSendQueue({ workerId: 'w', environment: 'test', send, now: () => 0 });
      expect(summary.deferred).toBe(1);
      expect(updates[0].patch.status).toBe('queued');
      // 2nd attempt backoff = 2^1 * 60s
      expect(new Date(updates[0].patch.run_after as string).getTime()).toBe(2 * 60_000);

      updates = [];
      claimed = [job({ attempts: 8 })]; // final attempt
      summary = await processCwcSendQueue({ workerId: 'w', environment: 'test', send, now: () => 0 });
      expect(summary.failed).toBe(1);
      expect(updates[0].patch.status).toBe('failed');
    });
  });
});
