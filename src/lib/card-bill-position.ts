import { fetchBillStatus, type BillStatus } from '@/lib/bill-status';
import { billTrack, billTrackPosition } from '@/lib/legislative-process';
import { STAGE_GOAL_LABELS, stageOrder, type StageGoal } from '@/lib/stages';
import type { CardBillPosition } from '@/components/dashboard/CampaignCard';

interface BillCampaign {
  id: string;
  bill_level: string | null;
  bill_state: string | null;
  bill_ref: string | null;
  bill_congress?: number | null;
  bill_type?: string | null;
  bill_number?: string | null;
}

/** The newest action an organisation has running on a campaign. */
interface Stage {
  parent_campaign_id?: string | null;
  stage_goal?: string | null;
  created_at?: string | null;
}

/**
 * Where each bill has got to, for the dashboard's cards.
 *
 * Status comes from the official record (Congress.gov federal, Open States
 * state) and is cached for an hour inside fetchBillStatus, so a dashboard of
 * a dozen campaigns costs a dozen lookups once an hour rather than per view.
 * A lookup that fails returns null for that campaign and the card simply
 * renders without a track: a bill we cannot reach is not a reason to fail a
 * page.
 */
export async function resolveBillPositions(
  campaigns: BillCampaign[],
  stages: Stage[],
): Promise<Map<string, CardBillPosition>> {
  const withBills = campaigns.filter((c) => (c.bill_ref ?? '').trim());
  if (withBills.length === 0) return new Map();

  const newestStageGoal = new Map<string, StageGoal>();
  for (const s of stages) {
    const parent = s.parent_campaign_id;
    if (!parent || !s.stage_goal) continue;
    const prev = newestStageGoal.get(parent);
    // "Newest" means furthest along the journey, not most recently created:
    // an organisation can add a committee action after a floor one.
    if (!prev || stageOrder(s.stage_goal) > stageOrder(prev)) {
      newestStageGoal.set(parent, s.stage_goal as StageGoal);
    }
  }

  const results = await Promise.all(
    withBills.map(async (c) => {
      let status: BillStatus | null = null;
      try {
        status = await fetchBillStatus(c);
      } catch {
        return null;
      }
      if (!status?.found || status.actions.length === 0) return null;

      const level = c.bill_level === 'state' ? 'state' : 'federal';
      const newest = status.actions[0];
      const position = billTrackPosition(
        newest.description,
        newest.chamber,
        level,
        c.bill_state,
        c.bill_type ?? c.bill_ref,
      );
      const track = billTrack(level, c.bill_state, c.bill_type ?? c.bill_ref);
      const label = track.stages[position] === 'Introduced'
        ? 'Introduced'
        : `In ${track.stages[position]}`;

      // The organisation's newest ask against where the bill actually is. The
      // suggestion already knows what should come next; if what they are
      // running is behind that, the card says so.
      let behind: string | null = null;
      const running = newestStageGoal.get(c.id);
      const suggested = status.suggestion?.goal;
      if (running && suggested && stageOrder(running) < stageOrder(suggested)) {
        behind = `The bill is at ${track.stages[position]}. Your newest action asks for ${
          STAGE_GOAL_LABELS[running] ?? running
        }.`;
      }

      return [c.id, { position, label, behind }] as const;
    }),
  );

  return new Map(results.filter((r): r is NonNullable<typeof r> => r !== null));
}
