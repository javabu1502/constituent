import { describe, it, expect, vi, beforeEach } from 'vitest';

const single = vi.fn();
const upsert = vi.fn(() => Promise.resolve({ error: null }));
const from = vi.fn(() => ({
  select: () => ({ eq: () => ({ eq: () => ({ single }) }) }),
  upsert,
}));

vi.mock('../supabase', () => ({ createAdminClient: () => ({ from }) }));

import { claimLegiscanBudget } from '../legiscan-api';

beforeEach(() => {
  single.mockReset();
  upsert.mockClear();
  from.mockClear();
});

describe('claimLegiscanBudget', () => {
  it('allows a claim that fits and records the new total', async () => {
    single.mockResolvedValue({ data: { data: { used: 100 } } });
    expect(await claimLegiscanBudget(25)).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ data: { used: 125 } }),
      expect.anything(),
    );
  });

  it('starts from zero when the month has no row yet', async () => {
    single.mockResolvedValue({ data: null });
    expect(await claimLegiscanBudget(25)).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ data: { used: 25 } }),
      expect.anything(),
    );
  });

  // The crawl that emptied the real allowance would hit this.
  it('refuses once the month is spent, and writes nothing', async () => {
    single.mockResolvedValue({ data: { data: { used: 7990 } } });
    expect(await claimLegiscanBudget(25)).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('refuses a claim that would cross the ceiling exactly', async () => {
    single.mockResolvedValue({ data: { data: { used: 8000 } } });
    expect(await claimLegiscanBudget(1)).toBe(false);
  });

  it('keys the budget by UTC month, so it resets on its own', async () => {
    single.mockResolvedValue({ data: null });
    await claimLegiscanBudget(1);
    const now = new Date();
    const expected = `legiscan-budget-${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ feed_type: expected }),
      expect.anything(),
    );
  });

  // A guard that blocks real traffic when the cache is unreachable would be
  // worse than the problem it exists to prevent.
  it('lets the call through when the budget cannot be read', async () => {
    single.mockRejectedValue(new Error('db down'));
    expect(await claimLegiscanBudget(25)).toBe(true);
  });
});
