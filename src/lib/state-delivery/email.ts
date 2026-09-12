import type { StateDeliveryInput } from './types';

/** Raised when an input can't produce a valid on-behalf-of email. */
export class StateEmailError extends Error {}

export interface BuiltStateEmail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  /** For a name-based display From, e.g. "Jane Doe (via My Democracy)". */
  fromName: string;
}

const escapeHeader = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

/**
 * Build the authenticated on-behalf-of email to a state legislator.
 *
 * Deliverability rules baked in:
 *  - From is OUR sending domain (RESEND_FROM_EMAIL). We do NOT spoof the
 *    constituent's From — that would fail DKIM/DMARC and be filtered as spam.
 *  - The display name makes the human clear: "Jane Doe (via My Democracy)".
 *  - Reply-To is the constituent, so the office replies to the real person.
 *  - The body carries the two-block message plus a plain identity line so the
 *    office can see who the constituent is (name, city/state) — enough to verify
 *    constituency without the letter-style address block.
 */
export function buildStateEmail(input: StateDeliveryInput): BuiltStateEmail {
  const { constituent: c, target } = input;
  const orgStmt = input.organizationStatement?.trim();
  const consMsg = input.constituentMessage?.trim();
  if (!orgStmt && !consMsg) throw new StateEmailError('need organizationStatement and/or constituentMessage');
  if (!c.email?.includes('@')) throw new StateEmailError('constituent email is required for Reply-To');
  if (!target.email?.includes('@')) throw new StateEmailError('target legislator has no email (use the webform path)');
  if (input.subject.trim().length < 3) throw new StateEmailError('subject too short');

  const from = process.env.RESEND_FROM_EMAIL || 'notifications@mydemocracy.app';
  const fromName = escapeHeader(`${c.firstName} ${c.lastName} (via My Democracy)`);
  const lastName = target.name.split(/\s+/).pop() ?? target.name;

  const identity = [`${c.firstName} ${c.lastName}`, [c.city, c.state].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join('\n');

  const body = [
    `Dear ${target.title} ${lastName},`,
    orgStmt,
    consMsg,
    input.organizationName ? `Sent via My Democracy on behalf of ${input.organizationName}.` : 'Sent via My Democracy.',
    identity,
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    from,
    fromName,
    to: target.email,
    replyTo: c.email,
    subject: escapeHeader(input.subject),
    text: body,
  };
}
