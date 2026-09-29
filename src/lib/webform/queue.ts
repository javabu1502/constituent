import * as fs from 'fs';
import * as path from 'path';
import { createAdminClient } from '@/lib/supabase';
import { findSenators } from '@/lib/legislators';
import { screenMessageForCwc, type GateOutcome } from '@/lib/cwc/compliance-gate';
import { stableMessageKey } from '@/lib/cwc/enqueue-from-send';
import { getActiveOfficeCodesCached } from '@/lib/cwc/send';
import { resolveOfficeCode } from '@/lib/cwc/offices';
import type { CwcDelivery } from '@/lib/cwc/types';

/**
 * Webform delivery: for Senate offices that do NOT participate in CWC but
 * publish a contact form with no CAPTCHA, My Democracy files the message in
 * the office's own form (Claude Vision + Playwright, src/lib/form-automation)
 * from a worker outside Vercel. This module is the DB/gate side only and
 * imports no browser code, so it is safe in Next.js route handlers.
 *
 * Gates, in order: WEBFORM_DELIVERY_ENABLED; senator; not on the live CWC
 * list; form audited CAPTCHA-free; content screen (same screener as CWC:
 * pass → queued, review → held, block → never enqueued).
 */
type DbClient = ReturnType<typeof createAdminClient>;
let clientFactory: () => DbClient = createAdminClient;
export function setWebformQueueClientFactory(factory?: () => DbClient): void { clientFactory = factory ?? createAdminClient; }
type Gate = (opts: { messageKey: string; delivery: CwcDelivery; db: DbClient }) => Promise<GateOutcome>;
let gate: Gate = screenMessageForCwc;
export function setWebformGate(fn?: Gate): void { gate = fn ?? screenMessageForCwc; }

interface AuditFinding { name: string; url: string; hasCaptcha: boolean; type: string | null; error?: string }
let auditCache: AuditFinding[] | null = null;
function auditFindings(): AuditFinding[] {
  if (auditCache) return auditCache;
  try {
    const file = path.join(process.cwd(), 'src', 'data', 'senate-captcha-audit.json');
    auditCache = (JSON.parse(fs.readFileSync(file, 'utf-8')) as { findings: AuditFinding[] }).findings;
  } catch { auditCache = []; }
  return auditCache;
}
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** Contact-form URL for a senator whose form the audit found CAPTCHA-free, else null. */
export function captchaFreeFormFor(official: { name: string; lastName?: string; contactForm?: string }): string | null {
  const last = norm(official.lastName || official.name.split(' ').pop() || '');
  const f = auditFindings().find((x) => norm(x.name) === norm(official.name)) ?? auditFindings().find((x) => norm(x.name).endsWith(last));
  if (!f || f.error || f.hasCaptcha) return null;
  return official.contactForm || f.url;
}

export function webformDeliveryEnabled(): boolean {
  return process.env.WEBFORM_DELIVERY_ENABLED === 'true';
}

/**
 * Bioguide ids of senators My Democracy can file for through their own form:
 * not on the CWC list, form CAPTCHA-free. Empty unless the flag is on.
 */
const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export async function webformAutomatableSenatorIds(activeCodes?: ReadonlySet<string>): Promise<string[]> {
  if (!webformDeliveryEnabled()) return [];
  const active = activeCodes ?? (await getActiveOfficeCodesCached('senate', { mode: 'production' }));
  const ids: string[] = [];
  for (const st of STATES) {
    for (const s of findSenators(st)) {
      const code = resolveOfficeCode(s);
      if (code.ok && active.has(code.code)) continue;
      if (captchaFreeFormFor(s)) ids.push(s.id);
    }
  }
  return ids;
}

export interface WebformQueueItem {
  messageKey: string;
  officialId: string;
  officialName: string;
  formUrl: string;
  constituent: { prefix: string; firstName: string; lastName: string; email: string; phone?: string; street: string; city: string; state: string; zip: string };
  message: { subject: string; body: string; topic: string };
}

export type WebformBuild = { ok: true; item: WebformQueueItem } | { ok: false; skip: string };

/** Build a queue item from a track-send body, or say why not (fail-closed). */
export async function buildWebformQueueItem(body: {
  legislator_id: string; legislator_name: string; legislator_level: string; legislator_chamber: string;
  advocate_name: string; advocate_city: string; advocate_state: string; message_body: string; issue_area: string;
}, cwc: { prefix: string; street: string; zip: string; email: string; subject: string }, campaignRef: string, activeCodes?: ReadonlySet<string>): Promise<WebformBuild> {
  if (!webformDeliveryEnabled()) return { ok: false, skip: 'WEBFORM_DELIVERY_ENABLED is not true' };
  if (body.legislator_level !== 'federal' || body.legislator_chamber !== 'senate') return { ok: false, skip: 'webform delivery is Senate-only' };
  const state = body.advocate_state.trim().toUpperCase().slice(0, 2);
  const senator = findSenators(state).find((s) => s.id === body.legislator_id);
  if (!senator) return { ok: false, skip: `senator ${body.legislator_id} not found for ${state}` };
  const code = resolveOfficeCode(senator);
  const active = activeCodes ?? (await getActiveOfficeCodesCached('senate', { mode: 'production' }));
  if (code.ok && active.has(code.code)) return { ok: false, skip: 'office participates in CWC; use the CWC path' };
  const formUrl = captchaFreeFormFor(senator);
  if (!formUrl) return { ok: false, skip: 'no CAPTCHA-free contact form on record' };
  const parts = body.advocate_name.trim().split(/\s+/);
  if (parts.length < 2) return { ok: false, skip: 'advocate name has no last name' };
  return {
    ok: true,
    item: {
      messageKey: stableMessageKey({ email: cwc.email, campaignRef, body: body.message_body }),
      officialId: senator.id,
      officialName: senator.name,
      formUrl,
      constituent: { prefix: cwc.prefix, firstName: parts[0], lastName: parts.slice(1).join(' '), email: cwc.email.trim(), street: cwc.street, city: body.advocate_city, state, zip: cwc.zip },
      message: { subject: cwc.subject, body: body.message_body, topic: body.issue_area },
    },
  };
}

export interface WebformEnqueueResult { status: 'queued' | 'held' | 'blocked' }

/** Screen the message (same gate as CWC) and enqueue. */
export async function enqueueWebformDelivery(item: WebformQueueItem): Promise<WebformEnqueueResult> {
  const db = clientFactory();
  const delivery: CwcDelivery = {
    chamber: 'senate',
    officeCode: 'SXX00',
    campaignId: 'webform',
    constituent: { prefix: item.constituent.prefix as CwcDelivery['constituent']['prefix'], firstName: item.constituent.firstName, lastName: item.constituent.lastName, address1: item.constituent.street, city: item.constituent.city, state: item.constituent.state, zip: item.constituent.zip, email: item.constituent.email },
    message: { subject: item.message.subject, topics: ['Government Operations and Politics'], constituentMessage: item.message.body },
  };
  const { decision } = await gate({ messageKey: item.messageKey, delivery, db });
  if (decision === 'block') return { status: 'blocked' };
  const status = decision === 'pass' ? 'queued' : 'held';
  const { error } = await db.from('webform_send_queue').upsert(
    { message_key: item.messageKey, official_id: item.officialId, official_name: item.officialName, form_url: item.formUrl, constituent: item.constituent, message: item.message, status },
    { onConflict: 'message_key,official_id', ignoreDuplicates: true },
  );
  if (error) throw new Error(`webform_send_queue enqueue failed: ${error.message}`);
  return { status };
}
