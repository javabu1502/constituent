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
