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

export function draftProblems(body: string, tellerText: string, maxWords: number | null): string[] {
  const problems: string[] = [];
  const known = new Set((tellerText.match(NUM) ?? []).map(norm));
  const unknown = [...new Set((body.match(NUM) ?? []).map(norm))].filter((n) => n && !known.has(n));
  if (unknown.length) problems.push(`numbers the storyteller never wrote: ${unknown.slice(0, 5).join(', ')}`);
  const words = body.split(/\s+/).filter(Boolean).length;
  if (maxWords && words > Math.round(maxWords * 1.15)) problems.push(`too long (${words} words, limit ${maxWords})`);
  if (/[—–]/.test(body)) problems.push('em or en dashes');
  return problems;
}

/** Length budget for a draft: about 1.5x the storyteller's own words, 40 to 600. */
export function draftWordBudget(tellerWords: number): number {
  return Math.min(600, Math.max(40, Math.round(tellerWords * 1.5)));
}
