import type { StateLegislatorTarget } from './types';

/**
 * Pick the delivery channel for a state legislator: email if we have one
 * (Open States or the Layer-2 enrichment override), else their webform, else
 * nothing. The rep resolver populates `target.email`; `withOverride` fills it
 * from the enrichment table when Open States lacked it.
 */
export type StateChannel =
  | { channel: 'email'; email: string }
  | { channel: 'webform'; webformUrl: string }
  | { channel: 'none' };

export function resolveTargetChannel(target: StateLegislatorTarget): StateChannel {
  if (target.email && target.email.includes('@')) return { channel: 'email', email: target.email };
  if (target.webformUrl) return { channel: 'webform', webformUrl: target.webformUrl };
  return { channel: 'none' };
}

/** Enrichment overrides keyed by lower-cased legislator name. */
export type EmailOverrides = Map<string, string>;

export function buildOverrideMap(json: { overrides?: Array<{ name: string; email: string }> }): EmailOverrides {
  const m: EmailOverrides = new Map();
  for (const o of json.overrides ?? []) if (o.email?.includes('@')) m.set(o.name.trim().toLowerCase(), o.email.trim());
  return m;
}

/** Fill a target's email from the enrichment override when Open States had none. */
export function withOverride(target: StateLegislatorTarget, overrides?: EmailOverrides): StateLegislatorTarget {
  if ((target.email && target.email.includes('@')) || !overrides) return target;
  const hit = overrides.get(target.name.trim().toLowerCase());
  return hit ? { ...target, email: hit } : target;
}
