import { describe, it, expect } from 'vitest';
import { getInitiativeCounts } from '../campaign-counts';

/**
 * One count, from rows, across a campaign and its steps.
 *
 * Four organization screens used to disagree because two read the stored
 * counter and two counted rows, and the counter is incremented by slug so
 * participation on a step never reaches the parent.
 */
function fakeDb(rows: Record<string, number>, children: string[] = []) {
  return {
    from(table: string) {
      const q: Record<string, unknown> = {};
      const self = {
        select: () => self,
        eq(col: string, val: string) { q[col] = val; return self; },
        in(col: string, vals: string[]) { q[col] = vals.join(','); return self; },
        then(resolve: (v: { count: number; error: null }) => void) {
          if (table === 'campaigns') {
            // the children lookup
            return resolve({ count: 0, error: null });
          }
          const key = `${table}:${String(q.delivery_status ?? 'all')}`;
          return resolve({ count: rows[key] ?? 0, error: null });
        },
      } as never;
      if (table === 'campaigns') {
        return {
          select: () => ({ eq: () => Promise.resolve({ data: children.map((id) => ({ id })) }) }),
        } as never;
      }
      return self;
    },
  } as never;
}

describe('getInitiativeCounts', () => {
  it('includes the steps, not just the parent', async () => {
    const db = fakeDb({ 'campaign_actions:all': 255, 'messages:all': 343 }, ['step-1', 'step-2']);
    const c = await getInitiativeCounts(db, 'parent');
    expect(c.campaignIds).toEqual(['parent', 'step-1', 'step-2']);
    expect(c.participants).toBe(255);
    expect(c.messages).toBe(343);
  });

  it('separates people from messages', async () => {
    const db = fakeDb({ 'campaign_actions:all': 10, 'messages:all': 25 });
    const c = await getInitiativeCounts(db, 'x');
    expect(c.participants).toBe(10);
    expect(c.messages).toBe(25);
  });

  it('derives self-sent so the buckets always sum to the total', async () => {
    const db = fakeDb({ 'messages:all': 100, 'campaign_actions:all': 40 });
    const c = await getInitiativeCounts(db, 'x');
    expect(c.delivered + c.inFlight + c.notDelivered + c.selfSent).toBe(c.messages);
  });

  it('never throws when a count fails', async () => {
    const broken = { from: () => { throw new Error('db down'); } } as never;
    const c = await getInitiativeCounts(broken, 'x');
    expect(c.participants).toBe(0);
    expect(c.messages).toBe(0);
  });
});
