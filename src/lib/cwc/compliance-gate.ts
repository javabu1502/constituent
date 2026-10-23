import { createHash } from 'crypto';
import { runComplianceCheck, type ComplianceVerdict, type ComplianceInput } from '@/lib/compliance/check';
import { createAdminClient } from '@/lib/supabase';
import { normalizeBodyText } from './content';
import { notifyAdminHeld } from './notify';
import type { CwcDelivery } from './types';

/**
 * Content-compliance gate for the CWC send queue: screens the CONSTITUENT
 * MESSAGE (threats, fake identity, spam, gibberish, split abuse) before any
 * delivery rows become claimable. This is a different job from
 * `assertCwcSendable` (format/PII/stance rules): that gate asks "is this
 * payload valid CWC?", this one asks "should this content reach Congress
 * under our vendor name at all?".
 *
 * One screen per logical message, not per office. The screening identity is
 * the body with its salutation line removed (`screeningKeyFor`), so the
 * copies a constituent sends to each of their officials ("Dear Senator
 * Warner," / "Dear Senator Kaine,") share ONE verdict instead of three
 * independent model calls that can disagree (audit 2026-10-23). Verdicts are
 * persisted to `message_compliance`, one row per queue message key, so the
 * admin review loop (keyed on message_key) is unchanged.
 */

type DbClient = ReturnType<typeof createAdminClient>;

export interface GateOutcome {
  decision: 'pass' | 'review' | 'block';
  verdict: ComplianceVerdict;
}

type Screener = (input: ComplianceInput) => Promise<ComplianceVerdict>;
let screener: Screener = runComplianceCheck;

/** Test seam — pass nothing to restore the real LLM screener. */
export function setComplianceScreener(fn?: Screener): void {
  screener = fn ?? runComplianceCheck;
}

function messageBody(delivery: CwcDelivery): string {
  return delivery.message.constituentMessage ?? delivery.message.organizationStatement ?? '';
}

// A greeting line at the top of the letter: "Dear Senator Warner,",
// "Hello Representative Kiggans:", "To the Honorable ...". Bounded so a real
// sentence that happens to start with "Dear" is left alone.
const SALUTATION_LINE = /^[ \t]*(dear|hello|hi|greetings|to)\b[^\n]{0,120}$/i;

/**
 * The body without its opening salutation line, whitespace-normalized. Two
 * copies of one letter addressed to different officials collapse to the same
 * text here.
 */
export function bodyWithoutSalutation(body: string): string {
  const lines = normalizeBodyText(body).split('\n');
  const firstIdx = lines.findIndex((l) => l.trim().length > 0);
  if (firstIdx >= 0 && SALUTATION_LINE.test(lines[firstIdx])) {
    lines.splice(firstIdx, 1);
  }
  return lines.join('\n').replace(/\s+/g, ' ').trim();
}

/**
 * Screening identity for a delivery: sender email + campaign + the
 * salutation-free body. Sibling deliveries (same person, same letter,
 * different office) share it; different letters or senders do not.
 */
export function screeningKeyFor(delivery: CwcDelivery): string {
  const text = bodyWithoutSalutation(messageBody(delivery));
  const identity = `${delivery.constituent.email.trim().toLowerCase()}|${delivery.campaignId}|${createHash('sha256').update(text).digest('hex')}`;
  return `screen:${createHash('sha256').update(identity).digest('hex').slice(0, 40)}`;
}

export interface ScreenSibling {
  messageKey: string;
  officeCode: string;
  officialName?: string;
}

/**
 * Screen one logical message (represented by any of its deliveries) and
 * persist the verdict. Recent messages by the same sender feed split-abuse
 * detection. Never throws on screener failure — `runComplianceCheck` fails
 * SAFE to 'review', so a model outage holds messages for a human instead of
 * passing them.
 *
 * `siblings` lists every queue message key this verdict covers (the primary
 * `messageKey` included or not; it is always written). One audit row is
 * inserted per key. `ipHash` and the delivery's `messageId` populate the
 * audit row's linkage columns when available.
 */
export async function screenMessageForCwc(opts: {
  messageKey: string;
  delivery: CwcDelivery;
  db?: DbClient;
  ipHash?: string | null;
  siblings?: ScreenSibling[];
}): Promise<GateOutcome> {
  const db = opts.db ?? createAdminClient();
  const { constituent } = opts.delivery;
  const body = messageBody(opts.delivery);

  // Split-abuse context: the sender's recent messages, matched by the email
  // they submitted with.
  const { data: recent } = await db
    .from('messages')
    .select('legislator_name, issue_area, message_body, created_at')
    .eq('advocate_email', constituent.email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(5);

  const verdict = await screener({
    message: body,
    topic: opts.delivery.message.subject,
    legislatorName: opts.delivery.officialName,
    sender: {
      name: [constituent.firstName, constituent.lastName].filter(Boolean).join(' '),
      email: constituent.email,
      city: constituent.city,
      state: constituent.state,
      zip: constituent.zip,
      street: constituent.address1,
    },
    recentMessages: (recent ?? []).map((m) => ({
      legislatorName: (m.legislator_name as string | null) ?? undefined,
      issueArea: (m.issue_area as string | null) ?? undefined,
      body: (m.message_body as string | null) ?? undefined,
      createdAt: (m.created_at as string | null) ?? undefined,
    })),
  });

  // Durable audit trail — written for every decision, including passes, and
  // for every queue message key this verdict covers.
  const keys = new Map<string, ScreenSibling>();
  keys.set(opts.messageKey, { messageKey: opts.messageKey, officeCode: opts.delivery.officeCode, officialName: opts.delivery.officialName });
  for (const s of opts.siblings ?? []) if (!keys.has(s.messageKey)) keys.set(s.messageKey, s);
  const rows = [...keys.values()].map((k) => ({
    message_key: k.messageKey,
    message_id: opts.delivery.messageId ?? null,
    ip_hash: opts.ipHash ?? null,
    legislator_name: k.officialName ?? opts.delivery.officialName ?? null,
    decision: verdict.decision,
    reasons: verdict.reasons,
    categories: verdict.categories,
    message_excerpt: body.slice(0, 500),
    model: verdict.model,
    prompt_version: verdict.promptVersion,
    raw_verdict: verdict as unknown as Record<string, unknown>,
  }));
  const { error } = await db.from('message_compliance').insert(rows);
  let outcome: GateOutcome = { decision: verdict.decision, verdict };
  if (error) {
    // The audit trail is part of the compliance story: if we cannot record
    // the verdict we do not let the message through unattended.
    console.error('[cwc/compliance-gate] verdict insert failed:', error.message);
    if (verdict.decision === 'pass') {
      outcome = {
        decision: 'review',
        verdict: {
          ...verdict,
          decision: 'review',
          reasons: [...verdict.reasons, 'Verdict could not be recorded; held for human review.'],
        },
      };
    }
  }

  if (outcome.decision === 'review') {
    await notifyAdminHeld({
      channel: opts.delivery.officeCode === 'SXX00' ? 'webform' : 'cwc',
      messageId: opts.delivery.messageId,
      constituentEmail: constituent.email,
      officialName: opts.delivery.officialName,
      officeCode: opts.delivery.officeCode,
      messageKey: opts.messageKey,
      offices: [...keys.values()].map((k) => k.officeCode),
      reasons: outcome.verdict.reasons,
    });
  }

  return outcome;
}
