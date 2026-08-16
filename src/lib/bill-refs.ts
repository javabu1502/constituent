/**
 * Detect legislative bill references in free text and classify their level.
 *
 * Naming a specific bill is the strongest possible routing signal — someone
 * writing "support AB 156" means their STATE legislature, and "H.R. 22" means
 * Congress, regardless of what topic words surround it.
 *
 * Known limitation: a handful of states number bills like Congress does
 * (Massachusetts "S.2619"), so a dotted "S. 123" is read as federal. The
 * curated campaign flows carry an explicit bill_level, so this only affects
 * free text.
 */

export interface BillRefs {
  federal: string[];
  state: string[];
  /** Spelled-out "senate bill 12" / "house bill 7" — used by both levels
   * colloquially, so these never shift routing. */
  ambiguous: string[];
}

const FEDERAL_PATTERNS = [
  /\bh\.?\s?r\.?\s?(\d{1,5})\b/gi, // H.R. 22, HR 40
  /\b[sS]\.\s?(\d{1,5})\b/g, // S. 1332 (dot required — bare "s 12" is noise)
  /\b[hs]\.?\s?j\.?\s?res\.?\s?(\d{1,4})\b/gi,
  /\b[hs]\.?\s?con\.?\s?res\.?\s?(\d{1,4})\b/gi,
  /\b[hs]\.?\s?res\.?\s?(\d{1,4})\b/gi,
];

const STATE_PATTERNS = [
  // Two-letter chamber prefixes used by state legislatures (AB/SB/HB etc.,
  // plus NE's LB and MN/IA's HF/SF). Congress never uses these.
  /\b(?:ab|sb|hb|acr|ajr|sjr|scr|hjr|hcr|lb|hf|sf)\s?-?\s?(\d{1,4})\b/gi,
  /\bassembly bill\s?(?:no\.?\s?)?(\d{1,4})\b/gi,
  // Ballot measures are state-level questions.
  /\b(?:question|proposition|prop\.?)\s?(\d{1,3})\b/gi,
];

const AMBIGUOUS_PATTERNS = [/\b(?:senate|house) bill\s?(?:no\.?\s?)?(\d{1,4})\b/gi];

function collect(text: string, patterns: RegExp[]): string[] {
  const found: string[] = [];
  for (const p of patterns) {
    p.lastIndex = 0;
    for (const m of text.matchAll(p)) found.push(m[0].trim());
  }
  return found;
}

export function detectBillRefs(text: string): BillRefs {
  const t = (text || '').trim();
  if (!t) return { federal: [], state: [], ambiguous: [] };
  const federal = collect(t, FEDERAL_PATTERNS);
  const federalSet = new Set(federal.map((f) => f.replace(/\D/g, '')));
  // A state match whose digits already matched a federal pattern is the same
  // token seen twice ("H.R. 22" also matches nothing state-side, but "SB 120"
  // could collide with an "S. B..." false positive) — federal patterns are
  // more specific, so they win ties.
  const state = collect(t, STATE_PATTERNS).filter((s) => {
    const digits = s.replace(/\D/g, '');
    return !federal.some((f) => f.toLowerCase() === s.toLowerCase()) && !(s.toLowerCase().startsWith('s') && federalSet.has(digits) && federal.length > 0 && state0Collides(t, s));
  });
  const ambiguous = collect(t, AMBIGUOUS_PATTERNS);
  return { federal, state, ambiguous };
}

// "S. 120" produces a federal hit; the state pattern must not re-claim the
// same characters. True only when the state match is part of a dotted S. ref.
function state0Collides(text: string, stateMatch: string): boolean {
  return new RegExp(`s\\.\\s?${stateMatch.replace(/\D/g, '')}`, 'i').test(text);
}
