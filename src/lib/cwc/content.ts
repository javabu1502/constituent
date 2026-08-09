/**
 * Content rules George stressed on the SAA call, as pure helpers so the
 * app→CWC boundary can apply them and they can be unit-tested in isolation.
 */

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
  const closing = /\n+[ \t]*(sincerely|respectfully|regards|best regards|best|thank you|thanks|yours truly|warm regards|with gratitude)[,.!]?[ \t]*(\n[\s\S]*)?$/i;
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
