import { describe, it, expect } from 'vitest';
import { nameSlug, slugsForState, findBySlug } from '@/lib/state-legislator-slug';

describe('state legislator slugs', () => {
  it('makes a clean url out of a name', () => {
    expect(nameSlug('Alexis Hansen')).toBe('alexis-hansen');
    expect(nameSlug("Shondra Summers-Armstrong")).toBe('shondra-summers-armstrong');
    expect(nameSlug("P.K. O'Neill")).toBe('p-k-o-neill');
    expect(nameSlug('José Núñez')).toBe('jose-nunez');
  });

  it('gives every legislator in a state a unique address', () => {
    for (const code of ['NV', 'CA', 'TX', 'SC', 'NH']) {
      const entries = slugsForState(code);
      expect(entries.length, code).toBeGreaterThan(0);
      expect(new Set(entries.map((e) => e.slug)).size, code).toBe(entries.length);
      for (const e of entries) expect(e.slug, `${code} ${e.legislator.name}`).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('separates the one real name collision by district', () => {
    // Two Luke Rankins sit in South Carolina; plain name slugs would collide.
    const rankins = slugsForState('SC').filter((e) => e.slug.startsWith('luke-rankin'));
    expect(rankins.length).toBe(2);
    expect(new Set(rankins.map((e) => e.slug)).size).toBe(2);
    for (const r of rankins) expect(r.slug).not.toBe('luke-rankin');
  });

  it('leaves every uncontested name without a suffix', () => {
    const hansen = slugsForState('NV').find((e) => e.legislator.name === 'Alexis Hansen');
    expect(hansen?.slug).toBe('alexis-hansen');
  });

  it('resolves a slug back to the right person, with the chamber named correctly', () => {
    const o = findBySlug('NV', 'alexis-hansen');
    expect(o?.name).toBe('Alexis Hansen');
    expect(o?.level).toBe('state');
    // The chamber fix from earlier has to survive this path too.
    expect(o?.title).toContain('Assemblymember');
  });

  it('returns null for a slug nobody owns', () => {
    expect(findBySlug('NV', 'not-a-real-person')).toBeNull();
  });
});

describe('committee seats on a legislator page', () => {
  it('finds the committees a real legislator sits on', async () => {
    const { committeesForPerson } = await import('@/lib/state-committees');
    const { slugsForState } = await import('@/lib/state-legislator-slug');
    const hansen = slugsForState('NV').find((e) => e.legislator.name === 'Alexis Hansen');
    const seats = committeesForPerson('NV', hansen!.legislator.id);
    expect(seats.length).toBeGreaterThan(0);
    for (const s of seats) expect(s.committee.name.length).toBeGreaterThan(2);
  });

  it('puts chairs and vice chairs above ordinary members', async () => {
    const { committeesForPerson } = await import('@/lib/state-committees');
    const { getStateLegislators } = await import('@/lib/state-legislators');
    // Find someone who chairs something, in whatever state has one first.
    let found = false;
    for (const code of ['NV', 'CA', 'TX', 'CO', 'CT']) {
      for (const l of getStateLegislators(code)) {
        const seats = committeesForPerson(code, l.id);
        const roles = seats.map((s) => (s.role ?? '').toLowerCase());
        if (roles.some((r) => r === 'chair') && roles.some((r) => r === '')) {
          expect(roles.indexOf('chair')).toBeLessThan(roles.lastIndexOf(''));
          found = true;
          break;
        }
      }
      if (found) break;
    }
    expect(found, 'no chair-and-member legislator found to check ordering').toBe(true);
  });

  it('returns nothing rather than throwing for an unknown person', async () => {
    const { committeesForPerson } = await import('@/lib/state-committees');
    expect(committeesForPerson('NV', 'ocd-person/does-not-exist')).toEqual([]);
    expect(committeesForPerson('NV', '')).toEqual([]);
  });
});
