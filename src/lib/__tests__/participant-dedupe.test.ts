import { describe, it, expect, vi } from 'vitest';

/**
 * campaign_actions holds one row per visit that took action, not one per
 * person. On 2026-11-12 the Seneca Hills rezoning campaign had five rows from
 * four addresses, because one person came back and acted twice, and every
 * surface reported five people.
 */
function makeDb(rows: Array<{ participant_email?: string | null }>) {
  return {
    from: (table: string) => ({
      select: (cols: string, opts?: unknown) => {
        if (table === 'campaigns') return { eq: () => Promise.resolve({ data: [] }) };
        void cols; void opts;
        return {
          in: () => ({
            range: (from: number, to: number) =>
              Promise.resolve({ data: rows.slice(from, to + 1), error: null }),
          }),
        };
      },
    }),
  } as never;
}

const seneca = [
  { participant_email: 'jared@example.com' },
  { participant_email: 'jared@example.com' },
  { participant_email: 'vince@example.com' },
  { participant_email: 'allyson@example.com' },
  { participant_email: 'pamela@example.net' },
];

describe('counting people once each', () => {
  it('counts the Seneca Hills rows as four people, not five', async () => {
    const { countCampaignParticipants } = await import('../campaign-counts');
    expect(await countCampaignParticipants(makeDb(seneca), 'c1')).toBe(4);
  });

  it('ignores case and surrounding space', async () => {
    const { countCampaignParticipants } = await import('../campaign-counts');
    const rows = [
      { participant_email: 'A@Example.com' },
      { participant_email: ' a@example.com ' },
      { participant_email: 'b@example.com' },
    ];
    expect(await countCampaignParticipants(makeDb(rows), 'c1')).toBe(2);
  });

  // A row with no email cannot be deduplicated, so it counts once. That can
  // overstate, and it is the honest ceiling rather than a guess.
  it('counts each row with no email once', async () => {
    const { countCampaignParticipants } = await import('../campaign-counts');
    const rows = [
      { participant_email: null },
      { participant_email: '' },
      { participant_email: 'a@example.com' },
      { participant_email: 'a@example.com' },
    ];
    expect(await countCampaignParticipants(makeDb(rows), 'c1')).toBe(3);
  });

  it('is zero when nobody has acted', async () => {
    const { countCampaignParticipants } = await import('../campaign-counts');
    expect(await countCampaignParticipants(makeDb([]), 'c1')).toBe(0);
  });

  // An unpaged select stops at PostgREST's limit without saying so.
  it('pages past the first thousand rows', async () => {
    const { countCampaignParticipants } = await import('../campaign-counts');
    const rows = Array.from({ length: 2500 }, (_, i) => ({ participant_email: `p${i}@example.com` }));
    expect(await countCampaignParticipants(makeDb(rows), 'c1')).toBe(2500);
  });
});
