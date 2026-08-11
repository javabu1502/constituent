/**
 * Campaign stage vocabulary — the legislative journey a parent campaign walks
 * through. Shared by the creation form, analytics, and the funder report so
 * every surface names and orders stages the same way.
 */
export const STAGE_GOALS = ['cosponsor', 'committee', 'floor_house', 'floor_senate', 'thank_you', 'custom'] as const;
export type StageGoal = (typeof STAGE_GOALS)[number];

export const STAGE_GOAL_LABELS: Record<StageGoal, string> = {
  cosponsor: 'Recruit cosponsors',
  committee: 'Pass committee',
  floor_house: 'House floor vote',
  floor_senate: 'Senate floor vote',
  thank_you: 'Thank officials',
  custom: 'Custom stage',
};

/** Journey order for funnels; unknown/custom goals sort last, then by creation. */
export function stageOrder(goal: string | null): number {
  const idx = STAGE_GOALS.indexOf(goal as StageGoal);
  return idx === -1 ? STAGE_GOALS.length : idx;
}
