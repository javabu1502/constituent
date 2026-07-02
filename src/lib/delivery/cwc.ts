/**
 * Communicating With Congress (CWC) delivery client.
 *
 * This is the ONLY place that knows the CWC wire format. The test vs prod
 * split is purely env-driven: `CWC_API_BASE_URL` + `CWC_API_KEY` differ between
 * the staging (test) and production environments — there is no code branch on
 * environment. Point staging at the CWC test endpoint with the test key and it
 * delivers to CWC's test harness instead of real offices.
 *
 * NOTE: The exact request envelope below (field names, XML shape, how the
 * office/recipient is addressed) is modeled on the published CWC v2 message
 * spec but MUST be confirmed against the real API docs that ship with the key.
 * Everything format-specific is contained in `buildCWCRequest()` so it is a
 * single, swappable seam.
 */

import { env } from '@/lib/env';

export interface CWCSender {
  name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
}

export interface CWCSubmission {
  /** Office/recipient code — bioguide id for House/Senate members. */
  office: string;
  sender: CWCSender;
  /** Short topic/subject line for the message. */
  topic: string;
  messageBody: string;
  /** Optional originating campaign, passed through for CWC-side analytics. */
  campaignId?: string;
}

export interface CWCResult {
  ok: boolean;
  /** CWC's delivery/tracking id, when the submission is accepted. */
  cwcMessageId?: string;
  /** Normalized status: 'sent' on accept, 'error' otherwise. */
  status: 'sent' | 'error';
  errorCode?: string;
  errorMessage?: string;
  /** Raw provider response text, retained for the audit trail. */
  rawResponse?: string;
  /** The exact request body sent to CWC. Populated for diagnostics. */
  requestXml?: string;
}

/** True when CWC delivery is configured for this environment. */
export function isCWCConfigured(): boolean {
  const e = env();
  return Boolean(e.CWC_API_KEY && e.CWC_API_BASE_URL && e.CWC_DELIVERY_AGENT_ID);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** First token of a full name, best-effort, for CWC's split name fields. */
function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/**
 * Build the CWC request envelope. Isolated so the wire format can be corrected
 * against the real spec without touching the route or the delivery flow.
 *
 * TODO: confirm against the CWC spec delivered with the API key —
 * element names, whether House/Senate need distinct envelopes, the exact
 * `<DeliveryId>` uniqueness/format rules, and topic/issue code requirements.
 */
export function buildCWCRequest(
  submission: CWCSubmission,
  deliveryId: string,
): string {
  const e = env();
  const { sender } = submission;
  const { first, last } = splitName(sender.name);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<CWC>',
    '  <CWCVersion>2.0</CWCVersion>',
    `  <DeliveryId>${escapeXml(deliveryId)}</DeliveryId>`,
    '  <DeliveryAgent>',
    `    <DeliveryAgentId>${escapeXml(e.CWC_DELIVERY_AGENT_ID ?? '')}</DeliveryAgentId>`,
    `    <DeliveryAgentName>${escapeXml(e.CWC_DELIVERY_AGENT_NAME ?? '')}</DeliveryAgentName>`,
    `    <DeliveryAgentContact>${escapeXml(e.CWC_DELIVERY_AGENT_EMAIL ?? '')}</DeliveryAgentContact>`,
    '  </DeliveryAgent>',
    '  <Recipient>',
    `    <MemberOffice>${escapeXml(submission.office)}</MemberOffice>`,
    '  </Recipient>',
    '  <Constituent>',
    `    <FirstName>${escapeXml(first)}</FirstName>`,
    `    <LastName>${escapeXml(last)}</LastName>`,
    `    <Address1>${escapeXml(sender.street)}</Address1>`,
    `    <City>${escapeXml(sender.city)}</City>`,
    `    <StateAbbreviation>${escapeXml(sender.state)}</StateAbbreviation>`,
    `    <Zip>${escapeXml(sender.zip)}</Zip>`,
    `    <Email>${escapeXml(sender.email)}</Email>`,
    ...(sender.phone ? [`    <Phone>${escapeXml(sender.phone)}</Phone>`] : []),
    '  </Constituent>',
    '  <Message>',
    `    <Subject>${escapeXml(submission.topic)}</Subject>`,
    `    <MessageText>${escapeXml(submission.messageBody)}</MessageText>`,
    ...(submission.campaignId
      ? [`    <CampaignId>${escapeXml(submission.campaignId)}</CampaignId>`]
      : []),
    '  </Message>',
    '</CWC>',
  ].join('\n');
}

/**
 * Deliver a single constituent message to a congressional office via CWC.
 *
 * Never throws — network/HTTP failures are normalized into a `status: 'error'`
 * result so the caller can record the outcome and surface a retry/queue path.
 */
export async function submitToCWC(
  submission: CWCSubmission,
): Promise<CWCResult> {
  const e = env();

  if (!e.CWC_API_KEY || !e.CWC_API_BASE_URL || !e.CWC_DELIVERY_AGENT_ID) {
    return {
      ok: false,
      status: 'error',
      errorCode: 'not_configured',
      errorMessage: 'CWC delivery is not configured for this environment.',
    };
  }

  // Delivery id: caller-stable per submission would be ideal, but a per-call
  // unique id is acceptable for a first delivery. We derive it from the office
  // + sender email so retries of the same message reuse the id.
  const deliveryId = `md-${submission.office}-${Buffer.from(submission.sender.email)
    .toString('hex')
    .slice(0, 16)}`;

  const xml = buildCWCRequest(submission, deliveryId);
  const url = `${e.CWC_API_BASE_URL.replace(/\/$/, '')}/v2/message?apikey=${encodeURIComponent(e.CWC_API_KEY)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml,
    });

    const rawResponse = await res.text();

    if (!res.ok) {
      console.error('[cwc] Delivery rejected:', res.status, rawResponse.slice(0, 500));
      return {
        ok: false,
        status: 'error',
        errorCode: `http_${res.status}`,
        errorMessage: `CWC returned HTTP ${res.status}`,
        rawResponse,
        requestXml: xml,
      };
    }

    return {
      ok: true,
      status: 'sent',
      cwcMessageId: deliveryId,
      rawResponse,
      requestXml: xml,
    };
  } catch (err) {
    console.error('[cwc] Delivery request failed:', err);
    return {
      ok: false,
      status: 'error',
      errorCode: 'network_error',
      errorMessage: 'CWC delivery request failed.',
      requestXml: xml,
    };
  }
}
