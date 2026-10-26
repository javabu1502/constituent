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
 * keep a path). Participation comes from /api/cwc/offices. Until the list
 * resolves, federal cards show a disabled "Checking delivery options"
 * button so a mailto click can never race a later CWC click for the same
 * office. Once resolved (loaded, or failed and treated as empty), every
 * office falls to the email path unless it is on the list.
 */
export interface CwcActiveOffices {
  /** True once the fetch resolved, succeeded or not, or when CWC is off. */
  loaded: boolean;
  codes: ReadonlySet<string>;
  /** Bioguide ids of non-CWC senators whose own contact form we file. */
  webformIds: ReadonlySet<string>;
}

const EMPTY: CwcActiveOffices = { loaded: false, codes: new Set(), webformIds: new Set() };
const RESOLVED_EMPTY: CwcActiveOffices = { loaded: true, codes: new Set(), webformIds: new Set() };

/** How long the client waits for the office list before falling to email. */
const OFFICES_TIMEOUT_MS = 8000;

let officesPromise: Promise<CwcActiveOffices> | null = null;

/**
 * One shared fetch of the participating-office list for the whole page.
 * Never rejects: a failure or a timeout resolves to an empty, LOADED list
 * so no flow stalls on it.
 */
export function loadCwcActiveOffices(): Promise<CwcActiveOffices> {
  if (!CWC_ENABLED) return Promise.resolve(RESOLVED_EMPTY);
  if (officesPromise) return officesPromise;
  const signal = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(OFFICES_TIMEOUT_MS) : undefined;
  officesPromise = fetch('/api/cwc/offices', { signal })
    .then(async (res) => (res.ok ? res.json() : null))
    .then((data: { house?: string[]; senate?: string[]; webform?: string[] } | null) => {
      if (!data) return RESOLVED_EMPTY;
      return { loaded: true, codes: new Set([...(data.house ?? []), ...(data.senate ?? [])]), webformIds: new Set(data.webform ?? []) };
    })
    .catch(() => {
      // Let the next mount try again; this one falls to the email path.
      officesPromise = null;
      return RESOLVED_EMPTY;
    });
  return officesPromise;
}

export function useCwcActiveOffices(): CwcActiveOffices {
  const [offices, setOffices] = useState<CwcActiveOffices>(CWC_ENABLED ? EMPTY : RESOLVED_EMPTY);
  useEffect(() => {
    if (!CWC_ENABLED) return;
    let cancelled = false;
    loadCwcActiveOffices().then((o) => { if (!cancelled) setOffices(o); });
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

/**
 * Which "Send to Congress" channel applies, if any. A street the geocoder
 * could not place (`districtResolved === false`) never gets a congressional
 * channel: the office would refuse it, so the person uses email instead and
 * is told why on the card.
 */
export function congressChannel(
  official: Official,
  offices: CwcActiveOffices,
  fields: { prefix?: string; email?: string; street?: string; zip?: string },
  districtResolved: boolean = true,
): 'cwc' | 'webform' | null {
  if (!districtResolved) return null;
  if (isCwcDeliverable(official, offices, fields)) return 'cwc';
  if (isWebformDeliverable(official, offices, fields)) return 'webform';
  return null;
}

/**
 * True while a federal official's delivery channel is still unknown: the
 * office list has not resolved yet. Cards show a disabled button then.
 */
export function deliveryUndecided(official: Official, offices: CwcActiveOffices): boolean {
  return CWC_ENABLED && official.level === 'federal' && !offices.loaded;
}

/**
 * Streets that congressional offices cannot match to a home address: dorms,
 * campus buildings, PO boxes, or anything without a leading house number.
 * Shown as a warning before the lookup, never a block.
 */
export const UNDELIVERABLE_STREET = /\bP\.?\s?O\.?\s*box\b|\bdorm|\bhall\b|university|college/i;

export function streetLooksUndeliverable(street: string): boolean {
  const s = street.trim();
  if (!s) return false;
  if (UNDELIVERABLE_STREET.test(s)) return true;
  return !/^\d+[A-Za-z]?\b/.test(s);
}

/**
 * Whether the representatives lookup could place the street. The route
 * falls back to senators-only when the geocoder fails; a message sent then is
 * refused downstream, so the client must know.
 *
 * This reads the district, not the presence of a warning. Keying off any
 * warning string meant a second, unrelated condition (district resolved, no
 * House member on file) withheld congressional delivery from the person's
 * SENATORS, who need no district, and told them their street was bad. That
 * condition travels as `houseWarning` and does not belong here.
 */
export function districtResolvedFrom(data: { warning?: unknown; address?: { congressionalDistrict?: unknown } } | null | undefined): boolean {
  if (!data) return false;
  const d = data.address?.congressionalDistrict;
  if (d === 'unknown' || d === undefined || d === null || d === '') return false;
  return true;
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

/**
 * Client-only marker for a CWC hand-off the queue is holding for review.
 * Never sent to the server (track-send's status enum does not carry it);
 * it keeps the card in its held state across a refresh.
 */
export const CWC_HELD_STATUS = 'cwc_held';

/** Statuses that mean the message already left this card once. */
export const SENT_STATUSES: ReadonlySet<string> = new Set([
  CWC_SUBMITTED_STATUS,
  CWC_HELD_STATUS,
  WEBFORM_SUBMITTED_STATUS,
  'email_opened',
  'email_copied',
  'form_opened',
  'website_opened',
  'called',
  'initiated',
]);

export function isSentStatus(status: string | null | undefined): boolean {
  return !!status && SENT_STATUSES.has(status);
}

/** True when the queue took the message (queued or held for review). */
export function cwcAccepted(outcome: SendOutcome | void | undefined): boolean {
  return !!outcome && outcome.ok && (outcome.cwc?.status === 'queued' || outcome.cwc?.status === 'held');
}

/** What a send click learned from /api/track-send. */
export interface SendOutcome {
  ok: boolean;
  /** Server-provided error text (cooldown, validation), shown to the user. */
  error?: string;
  cwc?: { status: 'queued' | 'held' | 'blocked' | 'skipped' | 'error'; reason?: string };
}

/**
 * Card states after a "Send to Congress" click.
 *  - sent: the queue accepted it for delivery.
 *  - held: the queue holds it for a reviewer; still counts as an engagement.
 *  - failed: hand-off failed, the card falls back to the email actions.
 *  - blocked: the content gate refused it; no email fallback.
 *  - cooldown: this person already wrote this office recently; no actions.
 */
export type CwcButtonState = 'idle' | 'sending' | 'sent' | 'held' | 'failed' | 'blocked' | 'cooldown';

/** Copy for the CWC card after a send attempt. Flat sentences, no em dashes. */
export const WEBFORM_COPY = {
  idle: 'This office does not use the congressional delivery system yet, so My Democracy files your message in the office\'s own contact form for you. No email app needed. Your name and address go in the form\'s own fields.',
  sending: 'Handing your message to the delivery queue.',
  sent: 'Received. My Democracy will file it in the office\'s contact form within about an hour.',
  held: 'Received. A reviewer checks it before it goes to the office, usually within a day.',
} as const;

export const CWC_COPY = {
  idle: 'Goes straight to the office through Communicating with Congress, the message system run by the House and Senate. No email app needed. Your name and address travel in separate fields, so no signature is needed in the text.',
  sending: 'Handing your message to the congressional delivery system.',
  sent: 'Received by the congressional delivery system. Delivery usually completes within minutes and pauses overnight during House and Senate maintenance windows.',
  held: 'Received. A reviewer checks it before it goes to the office, usually within a day.',
  blocked: 'This message could not be sent through this site.',
  fallbackPrefix: 'We could not hand this message to the congressional delivery system.',
  checking: 'Checking delivery options',
  lockedNote: 'Sent. Edits here no longer change what the office receives.',
  unresolvedAddress: 'We could not verify this street address. Congressional offices reject messages they cannot match to a home address. Dorm, campus, and PO Box addresses need a residential street.',
  streetWarning: 'This street looks like a dorm, campus building, PO Box, or has no house number. Congressional offices reject messages they cannot match to a home address. Use a residential street if you have one.',
} as const;

/**
 * Plain copy for the raw strings /api/track-send can return. Anything not
 * recognised falls back to the generic hand-off failure.
 */
export function describeSendError(error: string | undefined): { state: CwcButtonState; note: string } {
  const e = error ?? '';
  if (/already contacted/i.test(e)) {
    return { state: 'cooldown', note: `${e.replace(/\s*Please wait.*$/i, '')} Offices group messages by week, so a second message now would not add to the count.` };
  }
  if (/captcha/i.test(e)) {
    return { state: 'failed', note: 'We could not confirm you are a person. Reload the page and try again, or use the email option below.' };
  }
  if (/subject/i.test(e)) {
    return { state: 'failed', note: 'The subject line needs at least six characters. Edit the message and try again, or use the email option below.' };
  }
  if (/too many requests/i.test(e)) {
    return { state: 'failed', note: 'Too many sends in a short time. Wait a minute and try again, or use the email option below.' };
  }
  return { state: 'failed', note: `${CWC_COPY.fallbackPrefix} Use the email option below.` };
}

/** Turn a send outcome into the card state + note the constituent sees. */
export function describeCwcOutcome(outcome: SendOutcome | void): { state: CwcButtonState; note: string } {
  if (!outcome) return { state: 'failed', note: `${CWC_COPY.fallbackPrefix} Use the email option below.` };
  if (!outcome.ok) return describeSendError(outcome.error);
  const status = outcome.cwc?.status;
  if (status === 'queued') return { state: 'sent', note: CWC_COPY.sent };
  if (status === 'held') return { state: 'held', note: CWC_COPY.held };
  if (status === 'blocked') return { state: 'blocked', note: CWC_COPY.blocked };
  const reason = outcome.cwc?.reason ?? '';
  if (/no last name/i.test(reason)) {
    return { state: 'failed', note: 'Congressional offices require a first and last name. Go back, add your last name, and try again. Or use the email option below.' };
  }
  return { state: 'failed', note: `${CWC_COPY.fallbackPrefix} Use the email option below.` };
}

/** Card state to restore from a status recorded earlier in this session. */
export function cwcStateFromStatus(status: string | null | undefined): CwcButtonState {
  if (status === CWC_SUBMITTED_STATUS || status === WEBFORM_SUBMITTED_STATUS) return 'sent';
  if (status === CWC_HELD_STATUS) return 'held';
  return 'idle';
}
