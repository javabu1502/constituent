import { getStateLegislators, toOfficial, type StateLegislator } from '@/lib/state-legislators';
import type { Official } from '@/lib/types';
import { nameSlug } from '@/lib/utils';

/**
 * Addresses for the 7,359 state legislators we hold data on.
 *
 * Congress has had a page each at /rep/<bioguide> for a long time; state
 * legislators have had none, even though they are the ones a small group can
 * actually reach, and the ones nobody else covers well. The data was already
 * here: name, district, party, email, phone, office, website.
 *
 * The slug is the person's name. Across all 7,359 exactly one name collides
 * inside its own state (Luke Rankin, South Carolina), so a district suffix is
 * added only where it is needed and every other URL stays clean.
 */
export { nameSlug };


/** Every legislator in a state, each with the slug its page lives at. */
export function slugsForState(stateCode: string): { slug: string; legislator: StateLegislator }[] {
  const legs = getStateLegislators(stateCode);
  const counts = new Map<string, number>();
  for (const l of legs) {
    const s = nameSlug(l.name);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return legs.map((legislator) => {
    const base = nameSlug(legislator.name);
    // Two people of one name in one statehouse: the district separates them.
    const slug = (counts.get(base) ?? 0) > 1 ? `${base}-${nameSlug(legislator.district)}` : base;
    return { slug, legislator };
  });
}

export function findBySlug(stateCode: string, slug: string): Official | null {
  const hit = slugsForState(stateCode).find((e) => e.slug === slug);
  return hit ? toOfficial(hit.legislator, stateCode) : null;
}
