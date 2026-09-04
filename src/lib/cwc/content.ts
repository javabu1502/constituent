/**
 * Content rules George stressed on the SAA call, as pure helpers so the
 * app→CWC boundary can apply them and they can be unit-tested in isolation.
 */

import type { CwcMessageContent } from './types';

// The closings we recognize as the start of a signature block. Multi-word
// variants MUST precede their prefixes ("respectfully yours" before
// "respectfully") — the alternation is first-match.
const CLOSING_WORDS = [
  'sincerely yours', 'yours sincerely', 'sincerely',
  'respectfully yours', 'respectfully submitted', 'respectfully',
  'best regards', 'kind regards', 'warm regards', 'warmest regards', 'regards',
  'best wishes', 'all the best', 'best',
  'thank you for your time', 'thank you', 'thanks so much', 'thanks',
  'yours truly', 'with gratitude', 'gratefully', 'warmly', 'cordially',
  'in solidarity', 'v/r', 'many thanks',
].join('|');

/** Normalize newlines (CRLF/CR → LF) and NBSP so the regexes below hold on
 * pasted/Windows content. Applied by every helper in this module. */
export function normalizeBodyText(body: string): string {
  return (body || '').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
}

// A line that plausibly belongs to a signature block (name, street, city/zip):
// short and not a prose sentence.
function isSignatureishLine(line: string): boolean {
  const l = line.trim();
  if (!l) return true;
  if (l.length > 64) return false;
  if (l.split(/\s+/).length > 8) return false; // names/addresses are short; prose isn't
  if (/[.!?]\s/.test(l)) return false; // sentence boundary mid-line
  if (/[!?]$/.test(l)) return false;
  return true;
}

/**
 * Remove a trailing signature/closing block from a message body. George asked
 * that the constituent's name and mailing address NOT appear in the message
 * body — they're already in the structured <Constituent> tags, and repeating
 * them in the body breaks the offices' campaign-grouping/dedup algorithms.
 *
 * Anchored to the END of the body: a closing line (or "Closing, Name" on one
 * line, or a "- Name" / "— Name" dash sign-off) within the last few lines is
 * stripped together with the signature-ish lines that follow it. A closing
 * that appears mid-message with real content after it is left alone — cutting
 * to end-of-body there silently destroyed constituent content. This stripper
 * is the cosmetic layer; redactConstituentPii (value-aware) is the guarantee.
 */
export function stripSignatureBlock(body: string): string {
  if (!body) return body;
  const text = normalizeBodyText(body).trim();
  const lines = text.split('\n');

  const closingLine = new RegExp(`^[ \t]*(${CLOSING_WORDS})[,.!]?[ \t]*$`, 'i');
  // "Sincerely, Jane Doe" — closing plus a short tail on one line.
  const closingWithName = new RegExp(`^[ \t]*(${CLOSING_WORDS}),[ \t]*[^\n]{1,48}$`, 'i');
  const dashSignoff = /^[ \t]*[-–—]\s*[A-Z][A-Za-z.'-]*(\s+[A-Z][A-Za-z.'-]*){0,3}[ \t]*$/;

  // Scan only the tail — a signature block is at most a closing + ~5 lines.
  const windowStart = Math.max(0, lines.length - 7);
  for (let i = windowStart; i < lines.length; i++) {
    const isClosing = closingLine.test(lines[i]) || closingWithName.test(lines[i]) || dashSignoff.test(lines[i]);
    if (!isClosing) continue;
    const rest = lines.slice(i + 1);
    if (rest.length <= 5 && rest.every(isSignatureishLine)) {
      return lines.slice(0, i).join('\n').trim();
    }
  }
  return text;
}

/** The pieces of a constituent record the redactor/detector needs. */
export interface PiiFields {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case/whitespace-insensitive pattern for a known value. */
function valuePattern(value: string): string {
  return escapeRegex(value.trim()).replace(/\s+/g, '\\s+');
}

/**
 * Remove whole lines that repeat the constituent's OWN name/address — the
 * value-aware guarantee behind George's no-name/address-in-body rule. Unlike
 * the pattern stripper, this knows the actual values from the structured
 * <Constituent> tags, so a name+address block ANYWHERE in the body (top-of-
 * letter business format, after a closing the stripper missed, CRLF paste) is
 * removed. Only whole lines are dropped; inline mentions are the gate's job
 * (containsConstituentPii) so we never chop mid-sentence.
 */
export function redactConstituentPii(body: string, c: PiiFields): string {
  if (!body) return body;
  const text = normalizeBodyText(body);
  const fullName = `${c.firstName} ${c.lastName}`.trim();
  const zip5 = c.zip.slice(0, 5);

  const lineTests: RegExp[] = [];
  if (fullName.length >= 3) {
    // A line that is (almost) just their name, optionally dash-prefixed.
    lineTests.push(new RegExp(`^[ \t]*[-–—]?[ \t]*${valuePattern(fullName)}[ \t]*[,.]?[ \t]*$`, 'i'));
  }
  for (const addr of [c.address1, c.address2]) {
    if (addr && addr.trim().length >= 4) {
      lineTests.push(new RegExp(`^[ \t]*${valuePattern(addr)}[ \t]*[,.]?[ \t]*$`, 'i'));
    }
  }
  // "City, ST 12345(-6789)?" / "City, ST" lines built from their actual city+state.
  if (c.city && c.state) {
    lineTests.push(new RegExp(`^[ \t]*${valuePattern(c.city)},?[ \t]+${valuePattern(c.state)}[ \t]*(${escapeRegex(zip5)}(-\\d{4})?)?[ \t]*$`, 'i'));
  }
  if (zip5.length === 5) {
    lineTests.push(new RegExp(`^[ \t]*${escapeRegex(zip5)}(-\\d{4})?[ \t]*$`));
  }

  const kept = text.split('\n').filter((line) => !lineTests.some((t) => t.test(line)));
  // Collapse the blank runs redaction leaves behind.
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * True when the body still carries the constituent's PII INLINE (mid-sentence)
 * where line-level redaction can't safely remove it — e.g. "My name is Jane
 * Doe and I live at 123 Main St". The gate refuses these so the caller can
 * regenerate, rather than us chopping sentences.
 */
export function containsConstituentPii(body: string, c: PiiFields): boolean {
  if (!body) return false;
  const text = normalizeBodyText(body);
  const fullName = `${c.firstName} ${c.lastName}`.trim();
  if (fullName.length >= 5 && new RegExp(valuePattern(fullName), 'i').test(text)) return true;
  if (c.address1.trim().length >= 6 && new RegExp(valuePattern(c.address1), 'i').test(text)) return true;
  return false;
}

/**
 * George's rule C: untouched template → OrganizationStatement; text the
 * constituent wrote or edited → ConstituentMessage. This helper is the ONE
 * place that mapping happens so every caller places messages consistently.
 */
export function placeMessage(input: { text: string; template?: string | null }): {
  organizationStatement?: string;
  constituentMessage?: string;
} {
  const norm = (s: string) => normalizeBodyText(s).replace(/\s+/g, ' ').trim().toLowerCase();
  if (input.template && norm(input.text) === norm(input.template)) {
    return { organizationStatement: input.text };
  }
  return { constituentMessage: input.text };
}

/**
 * George: federal offices don't want to hear from citizens about STATE bills —
 * there's nothing they can do, and it sours offices on the service. So a
 * state-bill campaign must never be delivered to a federal office via CWC.
 *
 * FAIL-CLOSED: `billLevel` must be explicitly 'federal' (a federal bill) or
 * 'none' (no bill). Anything else — including null/undefined, which is what a
 * campaign row with an unset bill_level produces — BLOCKS, because "we don't
 * know" must never default to "send it to Congress".
 */
export function blocksFederalDelivery(opts: { billLevel?: 'federal' | 'state' | 'none' | null }): boolean {
  return opts.billLevel !== 'federal' && opts.billLevel !== 'none';
}

/**
 * True when the body still contains a signature-style closing line — a line
 * that IS a closing salutation (possibly followed by a name/address). Used by
 * the pre-send gate as a belt-and-suspenders check AFTER stripSignatureBlock:
 * the stripper only cuts a trailing block, so a closing that survives (e.g.
 * followed by a P.S.) is flagged rather than silently sent.
 */
export function containsSignatureBlock(body: string): boolean {
  if (!body) return false;
  return new RegExp(`(^|\\n)[ \\t]*(${CLOSING_WORDS})[,.!]?[ \\t]*(\\n|$)`, 'i').test(normalizeBodyText(body));
}

/** Raised by assertCwcSendable — carries the full problem list. */
export class CwcComplianceError extends Error {
  constructor(public readonly problems: string[]) {
    super(`CWC compliance gate failed:\n- ${problems.join('\n- ')}`);
    this.name = 'CwcComplianceError';
  }
}

/**
 * The single pre-send compliance gate. Returns every problem (empty array =
 * sendable) so callers can surface them all at once:
 *   (a) the campaign must be explicitly federal-bill or no-bill — state bills
 *       (and UNKNOWN bill level) must never go to federal CWC (George);
 *   (b) a referenced federal bill requires a ProOrCon stance (George);
 *   (c) the body must not carry the constituent's name/address after the
 *       strip+redact pipeline — inline PII the redactor can't remove safely
 *       is refused here (George's dedup/grouping rule).
 */
export function cwcSendableProblems(input: {
  message: CwcMessageContent;
  billLevel?: 'federal' | 'state' | 'none' | null;
  constituent?: PiiFields;
}): string[] {
  const problems: string[] = [];
  const { message: m } = input;

  if (blocksFederalDelivery({ billLevel: input.billLevel })) {
    problems.push(
      input.billLevel === 'state'
        ? 'campaign references a STATE bill — state bills must never be delivered to federal offices via CWC'
        : "billLevel must be explicitly 'federal' or 'none' — an unknown bill level fails closed and is never sent to federal offices",
    );
  }
  if (m.bills?.length && !m.stance) {
    problems.push('a federal bill is referenced but message.stance (ProOrCon) is missing — George requires pro/con with any bill reference');
  }
  for (const [label, text] of [
    ['constituentMessage', m.constituentMessage],
    ['organizationStatement', m.organizationStatement],
  ] as const) {
    if (!text) continue;
    const cleaned = input.constituent
      ? redactConstituentPii(stripSignatureBlock(text), input.constituent)
      : stripSignatureBlock(text);
    if (!cleaned.trim()) {
      problems.push(`message.${label} is only a signature block / name-address lines — nothing remains after stripping, so there is no message to deliver`);
      continue;
    }
    if (containsSignatureBlock(cleaned)) {
      problems.push(`message.${label} still contains a signature block after stripping — remove the closing/name/address from the body`);
    }
    if (input.constituent && containsConstituentPii(cleaned, input.constituent)) {
      problems.push(`message.${label} contains the constituent's name or street address inline — rephrase without it (it is already carried in the <Constituent> tags)`);
    }
  }
  return problems;
}

/** Throwing wrapper around cwcSendableProblems for send paths. */
export function assertCwcSendable(input: {
  message: CwcMessageContent;
  billLevel?: 'federal' | 'state' | 'none' | null;
  constituent?: PiiFields;
}): void {
  const problems = cwcSendableProblems(input);
  if (problems.length) throw new CwcComplianceError(problems);
}
