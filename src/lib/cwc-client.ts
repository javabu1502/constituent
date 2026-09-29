'use client';

import { useEffect, useState } from 'react';
import type { Official } from '@/lib/types';
import { CWC_ENABLED } from '@/lib/cwc-prefixes';
import { resolveOfficeCode } from '@/lib/cwc/offices';

/**
 * Client-side knowledge of which congressional offices accept CWC delivery.
 *
 * The send step shows ONE action per official: "Send to Congress" when the
 * office participates (the message is delivered through the official
 * Communicating With Congress system and the constituent never opens an
 * email app), or the existing email / contact-form actions when it does not
 * (Jared, 2026-09-28: "if the emails are delivered through CWC then we
 * should not give the send option", and non-participating senators must
 * keep a path). Participation comes from /api/cwc/offices; until it loads,
 * or if it fails, nothing is CWC-deliverable and every office falls back.
 */
export interface CwcActiveOffices {
  loaded: boolean;
  codes: ReadonlySet<string>;
  /** Bioguide ids of non-CWC senators whose own contact form we file. */
  webformIds: ReadonlySet<string>;
}

const EMPTY: CwcActiveOffices = { loaded: false, codes: new Set(), webformIds: new Set() };

export function useCwcActiveOffices(): CwcActiveOffices {
  const [offices, setOffices] = useState<CwcActiveOffices>(EMPTY);
  useEffect(() => {
    if (!CWC_ENABLED) return;
    let cancelled = false;
    fetch('/api/cwc/offices')
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data: { house?: string[]; senate?: string[]; webform?: string[] } | null) => {
        if (cancelled || !data) return;
        setOffices({ loaded: true, codes: new Set([...(data.house ?? []), ...(data.senate ?? [])]), webformIds: new Set(data.webform ?? []) });
      })
      .catch(() => { /* fail safe: stays not-deliverable → email path */ });
    return () => { cancelled = true; };
  }, []);
  return offices;
}

/** Seat code for a federal official, or null when it cannot be derived. */
export function cwcOfficeCodeFor(official: Official): string | null {
  if (official.level !== 'federal') return null;
  const r = resolveOfficeCode(official);
  return r.ok ? r.code : null;
}

/**
 * True when this official's message will be delivered through CWC: the
 * rollout flag is on, the office is on the live participating list, and the
 * flow collected everything the payload needs (title, email, street, zip).
 */
export function isCwcDeliverable(
  official: Official,
  offices: CwcActiveOffices,
  fields: { prefix?: string; email?: string; street?: string; zip?: string },
): boolean {
  if (!CWC_ENABLED || !offices.loaded) return false;
  const code = cwcOfficeCodeFor(official);
  if (!code || !offices.codes.has(code)) return false;
  return Boolean(fields.prefix && fields.email?.trim() && fields.street?.trim() && /^\d{5}/.test(fields.zip?.trim() ?? ''));
}

/**
 * True when we will file this official's message in the office's own contact
 * form (non-CWC senator, CAPTCHA-free form, flag on) and the fields exist.
 */
export function isWebformDeliverable(
  official: Official,
  offices: CwcActiveOffices,
  fields: { prefix?: string; email?: string; street?: string; zip?: string },
): boolean {
  if (!CWC_ENABLED || !offices.loaded || !offices.webformIds.has(official.id)) return false;
  return Boolean(fields.prefix && fields.email?.trim() && fields.street?.trim() && /^\d{5}/.test(fields.zip?.trim() ?? ''));
}

/** Which "Send to Congress" channel applies, if any. */
export function congressChannel(
  official: Official,
  offices: CwcActiveOffices,
  fields: { prefix?: string; email?: string; street?: string; zip?: string },
): 'cwc' | 'webform' | null {
  if (isCwcDeliverable(official, offices, fields)) return 'cwc';
  if (isWebformDeliverable(official, offices, fields)) return 'webform';
  return null;
}

/** The track-send delivery_status for a webform hand-off. */
export const WEBFORM_SUBMITTED_STATUS = 'webform_submitted';

/** A senator whose office is NOT on the participating list (list loaded). */
export function isNonParticipatingSenator(official: Official, offices: CwcActiveOffices): boolean {
  if (!CWC_ENABLED || !offices.loaded) return false;
  if (official.level !== 'federal' || official.chamber !== 'senate') return false;
  if (offices.webformIds.has(official.id)) return false; // we file their form for them
  const code = cwcOfficeCodeFor(official);
  return !!code && !offices.codes.has(code);
}

/** How many Senate offices currently accept CWC delivery. */
export function participatingSenateCount(offices: CwcActiveOffices): number {
  let n = 0;
  for (const c of offices.codes) if (c.startsWith('S')) n++;
  return n;
}

export interface AdoptionSignaturePayload {
  senator_id: string;
  senator_name: string;
  state: string;
  office_code?: string;
  name: string;
  email: string;
  city?: string;
  zip?: string;
  source: 'contact' | 'campaign';
  campaign_id?: string;
  turnstileToken?: string;
}

/** Fire-and-forget: record the signature. Failures are logged, never shown. */
export function submitAdoptionSignature(payload: AdoptionSignaturePayload): void {
  fetch('/api/cwc/adoption-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => { if (!res.ok) console.error('[cwc/adoption-signature] Failed:', res.status, await res.text()); })
    .catch((err) => console.error('[cwc/adoption-signature] Failed:', err));
}

/** The track-send delivery_status that means "delivered through CWC". */
export const CWC_SUBMITTED_STATUS = 'cwc_submitted';

/** What a send click learned from /api/track-send. */
export interface SendOutcome {
  ok: boolean;
  /** Server-provided error text (cooldown, validation), shown to the user. */
  error?: string;
  cwc?: { status: 'queued' | 'held' | 'blocked' | 'skipped' | 'error'; reason?: string };
}

export type CwcButtonState = 'idle' | 'sending' | 'sent' | 'failed';

/** Copy for the CWC card after a send attempt. Flat sentences, no em dashes. */
export const WEBFORM_COPY = {
  idle: 'This office does not use the congressional delivery system yet, so My Democracy files your message in the office\'s own contact form for you. No email app needed. Your name and address go in the form\'s own fields.',
  sending: 'Handing your message to the delivery queue.',
  sent: 'Received. My Democracy will file it in the office\'s contact form within about an hour.',
} as const;

export const CWC_COPY = {
  idle: 'Goes straight to the office through Communicating with Congress, the message system run by the House and Senate. No email app needed. Your name and address travel in separate fields, so no signature is needed in the text.',
  sending: 'Handing your message to the congressional delivery system.',
  sent: 'Received by the congressional delivery system. Delivery usually completes within minutes and pauses overnight during House and Senate maintenance windows.',
  blocked: 'This message could not be accepted for delivery to Congress.',
  fallbackPrefix: 'We could not hand this message to the congressional delivery system.',
} as const;

/** Turn a send outcome into the card state + note the constituent sees. */
export function describeCwcOutcome(outcome: SendOutcome | void): { state: CwcButtonState; note: string } {
  if (!outcome) return { state: 'failed', note: `${CWC_COPY.fallbackPrefix} Use the email option below.` };
  if (!outcome.ok) return { state: 'failed', note: outcome.error ? outcome.error : `${CWC_COPY.fallbackPrefix} Use the email option below.` };
  const status = outcome.cwc?.status;
  if (status === 'queued' || status === 'held') return { state: 'sent', note: CWC_COPY.sent };
  if (status === 'blocked') return { state: 'failed', note: CWC_COPY.blocked };
  const reason = outcome.cwc?.reason ?? '';
  if (/no last name/i.test(reason)) {
    return { state: 'failed', note: 'Congressional offices require a first and last name. Go back, add your last name, and try again. Or use the email option below.' };
  }
  return { state: 'failed', note: `${CWC_COPY.fallbackPrefix} Use the email option below.` };
}
