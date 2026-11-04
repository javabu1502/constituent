import { describe, it, expect } from 'vitest';
import { titleFromUrl, tidy } from '@/app/api/legislators/wiki-bio/route';

describe('wikipedia article urls', () => {
  it('takes the title out of a real article url', () => {
    expect(titleFromUrl('https://en.wikipedia.org/wiki/Alexis_Hansen')).toBe('Alexis_Hansen');
    expect(titleFromUrl('https://en.wikipedia.org/wiki/Jos%C3%A9_N%C3%BA%C3%B1ez')).toBe('José Núñez'.replace(' ', '_'));
  });

  it('refuses anything that is not an english wikipedia article', () => {
    // The URL is fetched server-side, so this is the boundary that stops the
    // endpoint being pointed somewhere it should not go.
    for (const u of [
      'https://evil.example.com/wiki/Alexis_Hansen',
      'http://localhost:3000/wiki/x',
      'https://en.wikipedia.org.evil.com/wiki/x',
      'https://fr.wikipedia.org/wiki/Alexis_Hansen',
      'not a url',
      '',
    ]) {
      expect(titleFromUrl(u), u).toBeNull();
    }
  });

  it('refuses namespaced pages, which are not biographies', () => {
    expect(titleFromUrl('https://en.wikipedia.org/wiki/Category:Politicians')).toBeNull();
    expect(titleFromUrl('https://en.wikipedia.org/wiki/Special:Random')).toBeNull();
  });

  it('drops the opening parenthetical of dates and pronunciation', () => {
    expect(tidy('Alexis Hansen (born 1965) is an American politician.')).toBe('Alexis Hansen is an American politician.');
    expect(tidy('Jane Doe  is   a legislator.')).toBe('Jane Doe is a legislator.');
  });
});

describe('vendored legislator data', () => {
  it('carries a wikipedia url for the overwhelming majority', async () => {
    const { getStateLegislators } = await import('@/lib/state-legislators');
    let total = 0;
    let withWiki = 0;
    for (const code of ['NV', 'CA', 'TX', 'VT', 'WY']) {
      for (const l of getStateLegislators(code)) {
        total++;
        if (l.wikipediaUrl) withWiki++;
      }
    }
    expect(total).toBeGreaterThan(400);
    // Measured at 95% across all 7,336; this floor catches a vendoring
    // regression that silently drops the field.
    expect(withWiki / total).toBeGreaterThan(0.8);
  });

  it('only ever stores english wikipedia article urls', async () => {
    const { getStateLegislators } = await import('@/lib/state-legislators');
    for (const code of ['NV', 'CA', 'VT']) {
      for (const l of getStateLegislators(code)) {
        if (l.wikipediaUrl) expect(l.wikipediaUrl, l.name).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\//);
      }
    }
  });
});
