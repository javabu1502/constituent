import { createHash } from 'crypto';
import { buildCampaignId } from './campaign-id';
import { locTopicsForIssueArea } from './topics';
import { houseOfficeCode, senateOfficeCode } from './offices';
import { CWC_STATE_CODES } from './constants';
import type { CwcBill, CwcDelivery } from './types';
import type { QueueItem } from './queue';
import type { BillTypeKey } from './constants';

/**
 * Assemble a CWC QueueItem from a tracked send. This is the bridge between
 * the participate/contact flows (via /api/track-send) and the durable send
 * queue. FAIL-CLOSED at every step: any missing or unmappable piece returns
 * a skip with a reason instead of an approximate delivery — an undelivered
 * CWC message still went out through the client's mailto/webform path, so a
 * skip loses nothing.
 */

export interface CwcSendPayload {
  prefix: 'Mr.' | 'Mrs.' | 'Miss' | 'Ms.' | 'Dr.';
  street: string;
  zip: string;
  email: string;
  subject: string;
  stance?: 'pro' | 'con';
  senate_class?: number;
}

export interface TrackSendLike {
  advocate_name: string;
  advocate_city: string;
  advocate_state: string;
  advocate_district?: string;
  legislator_level: string;
  legislator_chamber: string;
  issue_area: string;
  issue_subtopic: string;
  message_body: string;
  campaign_id?: string;
}

export interface CampaignBillContext {
  slug: string;
  bill_level: string | null;
  bill_congress: number | null;
  bill_type: string | null;
  bill_number: string | number | null;
  direction: string | null;
  headline: string | null;
}

export type BuildResult =
  | { ok: true; item: QueueItem }
  | { ok: false; skip: string };

const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO',
  connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR',
  pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA',
  'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
};

function toStateCode(raw: string): string | null {
  const t = raw.trim();
  const code = /^[A-Za-z]{2}$/.test(t) ? t.toUpperCase() : STATE_NAME_TO_CODE[t.toLowerCase()] ?? null;
  return code && CWC_STATE_CODES.has(code) ? code : null;
}

/** Campaign bill context → the queue's fail-closed billLevel + bill payload. */
function billContext(campaign: CampaignBillContext | null): {
  billLevel: 'federal' | 'none' | null;
  bill: CwcBill | null;
} {
  if (!campaign) return { billLevel: 'none', bill: null };
  if (!campaign.bill_level || campaign.bill_level === 'none') {
    // A NULL level with bill fields set is an unclassified bill campaign —
    // fail closed rather than send it as a no-bill message (no ProOrCon).
    if (!campaign.bill_level && (campaign.bill_type || campaign.bill_number)) return { billLevel: null, bill: null };
    return { billLevel: 'none', bill: null };
  }
  if (campaign.bill_level !== 'federal') return { billLevel: null, bill: null }; // state → not CWC-sendable
  if (campaign.bill_congress && campaign.bill_type && campaign.bill_number) {
    return {
      billLevel: 'federal',
      bill: {
        congress: Number(campaign.bill_congress),
        type: campaign.bill_type as BillTypeKey,
        number: Number(campaign.bill_number),
      },
    };
  }
  // Federal-level campaign without a concrete bill reference: no-bill message.
  return { billLevel: 'none', bill: null };
}

/**
 * Stable identity for a logical message: the SAME constituent sending the
 * SAME text under the SAME campaign is one delivery, however many times the
 * client reports it (every "open email" / "copy" click POSTs track-send and
 * creates a fresh messages row — keying on messages.id would enqueue a
 * duplicate CWC delivery per click; pre-go-live review 2026-09-28). The queue
 * and delivery log dedupe on (messageKey × office × environment).
 */
export function stableMessageKey(opts: { email: string; campaignRef: string; body: string }): string {
  const bodyHash = createHash('sha256').update(opts.body.trim()).digest('hex');
  const identity = `${opts.email.trim().toLowerCase()}|${opts.campaignRef}|${bodyHash}`;
  return `cwc:${createHash('sha256').update(identity).digest('hex').slice(0, 40)}`;
}

/**
 * Whether a tracked send may enter the CWC queue. ALL must hold:
 *  - the server rollout flag is on;
 *  - the client attached a cwc payload for a federal office;
 *  - the constituent explicitly pressed "Send to Congress" (delivery_status
 *    'cwc_submitted'). Email-app / copy / form clicks NEVER enqueue, so an
 *    office can't receive the same message by staffer email AND by CWC.
 */
export function shouldEnqueueCwc(
  body: Pick<TrackSendLike, 'legislator_level'> & { delivery_status?: string; cwc?: unknown },
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.CWC_DELIVERY_ENABLED === 'true' && !!body.cwc && body.legislator_level === 'federal' && body.delivery_status === 'cwc_submitted';
}

export function buildCwcQueueItem(opts: {
  body: TrackSendLike;
  cwc: CwcSendPayload;
  campaign: CampaignBillContext | null;
  /** messages.id — kept for log correlation; NOT the queue identity. */
  messageId: string;
}): BuildResult {
  const { body, cwc, campaign } = opts;

  if (body.legislator_level !== 'federal') return { ok: false, skip: 'not a federal office' };
  const chamber = body.legislator_chamber === 'senate' ? 'senate' : body.legislator_chamber === 'house' ? 'house' : null;
  if (!chamber) return { ok: false, skip: `unmapped chamber ${JSON.stringify(body.legislator_chamber)}` };

  const state = toStateCode(body.advocate_state);
  if (!state) return { ok: false, skip: `unmapped state ${JSON.stringify(body.advocate_state)}` };

  const office =
    chamber === 'senate'
      ? senateOfficeCode(state, cwc.senate_class)
      : houseOfficeCode(state, body.advocate_district ?? undefined);
  if (!office.ok) return { ok: false, skip: `office code: ${office.reason}` };

  const { billLevel, bill } = billContext(campaign);
  if (billLevel === null) return { ok: false, skip: 'state-bill campaign — never sendable to Congress' };

  // Stance: constituent's own when the flow captured one, else the campaign's
  // direction. A bill reference without a stance fails closed downstream, so
  // refuse here with a clearer reason.
  const stance = cwc.stance ?? (campaign?.direction === 'support' ? 'pro' : campaign?.direction === 'oppose' ? 'con' : undefined);
  if (bill && !stance) return { ok: false, skip: 'bill campaign without a stance' };

  const nameParts = body.advocate_name.trim().split(/\s+/);
  if (nameParts.length < 2) return { ok: false, skip: 'advocate name has no last name' };

  const campaignRef = campaign?.slug ?? `contact-${(body.issue_area + '-' + body.issue_subtopic).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

  const delivery: CwcDelivery = {
    chamber,
    officeCode: office.code,
    campaignId: buildCampaignId({ campaignRef, bill: bill ?? undefined, stance }),
    constituent: {
      prefix: cwc.prefix,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      address1: cwc.street,
      city: body.advocate_city,
      state,
      zip: cwc.zip,
      email: cwc.email,
    },
    message: {
      subject: cwc.subject,
      topics: locTopicsForIssueArea(body.issue_area, campaign?.headline ?? undefined),
      ...(bill ? { bills: [bill] } : {}),
      ...(stance ? { stance } : {}),
      constituentMessage: body.message_body,
    },
  };

  return {
    ok: true,
    item: {
      delivery,
      messageKey: stableMessageKey({ email: cwc.email, campaignRef, body: body.message_body }),
      billLevel,
    },
  };
}
