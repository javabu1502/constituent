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

  it('fails closed on an EMPTY office list instead of caching it', async () => {
    // An empty set means the fetch/parse broke — caching it would divert
    // every send to the webform fallback for 12h.
    const empty = vi.fn(async () => new Set<string>());
    await expect(getActiveOfficeCodesCached('senate', { loader: empty })).rejects.toThrow(/EMPTY/);
    // Not cached: the next call retries the loader rather than serving {}.
    const recovered = vi.fn(async () => new Set(['SNY01']));
    await expect(getActiveOfficeCodesCached('senate', { loader: recovered })).resolves.toBeTruthy();
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

  // The rate permit is claimed inside the client POST (postHouse/postSenate)
  // — see client.test.ts for the choke-point tests. A custom `sender` (as
  // used throughout this file) bypasses it by design as a test seam.

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

  it('maps rate-permit backpressure to retry-later (no error recorded, id kept for reuse)', async () => {
    const { RatePermitBackpressureError } = await import('../rate-permit');
    const busySender = async (): Promise<CwcResult> => {
      throw new RatePermitBackpressureError('cwc:senate:test', 45_000);
    };
    const outcome = await sendCwcDelivery(delivery, {
      messageKey: 'user1:campaign-1', environment: 'test', billLevel: 'federal',
      activeOffices: { loader: activeLoader }, sender: busySender, now: friday,
    });
    expect(outcome).toMatchObject({ sent: false, fallback: 'retry-later' });
    // The minted row stays pending — NOT flipped to error — so the retry
    // reuses the same DeliveryId.
    expect(rows).toHaveLength(1);
    expect(rows[0].status).not.toBe('error');
  });

  it('records 400-class rejections for monitoring, with the raw body persisted', async () => {
    const rejectSender = async (): Promise<CwcResult> => ({ ok: false, status: 400, errors: ['bad state'], raw: '<Errors><Error>bad state</Error></Errors>' });
    const outcome = await sendCwcDelivery(delivery, {
      messageKey: 'user1:campaign-1', environment: 'test', billLevel: 'federal',
      activeOffices: { loader: activeLoader }, sender: rejectSender, now: friday,
    });
    expect(outcome.sent).toBe(true); // the POST happened; the outcome is logged
    expect(rows[0]).toMatchObject({
      status: 'rejected', http_status: 400, errors: ['bad state'],
      raw_response: '<Errors><Error>bad state</Error></Errors>',
    });
  });

  it('maps an endpoint 429 to retry-later and keeps the row pending for id reuse', async () => {
    const limitedSender = async (): Promise<CwcResult> => ({ ok: false, status: 429, raw: 'slow down' });
    const outcome = await sendCwcDelivery(delivery, {
      messageKey: 'user1:campaign-1', environment: 'test', billLevel: 'federal',
      activeOffices: { loader: activeLoader }, sender: limitedSender, now: friday,
    });
    expect(outcome).toMatchObject({ sent: false, fallback: 'retry-later' });
    expect(rows[0]).toMatchObject({ status: 'pending', http_status: 429 });
  });
});

describe('House maintenance window in sendCwcDelivery', () => {
  it('defers House sends during the daily 12a-6a ET window', async () => {
    const { sendCwcDelivery: send } = await import('../send');
    const outcome = await send(
      {
        chamber: 'house', officeCode: 'HNY12', campaignId: 'campaign-1',
        constituent: {
          prefix: 'Ms.', firstName: 'Jane', lastName: 'Doe',
          address1: '350 5th Ave', city: 'New York', state: 'NY', zip: '10118-0110', email: 'jane@example.com',
        },
        message: { subject: 'Please support lowering insulin prices', topics: ['Health'], constituentMessage: 'As a nurse, I see insulin costs hurt my patients.' },
      },
      {
        messageKey: 'user1:campaign-1', environment: 'test', billLevel: 'federal',
        activeOffices: { loader: async () => new Set(['HNY12']) },
        sender: async () => ({ ok: true, status: 200 }),
        now: new Date('2026-08-14T05:30:00Z'), // Fri 1:30a EDT — House window, no SCWC window
      },
    );
    expect(outcome).toMatchObject({ sent: false, fallback: 'retry-later' });
    if (!outcome.sent) expect(outcome.reason).toMatch(/House CWC maintenance/);
  });
});

describe('production wiring locks (compliance verification 2026-08-31)', () => {
  const prodDelivery: CwcDelivery = {
    chamber: 'senate', officeCode: 'SNY01', campaignId: 'campaign-1',
    constituent: {
      prefix: 'Ms.', firstName: 'Jane', lastName: 'Doe',
      address1: '350 5th Ave', city: 'New York', state: 'NY', zip: '10118-0110', email: 'jane@example.com',
    },
    message: { subject: 'Please support lowering insulin prices', topics: ['Health'], constituentMessage: 'As a nurse, I see insulin costs hurt my patients.' },
  };

  it('production ALWAYS verifies the constituent — a failing verifier refuses the send', async () => {
    const sender = vi.fn(async (): Promise<CwcResult> => ({ ok: true, status: 201 }));
    const outcome = await sendCwcDelivery(prodDelivery, {
      messageKey: 'user1:campaign-1', environment: 'production', billLevel: 'federal',
      activeOffices: { loader: async () => new Set(['SNY01']) },
      sender,
      now: new Date('2026-08-14T16:00:00Z'),
      verifier: async () => ({ ok: false, reason: 'STATE_MISMATCH', detail: 'address is in NJ' }),
    });
    expect(outcome).toMatchObject({ sent: false, fallback: 'not-constituent' });
    expect(sender).not.toHaveBeenCalled();
  });

  it('skipActiveOfficeCheck is refused outright in production', async () => {
    await expect(
      sendCwcDelivery(prodDelivery, {
        messageKey: 'user1:campaign-1', environment: 'production', billLevel: 'federal',
        skipActiveOfficeCheck: true,
        sender: async () => ({ ok: true, status: 201 }),
        verifier: async () => ({ ok: true, officeCode: 'SNY01' }),
        now: new Date('2026-08-14T16:00:00Z'),
      }),
    ).rejects.toThrow(/TEST-environment escape hatch/);
  });
});
