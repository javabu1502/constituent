import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getOrCreateDeliveryId,
  recordDeliveryResult,
  statusFromHttp,
  xmlSha256,
  setDeliveryLogClientFactory,
} from '../delivery-log';

// In-memory stand-in for the cwc_deliveries table so no test ever needs live
// Supabase credentials (or the network). Implements just the query chains the
// module uses: select().eq()×3.maybeSingle(), insert(), update().eq().
interface Row {
  delivery_id: string;
  message_key: string;
  office_code: string;
  environment: string;
  campaign_id: string;
  chamber: string;
  status: string;
  http_status?: number | null;
  errors?: string[] | null;
  xml_sha256?: string;
  updated_at?: string;
}

function fakeDb(rows: Row[], opts: { missSelects?: number } = {}) {
  let misses = opts.missSelects ?? 0;
  const from = () => ({
    select: () => {
      const filters: Array<[keyof Row, unknown]> = [];
      const chain = {
        eq(col: keyof Row, val: unknown) {
          filters.push([col, val]);
          return chain;
        },
        async maybeSingle() {
          if (misses > 0) {
            misses--; // simulate a select that raced ahead of another insert
            return { data: null, error: null };
          }
          const hit = rows.find((r) => filters.every(([c, v]) => r[c] === v));
          return { data: hit ?? null, error: null };
        },
      };
      return chain;
    },
    insert: async (row: Row) => {
      const dup = rows.some(
        (r) =>
          r.message_key === row.message_key &&
          r.office_code === row.office_code &&
          r.environment === row.environment,
      );
      if (dup) return { error: { code: '23505', message: 'duplicate key' } };
      rows.push({ ...row });
      return { error: null };
    },
    update: (patch: Partial<Row>) => ({
      eq: async (col: keyof Row, val: unknown) => {
        for (const r of rows) if (r[col] === val) Object.assign(r, patch);
        return { error: null };
      },
    }),
  });
  return { from };
}

describe('delivery log (idempotent DeliveryId + monitoring)', () => {
  let rows: Row[];

  beforeEach(() => {
    rows = [];
    setDeliveryLogClientFactory(() => fakeDb(rows) as unknown as ReturnType<typeof import('@/lib/supabase').createAdminClient>);
  });
  afterEach(() => setDeliveryLogClientFactory());

  const meta = { campaignId: 'campaign-1', chamber: 'senate' as const };

  it('mints a fresh 32-char id on first use and stores the row as pending', async () => {
    const { deliveryId, existing } = await getOrCreateDeliveryId('msg-1', 'SNY01', 'test', meta);
    expect(existing).toBe(false);
    expect(deliveryId).toMatch(/^[a-zA-Z0-9]{32}$/);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ message_key: 'msg-1', office_code: 'SNY01', environment: 'test', status: 'pending' });
  });

  it('REUSES the existing id on retry — never regenerates (no duplicate sends)', async () => {
    const first = await getOrCreateDeliveryId('msg-1', 'SNY01', 'test', meta);
    const retry = await getOrCreateDeliveryId('msg-1', 'SNY01', 'test', meta);
    expect(retry.deliveryId).toBe(first.deliveryId);
    expect(retry.existing).toBe(true);
    expect(rows).toHaveLength(1);
  });

  it('scopes idempotency to (messageKey, officeCode, environment)', async () => {
    const a = await getOrCreateDeliveryId('msg-1', 'SNY01', 'test', meta);
    const otherOffice = await getOrCreateDeliveryId('msg-1', 'SNY03', 'test', meta);
    const otherEnv = await getOrCreateDeliveryId('msg-1', 'SNY01', 'production', meta);
    expect(otherOffice.deliveryId).not.toBe(a.deliveryId);
    expect(otherEnv.deliveryId).not.toBe(a.deliveryId);
    expect(rows).toHaveLength(3);
  });

  it('recovers from an insert race by reusing the winner’s id', async () => {
    const winner = await getOrCreateDeliveryId('msg-1', 'SNY01', 'test', meta);
    // Simulate the race: the loser's initial SELECT misses (missSelects: 1),
    // its INSERT hits the unique violation (23505), and the re-select must
    // return the winner's id rather than erroring or double-sending.
    setDeliveryLogClientFactory(
      () => fakeDb(rows, { missSelects: 1 }) as unknown as ReturnType<typeof import('@/lib/supabase').createAdminClient>,
    );
    const raced = await getOrCreateDeliveryId('msg-1', 'SNY01', 'test', meta);
    expect(raced.deliveryId).toBe(winner.deliveryId);
    expect(raced.existing).toBe(true);
    expect(rows).toHaveLength(1);
  });

  it('records outcomes — including the 400/500-class rows SOAPBox requires monitoring', async () => {
    const { deliveryId } = await getOrCreateDeliveryId('msg-1', 'SNY01', 'test', meta);
    await recordDeliveryResult(deliveryId, {
      status: 'rejected',
      httpStatus: 400,
      errors: ['StateAbbreviation is invalid'],
      xmlSha256: xmlSha256('<CWC/>'),
    });
    expect(rows[0]).toMatchObject({
      status: 'rejected',
      http_status: 400,
      errors: ['StateAbbreviation is invalid'],
      xml_sha256: xmlSha256('<CWC/>'),
    });
    expect(rows[0].updated_at).toBeTruthy();
  });
});

describe('statusFromHttp', () => {
  it('maps response classes to delivery statuses (409 = already delivered)', () => {
    expect(statusFromHttp(201)).toBe('delivered');
    expect(statusFromHttp(409)).toBe('delivered'); // duplicate DeliveryId → prior attempt landed
    expect(statusFromHttp(429)).toBe('pending'); // rate-limited, not a verdict — retry reuses the id
    expect(statusFromHttp(400)).toBe('rejected');
    expect(statusFromHttp(415)).toBe('rejected');
    expect(statusFromHttp(500)).toBe('error');
    expect(statusFromHttp(503)).toBe('error');
  });
});
