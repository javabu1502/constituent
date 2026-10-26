import { describe, it, expect, vi, beforeEach } from 'vitest';

const rows: Array<{ user_id: string | null; ip_hash: string | null; action_type: string }> = [];

vi.mock('@/lib/supabase', () => ({
  createAdminClient: () => ({
    from: () => {
      const q: Record<string, unknown> = {};
      const self = {
        select: () => self,
        eq(col: string, val: string) { q[col] = val; return self; },
        gte() { return self; },
        insert(row: Record<string, unknown>) {
          rows.push(row as never);
          return Promise.resolve({ error: null });
        },
        then(resolve: (v: { count: number; error: null }) => void) {
          const count = rows.filter(
            (r) =>
              r.action_type === q.action_type &&
              (q.user_id ? r.user_id === q.user_id : r.ip_hash === q.ip_hash),
          ).length;
          return resolve({ count, error: null });
        },
      };
      return self;
    },
  }),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) }));

const { enforceOfficeSendQuota, OFFICE_SEND_DAILY_LIMIT, hashSender } = await import('../usage-quota');

/**
 * The limit that stops one person putting forty messages a minute into a
 * single congressional office, without stopping a lecture hall of students
 * writing to their own senators from one Wi-Fi network.
 */
describe('per-office daily send cap', () => {
  beforeEach(() => { rows.length = 0; });

  it('allows the first few and refuses the next', async () => {
    const send = () => enforceOfficeSendQuota({ email: 'one@example.com', officialId: 'S001234' });
    for (let i = 0; i < OFFICE_SEND_DAILY_LIMIT; i++) {
      expect((await send()).allowed, `send ${i + 1}`).toBe(true);
    }
    expect((await send()).allowed).toBe(false);
  });

  it('counts each office separately, so writing to both senators and a rep is fine', async () => {
    for (const officialId of ['S000001', 'S000002', 'H000003']) {
      const r = await enforceOfficeSendQuota({ email: 'one@example.com', officialId });
      expect(r.allowed, officialId).toBe(true);
    }
  });

  /**
   * The case that decides the design. Four students on one lecture-hall
   * network wrote to the same three offices. Counting by network address
   * would have stopped them, which is the opposite of what this product is
   * for, so the counter keys on the sender.
   */
  it('does not let one sender’s limit block another sender', async () => {
    const classroom = ['a@liberty.edu', 'b@liberty.edu', 'c@liberty.edu', 'd@liberty.edu'];
    for (const email of classroom) {
      for (let i = 0; i < OFFICE_SEND_DAILY_LIMIT; i++) {
        const r = await enforceOfficeSendQuota({ email, officialId: 'S001234' });
        expect(r.allowed, `${email} send ${i + 1}`).toBe(true);
      }
    }
    // And each of them is still individually capped.
    expect((await enforceOfficeSendQuota({ email: classroom[0], officialId: 'S001234' })).allowed).toBe(false);
  });

  it('treats the address case-insensitively, so capitalising it buys nothing', async () => {
    for (let i = 0; i < OFFICE_SEND_DAILY_LIMIT; i++) {
      await enforceOfficeSendQuota({ email: 'Flood@Example.com', officialId: 'S001234' });
    }
    expect((await enforceOfficeSendQuota({ email: 'flood@example.com ', officialId: 'S001234' })).allowed).toBe(false);
  });

  it('never stores the address itself', async () => {
    await enforceOfficeSendQuota({ email: 'private@example.com', officialId: 'S001234' });
    const stored = JSON.stringify(rows);
    expect(stored).not.toContain('private@example.com');
    expect(rows[0].ip_hash).toBe(hashSender('private@example.com'));
  });

  it('counts a signed-in sender against their account', async () => {
    await enforceOfficeSendQuota({ email: 'x@example.com', userId: 'user-1', officialId: 'S001234' });
    expect(rows[0].user_id).toBe('user-1');
    expect(rows[0].ip_hash).toBeNull();
  });

  it('allows a send it cannot attribute rather than blocking it', async () => {
    const r = await enforceOfficeSendQuota({ email: '', userId: null, officialId: 'S001234' });
    expect(r.allowed).toBe(true);
    expect(rows).toHaveLength(0);
  });
});
