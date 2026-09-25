import { runComplianceCheck, type ComplianceVerdict, type ComplianceInput } from '@/lib/compliance/check';
import { createAdminClient } from '@/lib/supabase';
import type { CwcDelivery } from './types';

/**
 * Content-compliance gate for the CWC send queue: screens the CONSTITUENT
 * MESSAGE (threats, fake identity, spam, gibberish, split abuse) before any
 * delivery rows become claimable. This is a different job from
 * `assertCwcSendable` (format/PII/stance rules): that gate asks "is this
 * payload valid CWC?", this one asks "should this content reach Congress
 * under our vendor name at all?".
 *
 * One screen per logical message (messageKey), not per office. Verdicts are
 * persisted to `message_compliance` — the durable audit trail that lets us
 * show every message was screened, including the ones we refused.
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

/**
 * Screen one logical message (represented by any of its deliveries) and
 * persist the verdict. Recent messages by the same sender feed split-abuse
 * detection. Never throws on screener failure — `runComplianceCheck` fails
 * SAFE to 'review', so a model outage holds messages for a human instead of
 * passing them.
 */
export async function screenMessageForCwc(opts: {
  messageKey: string;
  delivery: CwcDelivery;
  db?: DbClient;
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

  // Durable audit trail — written for every decision, including passes.
  const { error } = await db.from('message_compliance').insert({
    message_key: opts.messageKey,
    decision: verdict.decision,
    reasons: verdict.reasons,
    categories: verdict.categories,
    message_excerpt: body.slice(0, 500),
    model: verdict.model,
    prompt_version: verdict.promptVersion,
    raw_verdict: verdict as unknown as Record<string, unknown>,
  });
  if (error) {
    // The audit trail is part of the compliance story: if we cannot record
    // the verdict we do not let the message through unattended.
    console.error('[cwc/compliance-gate] verdict insert failed:', error.message);
    if (verdict.decision === 'pass') {
      return {
        decision: 'review',
        verdict: {
          ...verdict,
          decision: 'review',
          reasons: [...verdict.reasons, 'Verdict could not be recorded; held for human review.'],
        },
      };
    }
  }

  return { decision: verdict.decision, verdict };
}
