/**
 * Post-check a composed story against the storyteller's own words. Every
 * number in the draft must appear in what they typed (digits or number
 * words), the draft must respect the length cap, it must carry no dashes,
 * it must not add frequency words, it must keep Spanish family words in the
 * gender and number the storyteller used, and it must not introduce proper
 * nouns the storyteller never wrote. Returns human-readable problems for
 * one corrective retry (audit 2026-09-29: 12/12 drafts added content;
 * numbers were the one thing the model kept exact, so this guards the
 * boundary that matters most; 10-23 audit added the word-number, family-word,
 * and proper-noun checks).
 */
import { addedFrequencyWords } from './message-quality';

export type DraftProblemCode = 'numbers' | 'too_long' | 'too_short' | 'dashes' | 'frequency' | 'gender' | 'names';

export interface DraftProblem {
  code: DraftProblemCode;
  /** The offending items, comma separated. */
  detail: string;
  /** The line handed back to the model on the corrective retry. */
  message: string;
}

export interface DraftCheckOptions {
  /** Proper nouns that may appear even if the storyteller did not write them
   *  (the organization's name, the campaign headline). */
  allow?: string[];
}

const NUM = /\$?\d[\d,.]*/g;
const norm = (n: string) => n.replace(/[,$]/g, '').replace(/\.$/, '');

// Number words from two upward. "one", "a", "un" and "una" are left alone:
// they read as articles far more often than as counts.
const UNITS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
};
const ONES: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  uno: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
};
const TENS_RE = new RegExp(`\\b(${Object.keys(TENS).join('|')})(?:[ -]y[ -]|[ -])(${Object.keys(ONES).join('|')})\\b`, 'giu');
const UNITS_RE = new RegExp(`\\b(${Object.keys(UNITS).join('|')})\\b`, 'giu');

/** Every number in a text, as normalized digit strings: "$1,375" and
 *  "twenty-five" come out as "1375" and "25". */
export function numbersIn(text: string): Set<string> {
  const out = new Set<string>();
  for (const n of text.match(NUM) ?? []) {
    const v = norm(n);
    if (v) out.add(v);
  }
  const lower = text.toLowerCase();
  const compounds = lower.replace(TENS_RE, (_m, tens: string, ones: string) => {
    out.add(String(TENS[tens] + ONES[ones]));
    return ' ';
  });
  for (const m of compounds.match(UNITS_RE) ?? []) out.add(String(UNITS[m.toLowerCase()]));
  return out;
}

const tokens = (text: string): string[] => (text || '').toLowerCase().match(/[\p{L}]+/gu) ?? [];

// Spanish family words that carry gender and number. The storyteller's form
// is the only correct one: una hija stays una hija.
const ES_FAMILY_ROOTS = ['hij', 'niñ', 'niet', 'herman', 'abuel', 'espos', 'sobrin', 'prim', 'tí', 'cuñad', 'suegr', 'ahijad'];
const ES_FAMILY = ES_FAMILY_ROOTS.map((r) => ({ ms: `${r}o`, mp: `${r}os`, fs: `${r}a`, fp: `${r}as` }));

/** Spanish family words whose gender or number differs from what the
 *  storyteller wrote, or that the storyteller never wrote at all. */
export function familyWordMismatches(draft: string, source: string): string[] {
  const d = new Set(tokens(draft));
  const s = new Set(tokens(source));
  const out: string[] = [];
  for (const pair of ES_FAMILY) {
    const forms = [pair.ms, pair.mp, pair.fs, pair.fp];
    const said = forms.filter((f) => s.has(f));
    for (const f of forms) {
      if (!d.has(f) || said.includes(f)) continue;
      if (said.length === 0) {
        out.push(`${f} (the storyteller never used it)`);
        continue;
      }
      const masc = f === pair.ms || f === pair.mp;
      const saidMasc = said.some((x) => x === pair.ms || x === pair.mp);
      const saidFem = said.some((x) => x === pair.fs || x === pair.fp);
      if ((masc && !saidMasc) || (!masc && !saidFem)) {
        out.push(`${f} (the storyteller said ${said.join('/')}, gender changed)`);
      } else {
        out.push(`${f} (the storyteller said ${said.join('/')}, number changed)`);
      }
    }
  }
  return out;
}

const DEFAULT_ALLOW = ['nevada', 'head', 'start', 'wic', 'medicaid', 'medicare', 'united', 'states', 'estados', 'unidos', 'god', 'dios'];
// Words that are never names, even capitalized mid-sentence (after a colon,
// a line break the splitter missed, or a quote mark we did not recognize).
const FUNCTION_WORDS = new Set(
  'i my me we our us you your he she it they them his her their this that these those the a an and but or so if when what who how why where no not yes'.split(' ').concat(
    'yo mi mis me nosotros nuestro nuestra nuestros nuestras usted ustedes su sus él ella ellos ellas esto esta este estos estas el la los las un una y o pero si cuando que quien como donde no sí'.split(' '),
  ),
);
const WORD_RE = /[\p{L}][\p{L}'’-]*/gu;

/** Capitalized words in the draft that the storyteller never wrote, skipping
 *  sentence-initial words, words after an opening quote, "I", and an
 *  allowlist. A new capitalized word is usually a name or a place. */
export function newProperNouns(draft: string, source: string, allow: string[] = []): string[] {
  const said = new Set(tokens(source));
  const ok = new Set([...DEFAULT_ALLOW, ...allow.flatMap((a) => tokens(a))]);
  const found: string[] = [];
  const seen = new Set<string>();
  const sentences = (draft || '').split(/(?<=[.!?])\s+|\n+/);
  for (const sentence of sentences) {
    for (const m of sentence.matchAll(WORD_RE)) {
      const word = m[0];
      const before = sentence.slice(0, m.index).trimEnd();
      if (before === '' || /[“"‘'(:]$/.test(before)) continue; // sentence-initial or quoted
      if (!/^\p{Lu}/u.test(word)) continue;
      const bare = word.replace(/['’]s$/i, '');
      if (bare === 'I' || /^I['’]/.test(bare)) continue;
      const lower = bare.toLowerCase();
      if (!/\p{L}{2,}/u.test(lower)) continue;
      if (FUNCTION_WORDS.has(lower) || said.has(lower) || ok.has(lower) || seen.has(lower)) continue;
      // A word the storyteller wrote with a possessive or plural still counts as theirs.
      if ([...said].some((s) => s === `${lower}s` || `${s}s` === lower)) continue;
      seen.add(lower);
      found.push(bare);
    }
  }
  return found;
}

export function draftProblemDetails(
  body: string,
  tellerText: string,
  maxWords: number | null,
  minWords: number | null = null,
  opts: DraftCheckOptions = {},
): DraftProblem[] {
  const problems: DraftProblem[] = [];
  const known = numbersIn(tellerText);
  const unknown = [...numbersIn(body)].filter((n) => n && !known.has(n));
  if (unknown.length) {
    const detail = unknown.slice(0, 5).join(', ');
    problems.push({ code: 'numbers', detail, message: `numbers the storyteller never wrote: ${detail}` });
  }
  const words = body.split(/\s+/).filter(Boolean).length;
  if (maxWords && words > Math.round(maxWords * 1.15)) {
    problems.push({ code: 'too_long', detail: String(words), message: `too long (${words} words, limit ${maxWords})` });
  }
  if (minWords && words < Math.round(minWords * 0.85)) {
    problems.push({ code: 'too_short', detail: String(words), message: `too short (${words} words, write at least ${minWords}): develop what the storyteller said instead of restating it` });
  }
  if (/[—–]/.test(body)) problems.push({ code: 'dashes', detail: '', message: 'em or en dashes' });
  const freq = addedFrequencyWords(body, tellerText);
  if (freq.length) {
    const detail = freq.join(', ');
    problems.push({ code: 'frequency', detail, message: `frequency words the storyteller never used: ${detail} (say only how often they said it happens)` });
  }
  const family = familyWordMismatches(body, tellerText);
  if (family.length) {
    const detail = family.join(', ');
    problems.push({ code: 'gender', detail, message: `family words that do not match the storyteller: ${detail} (keep every person's gender and number exactly as given)` });
  }
  const names = newProperNouns(body, tellerText, opts.allow ?? []);
  if (names.length) {
    const detail = names.slice(0, 6).join(', ');
    problems.push({ code: 'names', detail, message: `names or places the storyteller never wrote: ${detail} (remove them or use the storyteller's own wording)` });
  }
  return problems;
}

/** Problems as plain lines for the model's corrective retry. */
export function draftProblems(
  body: string,
  tellerText: string,
  maxWords: number | null,
  minWords: number | null = null,
  opts: DraftCheckOptions = {},
): string[] {
  return draftProblemDetails(body, tellerText, maxWords, minWords, opts).map((p) => p.message);
}

/** Notes for the storyteller when a problem survives the retry. Length and
 *  dash problems are the writer's business, not theirs, so they are skipped. */
export function tellerNotes(problems: DraftProblem[], language: 'en' | 'es'): string[] {
  const es = language === 'es';
  const lines: string[] = [];
  for (const p of problems) {
    switch (p.code) {
      case 'numbers':
        lines.push(es ? `Revise estos números; usted no los escribió en la entrevista: ${p.detail}.` : `Check these numbers; you did not write them in the interview: ${p.detail}.`);
        break;
      case 'frequency':
        lines.push(es ? `Revise estas palabras sobre la frecuencia; usted no las usó: ${p.detail}.` : `Check these words about how often; you did not use them: ${p.detail}.`);
        break;
      case 'gender':
        lines.push(es ? `Revise estas palabras de familia; no coinciden con lo que usted dijo: ${p.detail}.` : `Check these family words; they do not match what you said: ${p.detail}.`);
        break;
      case 'names':
        lines.push(es ? `Revise estos nombres o lugares; usted no los mencionó: ${p.detail}.` : `Check these names or places; you did not mention them: ${p.detail}.`);
        break;
      default:
        break;
    }
  }
  return lines;
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
