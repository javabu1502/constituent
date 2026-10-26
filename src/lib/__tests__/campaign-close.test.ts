import { describe, it, expect } from 'vitest';
import { CLOSED_STATUS, OPEN_STATUS, isCampaignClosed } from '@/lib/campaign-close';

describe('isCampaignClosed', () => {
  it('treats only an active campaign as open', () => {
    expect(isCampaignClosed(OPEN_STATUS)).toBe(false);
    expect(isCampaignClosed(CLOSED_STATUS)).toBe(true);
    // The column also accepts these; none of them collects participation.
    expect(isCampaignClosed('archived')).toBe(true);
    expect(isCampaignClosed('pending')).toBe(true);
    expect(isCampaignClosed('rejected')).toBe(true);
  });

  it('treats a missing status as open, matching the column default', () => {
    expect(isCampaignClosed(null)).toBe(false);
    expect(isCampaignClosed(undefined)).toBe(false);
  });

  it('keeps the closed state reversible: paused, not archived', () => {
    expect(CLOSED_STATUS).toBe('paused');
  });
});
