/**
 * Talking-point coverage.
 *
 * An organization's talking points are the one thing it is paying for in
 * every letter, so a campaign can require that every point is MADE (in the
 * constituent's own words) rather than merely available. These helpers split
 * a free-text template into points and check a draft for each point's key
 * ideas. The verbatim-run check elsewhere keeps the points paraphrased, so
 * coverage never becomes copying.
 */

const STOP = new Set([
  'about', 'after', 'again', 'against', 'because', 'before', 'being', 'below', 'between', 'could', 'should', 'would',
  'during', 'every', 'their', 'there', 'these', 'those', 'through', 'under', 'until', 'where', 'which', 'while',
  'other', 'people', 'families', 'family', 'state', 'federal', 'congress', 'support', 'oppose', 'please', 'legislation',
  'bill', 'important', 'ensure', 'provide', 'including', 'without', 'within', 'across', 'million', 'billion', 'percent',
  'years', 'communities', 'community', 'nevada', 'america', 'american', 'americans', 'government', 'program', 'programs',
]);

export const MAX_REQUIRED_POINTS = 5;

/** Split a template into points: one per line, bullet, or numbered item; sentences as a fallback. */
export function parseTalkingPoints(template: string | null | undefined): string[] {
  const text = (template || '').replace(/\r/g, '').trim();
  if (!text) return [];
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*(?:[-*•▪·]|\d+[.)]|[a-z][.)])\s+/i, '').trim())
    .filter((l) => l.length >= 12);
  if (lines.length >= 2) return lines;
  // One paragraph: fall back to sentences.
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);
}

/** Distinctive terms that stand for a point: numbers and longer content words, lightly stemmed. */
export function pointKeyTerms(point: string): string[] {
  const numbers = point.match(/\$?\d[\d,.]*%?/g) ?? [];
  const words = (point.toLowerCase().match(/[a-z][a-z'-]{4,}/g) ?? [])
    .map((w) => w.replace(/'s$/, ''))
    .filter((w) => !STOP.has(w));
  const stems = [...new Set(words.map((w) => w.slice(0, 6)))];
  return [...new Set([...numbers.map((n) => n.replace(/[,$%]/g, '').replace(/\.$/, '')), ...stems])];
}

/**
 * Which points a draft makes. A point counts as covered when one of its
 * numbers appears, or when at least 40% of its distinctive terms (minimum
 * two) appear anywhere in the draft.
 */
export function talkingPointCoverage(body: string, points: string[]): { covered: string[]; missing: string[] } {
  const hay = body.toLowerCase();
  const hayNums = new Set((body.match(/\$?\d[\d,.]*%?/g) ?? []).map((n) => n.replace(/[,$%]/g, '').replace(/\.$/, '')));
  const covered: string[] = [];
  const missing: string[] = [];
  for (const point of points) {
    const terms = pointKeyTerms(point);
    if (terms.length === 0) {
      covered.push(point);
      continue;
    }
    const numHit = terms.some((t) => /^\d/.test(t) && hayNums.has(t));
    const wordTerms = terms.filter((t) => !/^\d/.test(t));
    const hits = wordTerms.filter((t) => hay.includes(t)).length;
    const need = Math.max(2, Math.ceil(wordTerms.length * 0.4));
    if (numHit || (wordTerms.length > 0 && hits >= Math.min(need, wordTerms.length))) covered.push(point);
    else missing.push(point);
  }
  return { covered, missing };
}
