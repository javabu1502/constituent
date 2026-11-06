/**
 * Which bill a campaign is allowed to reference.
 *
 * A campaign cannot write to one legislature about another's bill: the form
 * let an org pick Federal representatives and then attach a state bill, which
 * produced letters to Congress citing an AB number no member of Congress can
 * act on.
 *
 * Federal targets take a federal bill, state targets a state bill, and "both"
 * takes either. No bill at all is always allowed, since the link is optional.
 */
export type TargetLevel = 'federal' | 'state' | 'both' | 'local';
export type BillLevel = '' | 'federal' | 'state';

export function billLevelAllowed(target: TargetLevel, bill: BillLevel): boolean {
  if (!bill) return true;
  // A city council or planning commission acts on an application or an
  // ordinance, never on a bill in Carson City or Washington.
  if (target === 'local') return false;
  if (target === 'both') return true;
  return bill === target;
}

/** The bill level to keep when the target changes: '' when it no longer fits. */
export function billLevelAfterTargetChange(target: TargetLevel, bill: BillLevel): BillLevel {
  return billLevelAllowed(target, bill) ? bill : '';
}
