import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getActiveOfficeCodesCached, clearActiveOfficeCache, sendCwcDelivery } from '../send';
import { setDeliveryLogClientFactory } from '../delivery-log';
import { setRatePermitClientFactory } from '../rate-permit';
import { CwcComplianceError } from '../content';
import type { CwcDelivery } from '../types';
import type { CwcResult } from '../client';

// NOTE: no test here ever performs a network call — the active-offices loader
// and the sender are always stubbed (the real loader hits the live API).

beforeEach(() => {
  clearActiveOfficeCache();
  process.env.CWC_DELIVERY_AGENT = 'My Democracy LLC';
  process.env.CWC_ACK_EMAIL = 'ack@mydemocracy.app';
  process.env.CWC_CONTACT_NAME = 'Jared Busker';
  process.env.CWC_CONTACT_EMAIL = 'jared@busker.consulting';
  process.env.CWC_CONTACT_PHONE = '202-555-0142';
});

describe('getActiveOfficeCodesCached', () => {
  it('caches for ~12h, honors forceRefresh, and expires by TTL', async () => {
    const loader = vi.fn(async () => new Set(['SNY01']));
    let clock = 0;
    const now = () => clock;

    await getActiveOfficeCodesCached('senate', { loader, now });
    await getActiveOfficeCodesCached('senate', { loader, now });
    expect(loader).toHaveBeenCalledTimes(1); // second call served from cache

    await getActiveOfficeCodesCached('senate', { loader, now, forceRefresh: true });
    expect(loader).toHaveBeenCalledTimes(2); // explicit refresh reloads

    clock = 12 * 60 * 60 * 1000 + 1; // past the TTL
    await getActiveOfficeCodesCached('senate', { loader, now });
    expect(loader).toHaveBeenCalledTimes(3);
  });

  it('caches per chamber+mode', async () => {
    const loader = vi.fn(async (chamber: string) => new Set([chamber === 'senate' ? 'SNY01' : 'HNY12']));
    const senate = await getActiveOfficeCodesCached('senate', { loader });
    const house = await getActiveOfficeCodesCached('house', { loader });
    expect(senate.has('SNY01')).toBe(true);
    expect(house.has('HNY12')).toBe(true);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

describe('sendCwcDelivery orchestration', () => {
  // Minimal in-memory delivery log (same chains delivery-log.ts uses).
  interface Row { delivery_id: string; message_key: string; office_code: string; environment: string; status: string; http_status?: number | null; [k: string]: unknown }
  let rows: Row[];
  function fakeDb() {
    return {
      from: () => ({
        select: () => {
          const filters: Array<[string, unknown]> = [];
          const chain = {
            eq(col: string, val: unknown) { filters.push([col, val]); return chain; },
            async maybeSingle() {
              const hit = rows.find((r) => filters.every(([c, v]) => r[c] === v));
              return { data: hit ?? null, error: null };
            },
          };
          return chain;
        },
        insert: async (row: Row) => { rows.push({ ...row }); return { error: null }; },
        update: (patch: Partial<Row>) => ({
          eq: async (col: string, val: unknown) => {
            for (const r of rows) if (r[col] === val) Object.assign(r, patch);
            return { error: null };
          },
        }),
      }),
    } as unknown as ReturnType<typeof import('@/lib/supabase').createAdminClient>;
  }

  // Rate-permit allocator stub: immediate slot, records each claim.
  let permitClaims: Array<{ scope: string; gapMs: number }>;
  function fakePermitDb() {
    return {
      rpc: async (_fn: string, args: { p_scope: string; p_min_gap_ms: number }) => {
        permitClaims.push({ scope: args.p_scope, gapMs: args.p_min_gap_ms });
        return { data: new Date(0).toISOString(), error: null };
      },
    } as unknown as ReturnType<typeof import('@/lib/supabase').createAdminClient>;
  }

  beforeEach(() => {
    rows = [];
    permitClaims = [];
    setDeliveryLogClientFactory(fakeDb);
    setRatePermitClientFactory(fakePermitDb);
  });
  afterEach(() => {
    setDeliveryLogClientFactory();
    setRatePermitClientFactory();
  });

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
  const activeLoader = async () => new Set(['SNY01']);
  const okSender = async (): Promise<CwcResult> => ({ ok: true, status: 201 });
  const friday = new Date('2026-08-14T16:00:00Z');

  it('claims a shared rate-permit slot for the right scope before sending', async () => {
    await sendCwcDelivery(delivery, {
      messageKey: 'user1:campaign-1',
      environment: 'test',
      billLevel: 'federal',
      activeOffices: { loader: activeLoader },
      sender: okSender,
      now: friday,
    });
    expect(permitClaims).toEqual([{ scope: 'cwc:senate:test', gapMs: 200 }]);
  });

  it('skips the rate permit only when explicitly disabled', async () => {
    await sendCwcDelivery(delivery, {
      messageKey: 'user1:campaign-1',
      environment: 'test',
      billLevel: 'federal',
      activeOffices: { loader: activeLoader },
      sender: okSender,
      now: friday,
      ratePermit: false,
    });
    expect(permitClaims).toEqual([]);
  });

  it('sends through every gate and records the outcome', async () => {
    const outcome = await sendCwcDelivery(delivery, {
      messageKey: 'user1:campaign-1',
      environment: 'test',
      billLevel: 'federal',
      activeOffices: { loader: activeLoader },
      sender: okSender,
      now: friday,
    });
    expect(outcome.sent).toBe(true);
    if (outcome.sent) {
      expect(outcome.deliveryId).toMatch(/^[a-zA-Z0-9]{32}$/);
      expect(outcome.retried).toBe(false);
    }
    expect(rows[0]).toMatchObject({ status: 'delivered', http_status: 201 });
    expect(rows[0].xml_sha256).toBeTruthy();
  });

  it('reuses the SAME DeliveryId on retry (idempotent — no duplicates)', async () => {
    const opts = {
      messageKey: 'user1:campaign-1', environment: 'test' as const, billLevel: 'federal' as const,
      activeOffices: { loader: activeLoader }, sender: okSender, now: friday,
    };
    const first = await sendCwcDelivery(delivery, opts);
    const retry = await sendCwcDelivery(delivery, opts);
    expect(first.sent && retry.sent).toBe(true);
    if (first.sent && retry.sent) {
      expect(retry.deliveryId).toBe(first.deliveryId);
      expect(retry.retried).toBe(true);
    }
    expect(rows).toHaveLength(1);
  });

  it('refuses offices not on the active list → router fallback (webform/email)', async () => {
    const sender = vi.fn(okSender);
    const outcome = await sendCwcDelivery(
      { ...delivery, officeCode: 'SNY03' },
      {
        messageKey: 'user1:campaign-1', environment: 'test', billLevel: 'federal',
        activeOffices: { loader: activeLoader }, sender, now: friday,
      },
    );
    expect(outcome).toMatchObject({ sent: false, fallback: 'router' });
    expect(sender).not.toHaveBeenCalled();
    expect(rows).toHaveLength(0); // no id burned for a message that never went out
  });

  it('defers Senate sends during an SCWC maintenance window', async () => {
    const outcome = await sendCwcDelivery(delivery, {
      messageKey: 'user1:campaign-1', environment: 'test', billLevel: 'federal',
      activeOffices: { loader: activeLoader }, sender: okSender,
      now: new Date('2026-08-16T07:30:00Z'), // Sun 3:30a EDT
    });
    expect(outcome).toMatchObject({ sent: false, fallback: 'retry-later' });
  });

  it('throws the compliance gate for a state-bill campaign', async () => {
    await expect(
      sendCwcDelivery(delivery, {
        messageKey: 'user1:campaign-1', environment: 'test', billLevel: 'state',
        activeOffices: { loader: activeLoader }, sender: okSender, now: friday,
      }),
    ).rejects.toThrow(CwcComplianceError);
  });

  it('records 400-class rejections for monitoring', async () => {
    const rejectSender = async (): Promise<CwcResult> => ({ ok: false, status: 400, errors: ['bad state'] });
    const outcome = await sendCwcDelivery(delivery, {
      messageKey: 'user1:campaign-1', environment: 'test', billLevel: 'federal',
      activeOffices: { loader: activeLoader }, sender: rejectSender, now: friday,
    });
    expect(outcome.sent).toBe(true); // the POST happened; the outcome is logged
    expect(rows[0]).toMatchObject({ status: 'rejected', http_status: 400, errors: ['bad state'] });
  });
});
