import { createHash } from 'crypto';
import type { CwcBill } from './types';

/**
 * Build a stable CampaignId that groups every message about the same specific
 * issue under one campaign — which is the whole point of the field to offices.
 *
 * George's rules:
 *  - Same specific subtopic/bill → same campaign. "Health / Medicare" and
 *    "Health / vaccine policy" are DIFFERENT campaigns.
 *  - When a bill is referenced, pro and con must be SEPARATE campaigns, so the
 *    stance is part of the key.
 *
 * The key MUST derive from the platform campaign's stable identity (row slug
 * or id) — never from free text. Audit 2026-08-26: a free-text topicKey let
 * the SAME weigh-in fragment into several CWC campaigns whenever the label
 * was phrased differently (extra whitespace, AI-regenerated wording), which
 * is exactly the office-side grouping breakage George complained about.
 * `campaignRef` therefore refuses anything that looks like prose.
 *
 * The result is SHA-256 hex (recommended by the spec to obfuscate the source
 * string) and is unique within our DeliveryAgent namespace.
 */
export function buildCampaignId(input: {
  /** STABLE campaign identity: the campaign row's slug or id (e.g.
   *  'demo-ab156' or a UUID). Free text throws. */
  campaignRef: string;
  bill?: Pick<CwcBill, 'congress' | 'type' | 'number'>;
  stance?: 'pro' | 'con';
}): string {
  const ref = input.campaignRef.trim().toLowerCase();
  if (!ref || /\s/.test(ref)) {
    throw new Error(
      `buildCampaignId: campaignRef must be a stable slug/id (no spaces), got ${JSON.stringify(input.campaignRef)} — free-text labels fragment one weigh-in into many CWC campaigns`,
    );
  }
  const parts = [
    'mydemocracy', // our delivery-agent namespace
    ref,
    input.bill ? `${input.bill.congress}:${input.bill.type}:${input.bill.number}` : 'no-bill',
    input.stance ?? 'no-stance',
  ];
  return createHash('sha256').update(parts.join('|')).digest('hex');
}
