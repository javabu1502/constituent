/**
 * Post-check a composed story against the storyteller's own words. Every
 * number in the draft must appear in what they typed, the draft must respect
 * the length cap, and it must carry no dashes. Returns human-readable
 * problems for one corrective retry (audit 2026-09-29: 12/12 drafts added
 * content; numbers were the one thing the model kept exact, so this guards
 * the boundary that matters most).
 */
const NUM = /\$?\d[\d,.]*/g;
const norm = (n: string) => n.replace(/[,$]/g, '').replace(/\.$/, '');

export function draftProblems(body: string, tellerText: string, maxWords: number | null, minWords: number | null = null): string[] {
  const problems: string[] = [];
  const known = new Set((tellerText.match(NUM) ?? []).map(norm));
  const unknown = [...new Set((body.match(NUM) ?? []).map(norm))].filter((n) => n && !known.has(n));
  if (unknown.length) problems.push(`numbers the storyteller never wrote: ${unknown.slice(0, 5).join(', ')}`);
  const words = body.split(/\s+/).filter(Boolean).length;
  if (maxWords && words > Math.round(maxWords * 1.15)) problems.push(`too long (${words} words, limit ${maxWords})`);
  if (minWords && words < Math.round(minWords * 0.85)) problems.push(`too short (${words} words, write at least ${minWords}): develop what the storyteller said instead of restating it`);
  if (/[—–]/.test(body)) problems.push('em or en dashes');
  return problems;
}

/** Floor for a draft: a story is never under 150 words, and a sparse teller
 *  still gets a developed one (about 1.8x their words when that is higher). */
export function draftWordFloor(tellerWords: number): number {
  return Math.min(400, Math.max(150, Math.round(tellerWords * 1.8)));
}

/** Length budget for a draft: about 2.5x the storyteller's own words, 120 to 700.
 *  (Was 1.5x / 40 to 600 after the 09-29 audit; Jared found the drafts too
 *  bare on 10-02, so the budget gives the story room to develop.) */
export function draftWordBudget(tellerWords: number): number {
  return Math.min(700, Math.max(120, Math.round(tellerWords * 2.5)));
}
