import { Resend } from 'resend';
import { buildStateEmail } from './email';
import type { StateDeliveryInput } from './types';

// Lazily constructed so importing this module never requires the key.
let _resend: Resend | null | undefined;
function client(): Resend | null {
  if (_resend === undefined) _resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  return _resend;
}

export interface StateSendResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when nothing was actually sent (dry run, or key not configured). */
  skipped?: boolean;
}

/**
 * Send one on-behalf-of email to a state legislator via Resend. `dryRun` builds
 * and validates the message but sends nothing (used for staging/testing).
 * Throws StateEmailError only if the input can't build; network/Resend errors
 * are returned in the result so a batch keeps going.
 */
export async function sendStateEmail(input: StateDeliveryInput, opts: { dryRun?: boolean } = {}): Promise<StateSendResult> {
  const email = buildStateEmail(input); // throws on invalid input
  if (opts.dryRun) return { ok: true, skipped: true };
  const resend = client();
  if (!resend) return { ok: false, skipped: true, error: 'RESEND_API_KEY not set' };
  try {
    const { data, error } = await resend.emails.send({
      from: `${email.fromName} <${email.from}>`,
      to: email.to,
      replyTo: email.replyTo,
      subject: email.subject,
      text: email.text,
    });
    return error ? { ok: false, error: error.message } : { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Send many, paced to protect sender reputation (default 8/sec). One failure
 * never aborts the batch — it's captured per item. Inputs that can't build are
 * captured as errors too rather than throwing.
 */
export async function sendStateBatch(
  inputs: StateDeliveryInput[],
  opts: { maxPerSecond?: number; dryRun?: boolean } = {},
): Promise<Array<{ input: StateDeliveryInput; result: StateSendResult }>> {
  const rate = Math.max(1, Math.min(20, opts.maxPerSecond ?? 8));
  const gapMs = Math.ceil(1000 / rate);
  const out: Array<{ input: StateDeliveryInput; result: StateSendResult }> = [];
  for (let i = 0; i < inputs.length; i++) {
    let result: StateSendResult;
    try {
      result = await sendStateEmail(inputs[i], { dryRun: opts.dryRun });
    } catch (e) {
      result = { ok: false, error: (e as Error).message };
    }
    out.push({ input: inputs[i], result });
    if (i < inputs.length - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
  return out;
}
