/**
 * The whip scale — shared by the whip board, legislator intel, and reports so
 * every surface speaks the same language. Five points, the way lobbying
 * teams actually count: a "yes" is a commitment; "leaning" is a read.
 * Positions are always relative to the CAMPAIGN'S ask (on an oppose campaign,
 * "yes" means they're with you — voting the bill down).
 */
export const WHIP_POSITIONS = ['yes', 'leaning_yes', 'uncommitted', 'leaning_no', 'no'] as const;
export type WhipPosition = (typeof WHIP_POSITIONS)[number];

export const WHIP_LABELS: Record<WhipPosition, string> = {
  yes: 'Yes',
  leaning_yes: 'Leaning yes',
  uncommitted: 'Uncommitted',
  leaning_no: 'Leaning no',
  no: 'No',
};

export const WHIP_STYLES: Record<WhipPosition, string> = {
  yes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  leaning_yes: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  uncommitted: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  leaning_no: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  no: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

/** Counts toward "we have the votes": yes + leaning yes. */
export function isSupportive(position: string | null | undefined): boolean {
  return position === 'yes' || position === 'leaning_yes';
}

export function emptyWhipTally(): Record<WhipPosition, number> {
  return { yes: 0, leaning_yes: 0, uncommitted: 0, leaning_no: 0, no: 0 };
}
