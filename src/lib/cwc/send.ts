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
import { acquireSendPermit, ratePermitScope, type AcquirePermitOptions } from './rate-permit';
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
 *   5. Rate permit        — claim a send slot from the Postgres allocator,
 *                           the ONLY limiter that holds across serverless
 *                           instances (sendBatch's spacing is per-process).
 *   6. Build + send       — XML with the logged id; outcome recorded.
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
  /** Campaign-level bill scope for the state-bill gate. */
  billLevel?: 'federal' | 'state' | null;
  /** Skip the active-offices check — ONLY for the Senate TEST env, where all
   *  100 offices accept and the list does not indicate participation. */
  skipActiveOfficeCheck?: boolean;
  activeOffices?: ActiveOfficeOptions;
  /** Test seam — defaults to sendSenate/sendHouse. */
  sender?: (delivery: CwcDelivery, mode: Mode) => Promise<CwcResult>;
  now?: Date;
  /** Cross-instance rate permit; injectable for tests. `false` disables
   *  (ONLY for offline preview/validate paths that never POST a message). */
  ratePermit?: AcquirePermitOptions | false;
}

export type SendCwcOutcome =
  | { sent: true; deliveryId: string; retried: boolean; result: CwcResult }
  | { sent: false; fallback: 'router'; reason: string }
  | { sent: false; fallback: 'retry-later'; reason: string };

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
  // 1. Compliance gate (throws with the full problem list).
  assertCwcSendable({ message: delivery.message, billLevel: opts.billLevel });

  const mode: Mode = opts.environment === 'production' ? 'production' : 'uat';

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

  // 5. Claim a send slot from the shared allocator — this, not sendBatch's
  //    per-process spacing, is what holds the aggregate rate under the CWC
  //    ceiling when multiple serverless instances send concurrently.
  if (opts.ratePermit !== false) {
    await acquireSendPermit(ratePermitScope(delivery.chamber, opts.environment), opts.ratePermit);
  }

  // 6. Build with the logged id, send, record the outcome (incl. 400/500s).
  const toSend: CwcDelivery = { ...delivery, deliveryId };
  const xml = buildCwcXml(toSend);
  const sender = opts.sender ?? (delivery.chamber === 'senate' ? sendSenate : sendHouse);
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
    await recordDeliveryResult(deliveryId, {
      status: 'error',
      errors: [(e as Error).message],
      xmlSha256: xmlSha256(xml),
    });
    throw e;
  }
}
