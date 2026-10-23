/**
 * Outcome notifications for congressional delivery (CWC and webform).
 *
 * Two audiences:
 *  - the admin (ADMIN_NOTIFY_EMAIL): every hold, refusal and failure, with a
 *    masked constituent email, the official, the office code and the reason.
 *    This is the reliable channel while Resend runs on its test sender.
 *  - the constituent: held / refused / failed / delivered, in plain language
 *    that says what to do next. Sent only when `isConstituentEmailEnabled`
 *    (a verified From domain). Otherwise the helper logs a skip.
 *
 * Every function here is best-effort and never throws: a notification must
 * not change the outcome it reports on.
 */
import { sendAdminNotification, sendConstituentEmail } from '@/lib/resend';

export type DeliveryChannel = 'cwc' | 'webform';

export interface DeliveryRef {
  channel: DeliveryChannel;
  /** messages.id, when the queue row carries it. */
  messageId?: string | null;
  constituentEmail?: string | null;
  officialName?: string | null;
  officeCode?: string | null;
  queueId?: number | null;
  messageKey?: string | null;
  /** Webform only: the office's own contact form, for the constituent's fallback. */
  formUrl?: string | null;
}

export type ConstituentOutcome = 'held' | 'refused' | 'failed' | 'delivered';

type AdminSender = (subject: string, html: string) => Promise<void>;
type ConstituentSender = (to: string | null | undefined, subject: string, html: string) => Promise<'sent' | 'skipped'>;

let adminSender: AdminSender = sendAdminNotification;
let constituentSender: ConstituentSender = sendConstituentEmail;

/** Test seam. Pass nothing to restore the real senders. */
export function setCwcNotifiers(opts?: { admin?: AdminSender; constituent?: ConstituentSender }): void {
  adminSender = opts?.admin ?? sendAdminNotification;
  constituentSender = opts?.constituent ?? sendConstituentEmail;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://mydemocracy.app').replace(/\/+$/, '');
}

/** j***@example.com. Never put a full constituent email in an admin mail. */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '(no email)';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

export function escapeHtml(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function channelLabel(channel: DeliveryChannel): string {
  return channel === 'cwc' ? 'CWC' : 'webform';
}

function officialLabel(ref: DeliveryRef): string {
  const name = ref.officialName?.trim();
  const code = ref.officeCode?.trim();
  if (name && code) return `${name} (${code})`;
  return name || code || 'the office';
}

function refRows(ref: DeliveryRef): string {
  const rows = [
    `<li><strong>Constituent:</strong> ${escapeHtml(maskEmail(ref.constituentEmail))}</li>`,
    `<li><strong>Official:</strong> ${escapeHtml(officialLabel(ref))}</li>`,
    `<li><strong>Channel:</strong> ${channelLabel(ref.channel)}</li>`,
  ];
  if (ref.queueId != null) rows.push(`<li><strong>Queue row:</strong> #${ref.queueId}</li>`);
  if (ref.messageId) rows.push(`<li><strong>Message id:</strong> ${escapeHtml(ref.messageId)}</li>`);
  if (ref.messageKey) rows.push(`<li><strong>Message key:</strong> ${escapeHtml(ref.messageKey)}</li>`);
  return rows.join('\n');
}

async function sendAdmin(subject: string, html: string): Promise<void> {
  try {
    await adminSender(subject, html);
  } catch (e) {
    console.error('[cwc/notify] admin notification failed:', (e as Error).message);
  }
}

/** The screener held a message for human review. */
export async function notifyAdminHeld(ref: DeliveryRef & { reasons: string[]; offices?: string[] }): Promise<void> {
  const offices = ref.offices?.length ? ref.offices.join(', ') : (ref.officeCode ?? '');
  const reasons = ref.reasons.length
    ? `<ul>${ref.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`
    : '<p>(no reasons given)</p>';
  await sendAdmin(
    `${channelLabel(ref.channel)} message held for review: ${officialLabel(ref)}`,
    `<h2>Message held before delivery</h2>
     <ul>${refRows(ref)}${offices ? `<li><strong>Offices:</strong> ${escapeHtml(offices)}</li>` : ''}</ul>
     <p><strong>Screener reasons</strong></p>
     ${reasons}
     <p>The constituent was told the message is under review. Approve or reject it at
     <a href="${siteUrl()}/admin/compliance">${siteUrl()}/admin/compliance</a>.</p>`,
  );
}

/** The drain refused or failed a queued message. */
export async function notifyAdminOutcome(ref: DeliveryRef & { outcome: 'refused' | 'failed'; reason: string }): Promise<void> {
  const verb = ref.outcome === 'refused' ? 'refused' : 'failed';
  await sendAdmin(
    `${channelLabel(ref.channel)} delivery ${verb}: ${officialLabel(ref)}`,
    `<h2>Delivery ${verb}</h2>
     <ul>${refRows(ref)}</ul>
     <p><strong>Reason:</strong> ${escapeHtml(ref.reason)}</p>
     <p>The constituent was told the message was sent. Review the row at
     <a href="${siteUrl()}/admin/cwc-queue">${siteUrl()}/admin/cwc-queue</a>.</p>`,
  );
}

/** The webform worker ran out of attempts. */
export async function notifyAdminWebformFailed(ref: DeliveryRef & { reason: string; attempts: number }): Promise<void> {
  await sendAdmin(
    `Webform delivery failed after ${ref.attempts} attempts: ${officialLabel(ref)}`,
    `<h2>Webform delivery failed</h2>
     <ul>${refRows(ref)}${ref.formUrl ? `<li><strong>Form:</strong> ${escapeHtml(ref.formUrl)}</li>` : ''}</ul>
     <p><strong>Last error:</strong> ${escapeHtml(ref.reason)}</p>
     <p>The row is terminal. Fix the cause, then requeue it by setting status to queued and attempts to 0.</p>`,
  );
}

/** Generic admin alert (queue health, retention). */
export async function notifyAdminAlert(subject: string, html: string): Promise<void> {
  await sendAdmin(subject, html);
}

/** Plain copy for the constituent, per outcome. Exported for tests. */
export function constituentEmailCopy(ref: DeliveryRef, outcome: ConstituentOutcome): { subject: string; html: string } {
  const official = escapeHtml(ref.officialName?.trim() || 'your official');
  const site = siteUrl();
  const footer = `<p>My Democracy sends messages through the official congressional delivery systems. Reply to this email if you have a question.</p>`;
  switch (outcome) {
    case 'held':
      return {
        subject: `Your message to ${official} is under review`,
        html: `<p>We received your message to ${official}.</p>
<p>A reviewer is checking it before it goes to the office. This usually takes less than a day. You do not need to do anything.</p>
<p>We will email you when it is delivered.</p>
${footer}`,
      };
    case 'refused':
      return {
        subject: `Your message to ${official} was not delivered`,
        html: `<p>The congressional delivery system could not match your street address to ${official}'s office, so the message was not delivered.</p>
<p>Please check the street address, including the house number, and send the message again at <a href="${site}/contact">${site}/contact</a>.</p>
${footer}`,
      };
    case 'failed':
      return ref.channel === 'webform'
        ? {
            subject: `Your message to ${official} was not delivered`,
            html: `<p>We could not file your message in ${official}'s contact form.</p>
<p>Please send it yourself${ref.formUrl ? ` at <a href="${escapeHtml(ref.formUrl)}">${escapeHtml(ref.formUrl)}</a>` : ''}, or open <a href="${site}/contact">${site}/contact</a> and choose the email option.</p>
${footer}`,
          }
        : {
            subject: `Your message to ${official} was not delivered`,
            html: `<p>We could not hand your message to the congressional delivery system for ${official}.</p>
<p>Please open <a href="${site}/contact">${site}/contact</a>, pick ${official}, and choose the email option to send it from your own email app.</p>
${footer}`,
          };
    case 'delivered':
      return {
        subject: `Your message to ${official} was delivered`,
        html: `<p>${official}'s office received your message${ref.channel === 'cwc' ? ' through the Communicating with Congress system' : ' through the office contact form'}.</p>
<p>Offices read this mail and may reply to the email address you gave.</p>
${footer}`,
      };
  }
}

/**
 * Email the constituent about an outcome. Gated inside the sender: on the
 * Resend test sender this logs a skip and returns 'skipped'.
 */
export async function notifyConstituent(ref: DeliveryRef, outcome: ConstituentOutcome): Promise<'sent' | 'skipped'> {
  const email = (ref.constituentEmail || '').trim();
  if (!email) {
    console.log(`[cwc/notify] constituent ${outcome} email skipped: no address (message ${ref.messageId ?? '?'})`);
    return 'skipped';
  }
  try {
    const { subject, html } = constituentEmailCopy(ref, outcome);
    const result = await constituentSender(email, subject, html);
    console.log(`[cwc/notify] constituent ${outcome} email ${result} for ${maskEmail(email)} (${officialLabel(ref)})`);
    return result;
  } catch (e) {
    console.error('[cwc/notify] constituent notification failed:', (e as Error).message);
    return 'skipped';
  }
}
