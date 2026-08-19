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
 * The result is SHA-256 hex (recommended by the spec to obfuscate the source
 * string) and is unique within our DeliveryAgent namespace.
 */
export function buildCampaignId(input: {
  /** The most specific issue label available (subtopic preferred over area). */
  topicKey: string;
  bill?: Pick<CwcBill, 'congress' | 'type' | 'number'>;
  stance?: 'pro' | 'con';
}): string {
  const parts = [
    'mydemocracy', // our delivery-agent namespace
    normalize(input.topicKey),
    input.bill ? `${input.bill.congress}:${input.bill.type}:${input.bill.number}` : 'no-bill',
    input.stance ?? 'no-stance',
  ];
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}
