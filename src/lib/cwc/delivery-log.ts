import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase';
import { newDeliveryId } from './xml';
import type { Chamber } from './constants';

/**
 * Persistence for CWC sends (table: cwc_deliveries, service-role only).
 *
 * Why this exists — two compliance requirements:
 *  1. IDEMPOTENT RETRY. The DeliveryId for a (message × office × environment)
 *     is minted ONCE and reused on every retry. Duplicates are forbidden
 *     (House LoS A.12); the Senate rejects a reused DeliveryId with 409 —
 *     which is the correct outcome for a retry that already landed, vs. a
 *     fresh id silently double-delivering.
 *  2. MONITORING. SOAPBox requires agents to monitor 400/500-class responses;
 *     every outcome (http status + parsed errors) is recorded here.
 */

export type CwcEnvironment = 'test' | 'production';
export type CwcDeliveryStatus = 'pending' | 'delivered' | 'rejected' | 'error';

export interface DeliveryLogRow {
  deliveryId: string;
  /** True when the row already existed — i.e. this is a RETRY of a prior send. */
  existing: boolean;
}

// Minimal shape of the Supabase client we use — injectable for tests so the
// module never needs live credentials under vitest.
type DbClient = ReturnType<typeof createAdminClient>;
let clientFactory: () => DbClient = createAdminClient;

/** Test seam: swap the Supabase client factory (pass nothing to restore). */
export function setDeliveryLogClientFactory(factory?: () => DbClient): void {
  clientFactory = factory ?? createAdminClient;
}

/**
 * Return the DeliveryId for this (messageKey, officeCode, environment) —
 * REUSING the existing row's id when one exists (retries must never
 * regenerate), creating the row with a fresh 32-char id otherwise.
 * `messageKey` is the caller's stable key for the logical message (e.g.
 * `userId:campaignId`); campaignId/chamber are needed on first insert.
 */
export async function getOrCreateDeliveryId(
  messageKey: string,
  officeCode: string,
  environment: CwcEnvironment,
  meta: { campaignId: string; chamber: Chamber },
): Promise<DeliveryLogRow> {
  const db = clientFactory();

  const { data: found, error: selErr } = await db
    .from('cwc_deliveries')
    .select('delivery_id')
    .eq('message_key', messageKey)
    .eq('office_code', officeCode)
    .eq('environment', environment)
    .maybeSingle();
  if (selErr) throw new Error(`cwc_deliveries lookup failed: ${selErr.message}`);
  if (found?.delivery_id) return { deliveryId: found.delivery_id, existing: true };

  const deliveryId = newDeliveryId();
  const { error: insErr } = await db.from('cwc_deliveries').insert({
    delivery_id: deliveryId,
    message_key: messageKey,
    office_code: officeCode,
    campaign_id: meta.campaignId,
    chamber: meta.chamber,
    environment,
    status: 'pending',
  });
  if (insErr) {
    // Unique-violation race (23505): someone inserted between our select and
    // insert — re-select and reuse THEIR id rather than erroring or duplicating.
    if (insErr.code === '23505') {
      const { data: raced } = await db
        .from('cwc_deliveries')
        .select('delivery_id')
        .eq('message_key', messageKey)
        .eq('office_code', officeCode)
        .eq('environment', environment)
        .maybeSingle();
      if (raced?.delivery_id) return { deliveryId: raced.delivery_id, existing: true };
    }
    throw new Error(`cwc_deliveries insert failed: ${insErr.message}`);
  }
  return { deliveryId, existing: false };
}

/** Map an HTTP response code to our delivery status. 409 = duplicate
 *  DeliveryId, meaning a prior attempt already landed → delivered. */
export function statusFromHttp(httpStatus: number): CwcDeliveryStatus {
  if (httpStatus === 409) return 'delivered';
  if (httpStatus >= 200 && httpStatus < 300) return 'delivered';
  if (httpStatus >= 400 && httpStatus < 500) return 'rejected';
  return 'error';
}

/** Record the outcome of a send attempt against its logged row. 400/500-class
 *  statuses land here too — that IS the monitoring SOAPBox requires. */
export async function recordDeliveryResult(
  deliveryId: string,
  outcome: {
    status: CwcDeliveryStatus;
    httpStatus?: number;
    errors?: string[] | null;
    xmlSha256?: string;
  },
): Promise<void> {
  const db = clientFactory();
  const update: Record<string, unknown> = {
    status: outcome.status,
    http_status: outcome.httpStatus ?? null,
    errors: outcome.errors?.length ? outcome.errors : null,
    updated_at: new Date().toISOString(),
  };
  if (outcome.xmlSha256) update.xml_sha256 = outcome.xmlSha256;
  const { error } = await db.from('cwc_deliveries').update(update).eq('delivery_id', deliveryId);
  if (error) throw new Error(`cwc_deliveries update failed: ${error.message}`);
}

/** SHA-256 of the exact XML payload, for the log's xml_sha256 column. */
export function xmlSha256(xml: string): string {
  return createHash('sha256').update(xml).digest('hex');
}
