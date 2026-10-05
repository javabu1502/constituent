/**
 * Language handling for participant text.
 *
 * Decision (Jared, 2026-09-18): when a participant writes in Spanish, the
 * official gets BOTH: the participant's own Spanish and an English rendering,
 * in one message. The drafting pipeline and every quality gate are English,
 * so Spanish input is translated once (strictly, nothing added) and the
 * English pipeline runs on the translation. The participant's original words
 * are carried through untouched and appended to the letter.
 */
import { callClaude, extractJSON } from './claude';

export type SupportedLanguage = 'en' | 'es';

// Function words that are common in Spanish and rare in English. Kept to
// words with no English homograph in normal prose ("a", "no", "me" are
// deliberately absent).
const SPANISH_MARKERS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'que', 'y', 'en', 'un', 'una', 'es', 'por', 'para',
  'con', 'mi', 'mis', 'su', 'sus', 'se', 'lo', 'le', 'al', 'pero', 'como', 'muy', 'más',
  'esto', 'esta', 'este', 'porque', 'cuando', 'también', 'tengo', 'tiene', 'somos', 'son',
  'está', 'están', 'hay', 'nos', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'ya', 'sin',
  'hijos', 'hija', 'hijo', 'familia', 'trabajo', 'años', 'necesitamos', 'gracias', 'ustedes',
  'yo', 'ella', 'él', 'ellos', 'nosotros', 'sobre', 'entre', 'desde', 'hasta', 'donde', 'cada',
]);

const ENGLISH_MARKERS = new Set([
  'the', 'and', 'of', 'to', 'in', 'is', 'that', 'for', 'with', 'my', 'our', 'are', 'was',
  'this', 'have', 'has', 'not', 'but', 'they', 'we', 'you', 'it', 'on', 'be', 'from', 'at',
  'as', 'their', 'because', 'when', 'would', 'about', 'family', 'children', 'kids', 'years',
]);

/**
 * Cheap, dependency-free guess at whether free text is Spanish. Counts
 * language-specific function words; Spanish wins when it clearly outnumbers
 * English. Short or empty text is treated as English so the pipeline never
 * translates on a whim.
 */
export function detectLanguage(text: string | null | undefined): SupportedLanguage {
  if (!text) return 'en';
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 4) return 'en';
  let es = 0;
  let en = 0;
  for (const w of words) {
    if (SPANISH_MARKERS.has(w)) es++;
    else if (ENGLISH_MARKERS.has(w)) en++;
  }
  // Accented letters and ñ are a strong signal on their own.
  const accents = (text.match(/[áéíóúñ¿¡]/gi) ?? []).length;
  const score = es + Math.min(accents, 5);
  return score >= 2 && score > en * 1.5 ? 'es' : 'en';
}

/**
 * Faithful English rendering of a participant's Spanish. Translation only:
 * no additions, no softening, no explanation. Returns null when the model
 * fails, so callers can decide whether to proceed in the original language.
 */
export async function translateToEnglish(text: string): Promise<string | null> {
  const system = `You translate a person's own words from Spanish to English so an English reader can read exactly what they said.
Rules:
- Translate faithfully. Keep every fact, number, name, and the person's meaning exactly. Add nothing, remove nothing, soften nothing, explain nothing.
- Keep first person. Keep their tone and paragraph breaks. Plain English, no dashes.
- If part of the text is already English, keep it as written.
Return ONLY JSON: {"english": "..."}`;
  try {
    const raw = await callClaude(system, text, 2500);
    const out = extractJSON(raw) as { english?: unknown } | null;
    const english = typeof out?.english === 'string' ? out.english.trim() : '';
    return english.length >= 3 ? english : null;
  } catch (err) {
    console.error('[language] translate failed:', err);
    return null;
  }
}

/** Heading that introduces the participant's original words inside the letter. */
export const ORIGINAL_WORDS_HEADING: Record<SupportedLanguage, string> = {
  en: 'In my own words:',
  es: 'En mis propias palabras (original en español):',
};

/**
 * The block appended to a letter so the official gets the participant's own
 * Spanish alongside the English. Kept to plain lines: no closing, no name,
 * so the CWC signature stripper and PII checks have nothing to trip on.
 */
export function formatOriginalWordsBlock(original: { language: SupportedLanguage; text: string }): string {
  const heading = ORIGINAL_WORDS_HEADING[original.language];
  return `${heading}\n${original.text.trim()}`;
}

/**
 * For a submitted story: which language it is in and, when it is Spanish,
 * a faithful English rendering for the organization reading it. English
 * stories return body_en null. A failed translation also returns null so
 * the story is still saved; the org then sees the original.
 */
export async function renderStoryEnglish(body: string): Promise<{ language: SupportedLanguage; body_en: string | null }> {
  const language = detectLanguage(body);
  if (language !== 'es') return { language: 'en', body_en: null };
  const body_en = await translateToEnglish(body);
  if (!body_en) console.warn('[language] story translation failed; saving without English rendering');
  return { language, body_en };
}
