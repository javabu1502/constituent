import { nameSlug } from '@/lib/utils';

/**
 * An organization's public handle, for /org/<slug> and /embed/org/<slug>.
 *
 * Nothing asked orgs to choose one, so when the join form and the supporter
 * map shipped, three of the four organization accounts had no slug and no
 * URL their pages could live at. Rather than add a setup step before anyone
 * can see their own dashboard, the handle is derived from the organization's
 * name the first time they need it.
 */
export function slugCandidates(orgName: string | null, fallback: string): string[] {
  const base = nameSlug(orgName ?? '') || nameSlug(fallback) || 'organization';
  // Collisions are resolved with a short suffix rather than a counter, so two
  // organizations with similar names never race for "-2".
  return [base, `${base}-${Math.random().toString(36).slice(2, 6)}`, `${base}-${Math.random().toString(36).slice(2, 8)}`];
}
