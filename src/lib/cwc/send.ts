import { isInScwcMaintenanceWindow, type Chamber } from './constants';
import { loadActiveOfficeCodes, sendHouse, sendSenate, type CwcResult } from './client';
import { assertCwcSendable } from './content';
import { buildCwcXml } from './xml';
import {
  getOrCreateDeliveryId,
  recordDeliveryResult,
  statusFromHttp,
  xmlSha256,
  type CwcEnvironment,
} from './delivery-log';
import { RatePermitBackpressureError, type AcquirePermitOptions } from './rate-permit';
import { verifyConstituentForOffice } from './verify';
import type { CwcDelivery } from './types';

/**
 * Send orchestration: the ONE path a real CWC send goes through, so every
 * compliance gate fires in order and nothing can skip one:
 *
 *   1. assertCwcSendable  — state-bill block, bill⇒stance, signature check.
 *   2. Maintenance window — refuse Senate sends during SCWC windows.
 *   3. Active offices     — refuse offices not on Get Active Offices (caller
 *                           falls back to the delivery-router webform/email
 *                           path); cached 12h with force-refresh.
 *   4. Delivery log       — mint-or-REUSE the DeliveryId (idempotent retry).
 *   5. Build + send       — XML with the logged id; outcome recorded. The
 *                           cross-instance rate permit is claimed INSIDE the
 *                           client POST (postHouse/postSenate) so no path —
 *                           this one or the raw exports — can skip it; a
 *                           deep-queue refusal surfaces here as retry-later.
 */

const ACTIVE_OFFICES_TTL_MS = 12 * 60 * 60 * 1000; // ~12h; George emails when offices join

interface OfficeCache {
  codes: ReadonlySet<string>;
  fetchedAt: number;
}
const officeCache = new Map<string, OfficeCache>(); // key: `${chamber}:${mode}`

type Mode = 'uat' | 'production';

export interface ActiveOfficeOptions {
  mode?: Mode;
  forceRefresh?: boolean;
  /** Test seam / override — defaults to the live loadActiveOfficeCodes. */
  loader?: (chamber: Chamber, mode: Mode) => Promise<Set<string>>;
  now?: () => number;
}

/**
 * Active-office codes for a chamber, cached module-level for ~12h. The doc
 * requires refreshing regularly and before large campaigns — pass
 * `forceRefresh: true` at campaign start.
 */
export async function getActiveOfficeCodesCached(
  chamber: Chamber,
  opts: ActiveOfficeOptions = {},
): Promise<ReadonlySet<string>> {
  const mode = opts.mode ?? 'uat';
  const now = opts.now?.() ?? Date.now();
  const key = `${chamber}:${mode}`;
  const cached = officeCache.get(key);
  if (!opts.forceRefresh && cached && now - cached.fetchedAt < ACTIVE_OFFICES_TTL_MS) {
    return cached.codes;
  }
  const loader = opts.loader ?? loadActiveOfficeCodes;
  const codes = await loader(chamber, mode);
  officeCache.set(key, { codes, fetchedAt: now });
  return codes;
}

/** Drop the cache (tests, or after George emails that an office joined). */
export function clearActiveOfficeCache(): void {
  officeCache.clear();
}

export interface SendCwcOptions {
  /** Stable key for the logical message (e.g. `userId:campaignId`). */
  messageKey: string;
  environment: CwcEnvironment;
  /** Campaign-level bill scope for the state-bill gate. FAIL-CLOSED: only an
   *  explicit 'federal' (federal bill) or 'none' (no bill) is sendable —
   *  'state', null, or omitted all refuse (the gate throws). */
  billLevel?: 'federal' | 'state' | 'none' | null;
  /** Skip the active-offices check — ONLY for the Senate TEST env, where all
   *  100 offices accept and the list does not indicate participation. */
  skipActiveOfficeCheck?: boolean;
  activeOffices?: ActiveOfficeOptions;
  /** Test seam — defaults to sendSenate/sendHouse. */
  sender?: (delivery: CwcDelivery, mode: Mode) => Promise<CwcResult>;
  now?: Date;
  /** Cross-instance rate permit options, forwarded to the client POST where
   *  the permit is claimed. `false` skips the claim — ONLY for paths that
   *  verifiably never hit a CWC endpoint. */
  ratePermit?: AcquirePermitOptions | false;
  /** Constituent-verification seam. PRODUCTION always verifies (no opt-out):
   *  the constituent's address must geocode to this delivery's seat, or we
   *  refuse (George's cardinal rule). In the test env verification defaults
   *  OFF (fixture constituents aren't real); pass `true` to exercise it.
   *  `verifier` is the test seam. */
  verifyConstituent?: boolean;
  verifier?: (delivery: CwcDelivery) => Promise<import('./verify').VerifyResult>;
}

export type SendCwcOutcome =
  | { sent: true; deliveryId: string; retried: boolean; result: CwcResult }
  | { sent: false; fallback: 'router'; reason: string }
  | { sent: false; fallback: 'retry-later'; reason: string }
  | { sent: false; fallback: 'not-constituent'; reason: string };

/**
 * Deliver one message via CWC with every gate applied. Returns `sent: false`
 * with a fallback hint instead of throwing for the two recoverable refusals
 * (office not participating → route webform/email; maintenance window →
 * retry later). Compliance-gate violations THROW (CwcComplianceError /
 * CwcValidationError) — those are caller bugs, not routing conditions.
 */
export async function sendCwcDelivery(
  delivery: CwcDelivery,
  opts: SendCwcOptions,
): Promise<SendCwcOutcome> {
  // 1. Compliance gate (throws with the full problem list). Passing the
  //    constituent enables the value-aware PII checks (name/address in body).
  assertCwcSendable({ message: delivery.message, billLevel: opts.billLevel, constituent: delivery.constituent });

  const mode: Mode = opts.environment === 'production' ? 'production' : 'uat';

  // 1b. Constituent verification — the address must geocode to THIS seat.
  //     Mandatory in production (no opt-out); test env opts in via flag.
  const shouldVerify = opts.environment === 'production' || opts.verifyConstituent === true;
  if (shouldVerify) {
    const verifier = opts.verifier ?? verifyConstituentForOffice;
    const verdict = await verifier(delivery);
    if (!verdict.ok) {
      return {
        sent: false,
        fallback: 'not-constituent',
        reason: `constituent verification failed (${verdict.reason}): ${verdict.detail}`,
      };
    }
  }

  // 2. SCWC maintenance windows (Senate infrastructure).
  if (delivery.chamber === 'senate' && isInScwcMaintenanceWindow(opts.now ?? new Date())) {
    return {
      sent: false,
      fallback: 'retry-later',
      reason: 'SCWC maintenance window (Sun 12a–6a / Wed 5a–7a US Eastern)',
    };
  }

  // 3. Only send to offices on the active list; others go to the router's
  //    webform/email path (the ~46 non-participating Senate offices).
  if (!opts.skipActiveOfficeCheck) {
    const active = await getActiveOfficeCodesCached(delivery.chamber, {
      mode,
      ...opts.activeOffices,
    });
    if (!active.has(delivery.officeCode)) {
      return {
        sent: false,
        fallback: 'router',
        reason: `office ${delivery.officeCode} is not on the active-offices list — use webform/email fallback`,
      };
    }
  }

  // 4. Idempotent DeliveryId: reuse the logged id on retry, never regenerate.
  const { deliveryId, existing } = await getOrCreateDeliveryId(
    opts.messageKey,
    delivery.officeCode,
    opts.environment,
    { campaignId: delivery.campaignId, chamber: delivery.chamber },
  );

  // 5. Build with the logged id, send, record the outcome (incl. 400/500s).
  //    The default sender claims the cross-instance rate permit inside the
  //    client POST; a custom `sender` (test seam) bypasses it by design.
  const toSend: CwcDelivery = { ...delivery, deliveryId };
  const xml = buildCwcXml(toSend);
  const sender =
    opts.sender ??
    ((d: CwcDelivery, m: Mode) =>
      d.chamber === 'senate' ? sendSenate(d, m, opts.ratePermit) : sendHouse(d, m, opts.ratePermit));
  try {
    const result = await sender(toSend, mode);
    await recordDeliveryResult(deliveryId, {
      status: statusFromHttp(result.status),
      httpStatus: result.status,
      errors: result.errors ?? null,
      xmlSha256: xmlSha256(xml),
    });
    return { sent: true, deliveryId, retried: existing, result };
  } catch (e) {
    if (e instanceof RatePermitBackpressureError) {
      // The queue is deep, not broken: nothing was sent, the DeliveryId is
      // logged and will be REUSED on retry. Don't record an error outcome.
      return { sent: false, fallback: 'retry-later', reason: e.message };
    }
    await recordDeliveryResult(deliveryId, {
      status: 'error',
      errors: [(e as Error).message],
      xmlSha256: xmlSha256(xml),
    });
    throw e;
  }
}
