import summary from '@/data/state-contact-form-summary.json';
import senateAudit from '@/data/senate-captcha-audit.json';
import verified from '@/data/senate-webform-verified.json';

/**
 * How hard it actually is to write to your legislature, measured.
 *
 * Every state legislator's published contact page was fetched and checked for
 * a form (scripts/audit-state-contact-forms.mjs), and every non-CWC Senate
 * office's contact page was checked for a CAPTCHA and then for whether it
 * holds a message form at all. The results sit in src/data and were only ever
 * read by the delivery code deciding where to send things.
 *
 * They answer a question nobody else has measured, which makes this the one
 * subject the site can write about from primary evidence rather than from
 * other people's explainers.
 *
 * Two rules for anything rendered from here. Never write that an office
 * "refuses" mail: not participating is usually a vendor or IT decision and we
 * did not ask why. And never cut any of it by party, which turns a measured
 * access story into a partisan one.
 */

interface StateRow {
  total: number;
  reachable: number;
  unreachable: number;
  withForm: number;
  captchaFree: number;
  captcha: number;
  jsHeavy: number;
}

const BY_STATE = summary.byState as Record<string, StateRow>;

export interface StateContactAccess {
  /** Legislators whose contact page we checked. */
  legislators: number;
  /** Of those, how many had a form a person could actually fill in. */
  withForm: number;
  /** Of those forms, how many could be used without solving a CAPTCHA. */
  captchaFree: number;
  /** Contact pages that did not load, or that blocked the check. */
  unreachable: number;
  /** True when not one legislator in the state publishes a usable form. */
  noneAtAll: boolean;
}

export function stateContactAccess(stateCode: string): StateContactAccess | null {
  const row = BY_STATE[stateCode.toUpperCase()];
  if (!row) return null;
  return {
    legislators: row.total,
    withForm: row.withForm,
    captchaFree: row.captchaFree,
    unreachable: row.unreachable,
    noneAtAll: row.withForm === 0,
  };
}

export interface NationalContactAccess {
  measuredOn: string;
  legislators: number;
  jurisdictions: number;
  withForm: number;
  withFormPercent: number;
  captchaFree: number;
  unreachable: number;
  /** State codes where not one legislator publishes a usable form. */
  statesWithNone: string[];
  senate: {
    onCwc: number;
    offCwc: number;
    /** Of the off-CWC offices, pages that really do hold a message form. */
    realForms: number;
  };
}

export function nationalContactAccess(): NationalContactAccess {
  const entries = Object.entries(BY_STATE);
  let withForm = 0;
  let captchaFree = 0;
  let unreachable = 0;
  const statesWithNone: string[] = [];
  for (const [code, row] of entries) {
    withForm += row.withForm;
    captchaFree += row.captchaFree;
    unreachable += row.unreachable;
    if (row.withForm === 0) statesWithNone.push(code);
  }
  const legislators = summary.total as number;

  // 53 offices are on CWC. The rest were checked by hand on 2026-10-25, and
  // only the verified list holds a page that is really a message form: the
  // others look like contact pages and are not, which is why the first
  // production webform send filled a site search box.
  const onCwc = 53;
  return {
    measuredOn: String(summary.generatedAt).slice(0, 10),
    legislators,
    jurisdictions: entries.length,
    withForm,
    withFormPercent: Math.round((withForm / legislators) * 1000) / 10,
    captchaFree,
    unreachable,
    statesWithNone: statesWithNone.sort(),
    senate: {
      onCwc,
      offCwc: 100 - onCwc,
      realForms: (verified.senators as unknown[]).length,
    },
  };
}

/** How many Senate contact pages the CAPTCHA audit actually looked at. */
export function senatePagesAudited(): number {
  return (senateAudit.findings as unknown[]).length;
}
