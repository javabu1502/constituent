import type { createAdminClient } from '@/lib/supabase';
import { statusesForOutcome, knownStatuses } from '@/lib/delivery-status';

/**
 * One count of an initiative, for every surface that shows one.
 *
 * It exists because four organization screens gave four answers for the same
 * campaign. The dashboard card and the all-campaign report read the stored
 * `campaigns.action_count`; the analytics page and the impact report counted
 * rows. Those disagree whenever a campaign has steps, because the counter is
 * incremented by slug and participation on a step never reaches the parent.
 * One campaign already showed 33 in one place and 34 in another.
 *
 * Two further problems this fixes. The stored counter mixes people with
 * message engagements, because a second message from the same person bumps it
 * without adding a participant row. And every aggregate on the org side
 * fetched rows with a limit of five or ten thousand and counted the array, so
 * a campaign that crossed the limit would have understated itself silently
 * and forever.
 *
 * So: participants are rows in `campaign_actions`, messages are rows in
 * `messages`, both counted exactly by the database across the campaign and
 * its steps, and messages are also broken down by what actually happened to
 * them. `action_count` stays as the cheap counter the public page renders.
 */
type DbClient = ReturnType<typeof createAdminClient>;

export interface InitiativeCounts {
  /** The campaign plus its steps. */
  campaignIds: string[];
  /** People: one row per person who took part. */
  participants: number;
  /** Messages written through this initiative. */
  messages: number;
  /** Of those messages, what became of them. */
  delivered: number;
  inFlight: number;
  notDelivered: number;
  /** Sent by the person from their own mail app, so the outcome is not ours
   *  to know. This is most mail today and must not be read as failure. */
  selfSent: number;
  stories: number;
}

const EMPTY: Omit<InitiativeCounts, 'campaignIds'> = {
  participants: 0, messages: 0, delivered: 0, inFlight: 0, notDelivered: 0, selfSent: 0, stories: 0,
};

/** The campaign and every step beneath it. */
export async function initiativeCampaignIds(db: DbClient, campaignId: string): Promise<string[]> {
  try {
    const { data } = await db.from('campaigns').select('id').eq('parent_campaign_id', campaignId);
    return [campaignId, ...(data ?? []).map((c) => c.id as string)];
  } catch {
    // A step lookup that fails should narrow the count to the campaign
    // itself, never take down the page asking for it.
    return [campaignId];
  }
}

async function countRows(db: DbClient, table: string, apply: (q: never) => unknown): Promise<number> {
  try {
    const base = db.from(table).select('*', { count: 'exact', head: true });
    const { count, error } = (await apply(base as never)) as { count: number | null; error: unknown };
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Exact counts for an initiative. Never throws: a count that fails comes back
 * as zero rather than taking down the page that asked for it.
 */
export async function getInitiativeCounts(db: DbClient, campaignId: string): Promise<InitiativeCounts> {
  const campaignIds = await initiativeCampaignIds(db, campaignId);
  if (campaignIds.length === 0) return { campaignIds, ...EMPTY };

  const inIds = <T>(q: T): T => (q as { in: (c: string, v: string[]) => T }).in('campaign_id', campaignIds);
  const delivered = statusesForOutcome('delivered');
  const inFlight = statusesForOutcome('in_flight');
  const notDelivered = statusesForOutcome('not_delivered');

  const [participants, messages, d, f, n, stories] = await Promise.all([
    countRows(db, 'campaign_actions', (q) => inIds(q)),
    countRows(db, 'messages', (q) => inIds(q)),
    countRows(db, 'messages', (q) => (inIds(q) as { in: (c: string, v: string[]) => unknown }).in('delivery_status', delivered)),
    countRows(db, 'messages', (q) => (inIds(q) as { in: (c: string, v: string[]) => unknown }).in('delivery_status', inFlight)),
    countRows(db, 'messages', (q) => (inIds(q) as { in: (c: string, v: string[]) => unknown }).in('delivery_status', notDelivered)),
    countRows(db, 'stories', (q) => (inIds(q) as { eq: (c: string, v: string) => unknown }).eq('status', 'active')),
  ]);

  // Everything else is mail the person sent themselves, plus any status this
  // vocabulary has not met yet. Derived rather than queried so the four
  // buckets always sum to the total.
  const selfSent = Math.max(0, messages - d - f - n);
  void knownStatuses;

  return { campaignIds, participants, messages, delivered: d, inFlight: f, notDelivered: n, selfSent, stories };
}

/**
 * The headline pair for a campaign card or tile: how many people, and how
 * many messages. Prefers real rows; falls back to the stored counter only
 * when the count could not be taken, so a card never renders blank.
 */
export function participantsLabel(counts: InitiativeCounts, storedActionCount?: number | null): number {
  return counts.participants || Number(storedActionCount ?? 0) || 0;
}
