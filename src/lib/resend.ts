import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
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
