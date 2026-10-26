import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

/** True when outbound email can actually be sent (a missing key makes the
 * send helpers no-op with a warning, which some callers must not tolerate). */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendDigestEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn('[resend] RESEND_API_KEY not set, skipping email');
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'notifications@mydemocracy.app';

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    console.error('[resend] Failed to send email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * True when email may go to a constituent. Resend's test sender
 * (onboarding@resend.dev) only delivers to the account owner, so while the
 * From address is on resend.dev every constituent email is skipped and
 * logged. Admin notifications are unaffected.
 */
export function isConstituentEmailEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const from = (env.RESEND_FROM_EMAIL || '').trim().toLowerCase();
  if (!env.RESEND_API_KEY) return false;
  if (!from) return false;
  return !from.endsWith('resend.dev');
}

/**
 * Send a transactional email to a constituent. Returns 'skipped' (with a log
 * line) when constituent email is not enabled or the address is missing.
 * Best-effort: never throws.
 */
export async function sendConstituentEmail(
  to: string | null | undefined,
  subject: string,
  html: string,
): Promise<'sent' | 'skipped'> {
  const address = (to || '').trim();
  if (!address) {
    console.log('[resend] constituent email skipped: no address');
    return 'skipped';
  }
  if (!isConstituentEmailEnabled()) {
    console.log(`[resend] constituent email skipped (sender not verified or key missing): "${subject}"`);
    return 'skipped';
  }
  const resend = getResend();
  if (!resend) return 'skipped';
  const from = process.env.RESEND_FROM_EMAIL as string;
  try {
    const { error } = await resend.emails.send({ from, to: address, subject, html });
    if (error) {
      console.error('[resend] Failed to send constituent email:', error);
      return 'skipped';
    }
    return 'sent';
  } catch (e) {
    console.error('[resend] constituent email threw:', (e as Error).message);
    return 'skipped';
  }
}

/**
 * Send an internal admin notification (e.g. a new campaign awaiting approval)
 * to ADMIN_NOTIFY_EMAIL. Best-effort: never throws, so it can't break the
 * action that triggered it.
 */
export async function sendAdminNotification(
  subject: string,
  html: string
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn('[resend] RESEND_API_KEY not set, skipping admin notification');
    return;
  }

  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) {
    console.warn('[resend] ADMIN_NOTIFY_EMAIL not set, skipping admin notification');
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error('[resend] Failed to send admin notification:', error);
  }
}
