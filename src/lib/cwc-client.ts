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
}

const EMPTY: CwcActiveOffices = { loaded: false, codes: new Set() };

export function useCwcActiveOffices(): CwcActiveOffices {
  const [offices, setOffices] = useState<CwcActiveOffices>(EMPTY);
  useEffect(() => {
    if (!CWC_ENABLED) return;
    let cancelled = false;
    fetch('/api/cwc/offices')
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data: { house?: string[]; senate?: string[] } | null) => {
        if (cancelled || !data) return;
        setOffices({ loaded: true, codes: new Set([...(data.house ?? []), ...(data.senate ?? [])]) });
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

/** The track-send delivery_status that means "delivered through CWC". */
export const CWC_SUBMITTED_STATUS = 'cwc_submitted';
