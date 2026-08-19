/**
 * Content rules George stressed on the SAA call, as pure helpers so the
 * app→CWC boundary can apply them and they can be unit-tested in isolation.
 */

import type { CwcMessageContent } from './types';

// The closings we recognize as the start of a signature block. Shared by the
// stripper (anchored to end-of-body) and the detector (anywhere in the body).
const CLOSING_WORDS =
  'sincerely|respectfully|regards|best regards|best|thank you|thanks|yours truly|warm regards|with gratitude';

/**
 * Remove a trailing signature/closing block from a message body. George asked
 * that the constituent's name and mailing address NOT appear in the message
 * body — they're already in the structured <Constituent> tags, and repeating
 * them in the body breaks the offices' campaign-grouping/dedup algorithms.
 *
 * Strips from a closing salutation ("Sincerely," etc.) through the end, which is
 * where a generated letter puts the name + city/state/zip. Conservative: only
 * cuts when a recognizable closing is present, so a body without one is left
 * untouched.
 */
export function stripSignatureBlock(body: string): string {
  if (!body) return body;
  const closing = new RegExp(`\\n+[ \\t]*(${CLOSING_WORDS})[,.!]?[ \\t]*(\\n[\\s\\S]*)?$`, 'i');
  return body.replace(closing, '').trim();
}

/**
 * George: federal offices don't want to hear from citizens about STATE bills —
 * there's nothing they can do, and it sours offices on the service. So a
 * state-bill campaign must never be delivered to a federal office via CWC.
 * Returns true when CWC/federal delivery should be BLOCKED for this campaign.
 */
export function blocksFederalDelivery(opts: { billLevel?: 'federal' | 'state' | null }): boolean {
  return opts.billLevel === 'state';
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
  return new RegExp(`(^|\\n)[ \\t]*(${CLOSING_WORDS})[,.!]?[ \\t]*(\\n|$)`, 'i').test(body);
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
 *   (a) state-bill campaigns must NEVER go to federal CWC (George);
 *   (b) a referenced federal bill requires a ProOrCon stance (George);
 *   (c) the body must not still contain a signature block after stripping —
 *       name/address in the body breaks the offices' grouping/dedup.
 */
export function cwcSendableProblems(input: {
  message: CwcMessageContent;
  billLevel?: 'federal' | 'state' | null;
}): string[] {
  const problems: string[] = [];
  const { message: m } = input;

  if (blocksFederalDelivery({ billLevel: input.billLevel })) {
    problems.push('campaign references a STATE bill — state bills must never be delivered to federal offices via CWC');
  }
  if (m.bills?.length && !m.stance) {
    problems.push('a federal bill is referenced but message.stance (ProOrCon) is missing — George requires pro/con with any bill reference');
  }
  for (const [label, text] of [
    ['constituentMessage', m.constituentMessage],
    ['organizationStatement', m.organizationStatement],
  ] as const) {
    if (text && containsSignatureBlock(stripSignatureBlock(text))) {
      problems.push(`message.${label} still contains a signature block after stripping — remove the closing/name/address from the body`);
    }
  }
  return problems;
}

/** Throwing wrapper around cwcSendableProblems for send paths. */
export function assertCwcSendable(input: {
  message: CwcMessageContent;
  billLevel?: 'federal' | 'state' | null;
}): void {
  const problems = cwcSendableProblems(input);
  if (problems.length) throw new CwcComplianceError(problems);
}
