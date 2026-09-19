import type { Official } from '@/lib/types';
import { determineDeliveryMethod } from '@/lib/delivery';
import { resolveOfficeCode } from './offices';

/**
 * Decide HOW to deliver a message to one official, so no constituent is left
 * without a route — the point George stressed and the gap for the ~46 Senate
 * offices that don't participate in CWC.
 *
 * Priority ladder:
 *   1. CWC     — federal office that participates (the official pipe).
 *   2. webform — office isn't on CWC but has a contact form we can automate
 *                (Claude Vision + Playwright, src/lib/form-automation), unless
 *                the form is CAPTCHA-blocked.
 *   3. email   — staffer/office email (mailto), incl. the CAPTCHA-blocked case.
 *   4. phone   — last resort when only a number exists.
 *   5. none    — genuinely no contact method.
 *
 * This is a PURE decision function — it returns the channel + the metadata a
 * server-side sender needs, and imports no browser/Playwright code, so it's
 * safe to run anywhere. The actual send happens in the channel's own sender.
 */
export type DeliveryChannel = 'cwc' | 'webform' | 'email' | 'phone' | 'none';

export interface ChannelDecision {
  channel: DeliveryChannel;
  /** CWC seat code, when channel === 'cwc'. */
  officeCode?: string;
  /** Contact-form URL to automate, when channel === 'webform'. */
  formUrl?: string;
  /** Recipient email, when channel === 'email'. */
  email?: string;
  reason: string;
}

export interface RouteOptions {
  /** Office codes currently accepting CWC mail (from getActiveOffices). */
  activeOfficeCodes: ReadonlySet<string>;
  /** Bioguide/official ids whose webform is known CAPTCHA-blocked. */
  captchaBlockedIds?: Set<string>;
}

export function chooseDeliveryChannel(official: Official, opts: RouteOptions): ChannelDecision {
  // 1. CWC for a federal office that participates.
  const resolved = resolveOfficeCode(official);
  if (resolved.ok && opts.activeOfficeCodes.has(resolved.code)) {
    return { channel: 'cwc', officeCode: resolved.code, reason: 'office participates in CWC' };
  }

  // Otherwise use the app's existing per-official delivery determination.
  const info = determineDeliveryMethod(official, 'email', opts.captchaBlockedIds);

  // 2. Automate the office's own webform when one exists and isn't CAPTCHA-gated.
  //    This is the path that covers non-participating Senate offices.
  if (info.contactFormUrl && !info.captchaBlocked) {
    return {
      channel: 'webform',
      formUrl: info.contactFormUrl,
      reason: resolved.ok
        ? 'federal office not on CWC — automating its contact webform'
        : 'automating contact webform',
    };
  }

  // 3. Email fallback (includes the CAPTCHA-blocked webform case).
  if (info.email) {
    return {
      channel: 'email',
      email: info.email,
      reason: info.captchaBlocked ? 'webform is CAPTCHA-blocked — using email' : 'no automatable form — using email',
    };
  }

  // 4. Phone, then nothing.
  if (official.phone) return { channel: 'phone', reason: 'only a phone number is available' };
  return { channel: 'none', reason: 'no contact method available' };
}

/**
 * Route a batch of officials, returning per-official decisions plus a summary
 * so a campaign can see its coverage at a glance (how many via CWC vs webform
 * vs email, and whether anyone is unreachable).
 */
export function routeDelivery(officials: Official[], opts: RouteOptions): {
  decisions: Array<{ official: Official; decision: ChannelDecision }>;
  summary: Record<DeliveryChannel, number>;
} {
  const decisions = officials.map((official) => ({ official, decision: chooseDeliveryChannel(official, opts) }));
  const summary: Record<DeliveryChannel, number> = { cwc: 0, webform: 0, email: 0, phone: 0, none: 0 };
  for (const { decision } of decisions) summary[decision.channel]++;
  return { decisions, summary };
}
