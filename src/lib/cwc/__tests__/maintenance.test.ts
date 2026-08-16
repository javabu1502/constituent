import { describe, it, expect } from 'vitest';
import { isInScwcMaintenanceWindow } from '../constants';
import { sendBatch } from '../client';
import type { CwcDelivery } from '../types';

// All fixture instants are expressed in UTC and chosen against US Eastern
// wall-clock time (EDT = UTC-4 in August, EST = UTC-5 in January) so the
// tests prove the Intl/America-New_York conversion, not just the math.
describe('isInScwcMaintenanceWindow', () => {
  it('Sunday 12a–6a ET is a window', () => {
    expect(isInScwcMaintenanceWindow(new Date('2026-08-16T04:00:00Z'))).toBe(true); // Sun 12:00a EDT
    expect(isInScwcMaintenanceWindow(new Date('2026-08-16T07:30:00Z'))).toBe(true); // Sun 3:30a EDT
    expect(isInScwcMaintenanceWindow(new Date('2026-08-16T09:59:00Z'))).toBe(true); // Sun 5:59a EDT
    expect(isInScwcMaintenanceWindow(new Date('2026-08-16T10:00:00Z'))).toBe(false); // Sun 6:00a EDT — window over
    expect(isInScwcMaintenanceWindow(new Date('2026-08-16T03:59:00Z'))).toBe(false); // Sat 11:59p EDT — not yet
  });

  it('Wednesday 5a–7a ET is a window', () => {
    expect(isInScwcMaintenanceWindow(new Date('2026-08-19T09:00:00Z'))).toBe(true); // Wed 5:00a EDT
    expect(isInScwcMaintenanceWindow(new Date('2026-08-19T10:59:00Z'))).toBe(true); // Wed 6:59a EDT
    expect(isInScwcMaintenanceWindow(new Date('2026-08-19T08:59:00Z'))).toBe(false); // Wed 4:59a EDT
    expect(isInScwcMaintenanceWindow(new Date('2026-08-19T11:00:00Z'))).toBe(false); // Wed 7:00a EDT — window over
  });

  it('handles EST (winter) — the boundary shifts with the zone, not UTC', () => {
    expect(isInScwcMaintenanceWindow(new Date('2026-01-04T10:59:00Z'))).toBe(true); // Sun 5:59a EST
    expect(isInScwcMaintenanceWindow(new Date('2026-01-04T11:00:00Z'))).toBe(false); // Sun 6:00a EST
  });

  it('ordinary weekday hours are never a window', () => {
    expect(isInScwcMaintenanceWindow(new Date('2026-08-14T16:00:00Z'))).toBe(false); // Fri midday
    expect(isInScwcMaintenanceWindow(new Date('2026-08-17T09:00:00Z'))).toBe(false); // Mon 5a EDT (not Wed)
  });
});

describe('sendBatch maintenance-window guard', () => {
  const delivery: CwcDelivery = {
    chamber: 'senate', officeCode: 'SNY01', campaignId: 'c',
    constituent: { prefix: 'Ms.', firstName: 'A', lastName: 'B', address1: '1 Main St', city: 'NYC', state: 'NY', zip: '10001', email: 'a@b.co' },
    message: { subject: 'Hello there', topics: ['Health'], constituentMessage: 'A message body here.' },
  };
  const send = async () => ({ ok: true, status: 201 });

  it('aborts with a clear error inside a window', async () => {
    await expect(
      sendBatch([delivery], send, { now: new Date('2026-08-16T07:30:00Z') }), // Sun 3:30a EDT
    ).rejects.toThrow(/maintenance window/);
  });

  it('runs outside a window, and can be overridden for House-only batches', async () => {
    const ok = await sendBatch([delivery], send, { now: new Date('2026-08-14T16:00:00Z') });
    expect(ok[0].result?.ok).toBe(true);
    const overridden = await sendBatch([delivery], send, {
      now: new Date('2026-08-16T07:30:00Z'),
      ignoreMaintenanceWindow: true,
    });
    expect(overridden[0].result?.ok).toBe(true);
  });
});
