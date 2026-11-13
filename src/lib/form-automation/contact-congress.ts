import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

/**
 * Filling a congressional office's own contact form, by following a recipe.
 *
 * Every senator whose office is not on Communicating With Congress has a
 * step-by-step definition of their form in src/data/contact-forms, snapshotted
 * from unitedstates/contact-congress (CC0). This reads one and turns it into
 * instructions a browser can carry out.
 *
 * The definitions are a community effort and some were last touched in 2023.
 * A stale one does not throw. It fills the wrong field, or matches nothing at
 * all, and the page still answers 200. That is how the first production
 * webform send came to type a constituent's letter into a site search box. So
 * nothing here reports success on its own: a send counts only when the
 * definition's own `success` matcher agrees, and every other outcome is a
 * failure rather than a delivery.
 */

export type StepKind =
  | 'visit' | 'find' | 'fill_in' | 'check' | 'uncheck' | 'choose'
  | 'select' | 'click_on' | 'wait' | 'javascript' | 'recaptcha';

export interface FieldSpec {
  name?: string;
  selector?: string;
  value?: string;
  required?: boolean;
  /** `find` carries a wait here; a `select` carries its allowed values. */
  options?: Record<string, unknown> & { wait?: number };
  /** A dropdown's permitted choices, when the definition lists them. */
  allowedOptions?: string[];
}

export interface Step {
  kind: StepKind;
  /** `visit` and `wait` carry a bare value; everything else carries fields. */
  value?: string | number;
  fields: FieldSpec[];
}

export interface SuccessMatcher {
  status?: number;
  /** Text the response body must contain for the send to count. */
  contains?: string;
}

export interface ContactFormDefinition {
  bioguide: string;
  method: string;
  steps: Step[];
  success: SuccessMatcher;
  /** True when the office's form puts a challenge in front of submission. */
  needsCaptcha: boolean;
  /** True when steps run scripts, so this cannot be done with plain requests. */
  needsJavascript: boolean;
}

const DEFINITIONS_DIR = path.join(process.cwd(), 'src', 'data', 'contact-forms');

/** The values a definition can ask for, built from one constituent's message. */
export interface FormValues {
  namePrefix?: string;
  nameFirst: string;
  nameLast: string;
  email: string;
  phone?: string;
  addressStreet: string;
  addressStreet2?: string;
  addressCity: string;
  /** Two-letter code. */
  addressState: string;
  addressStateFull?: string;
  addressZip5: string;
  addressZipPlus4?: string;
  subject: string;
  message: string;
  topic?: string;
}

/**
 * Substitute the $VARIABLES a definition uses.
 *
 * An unknown variable resolves to an empty string rather than being left as
 * literal "$NAME_FIRST", because a congressional office receiving a letter
 * signed "$NAME_FIRST" is worse than one receiving a blank.
 */
export function substitute(value: string, v: FormValues): string {
  const table: Record<string, string> = {
    $NAME_PREFIX: v.namePrefix ?? '',
    $NAME_FIRST: v.nameFirst,
    $NAME_LAST: v.nameLast,
    $EMAIL: v.email,
    $PHONE: v.phone ?? '',
    $PHONE_PARENTHESES: formatPhoneParens(v.phone),
    $ADDRESS_STREET: v.addressStreet,
    $ADDRESS_STREET_2: v.addressStreet2 ?? '',
    $ADDRESS_CITY: v.addressCity,
    $ADDRESS_STATE: v.addressState,
    $ADDRESS_STATE_POSTAL_ABBREV: v.addressState,
    $ADDRESS_STATE_FULL: v.addressStateFull ?? v.addressState,
    $ADDRESS_ZIP5: v.addressZip5,
    $ADDRESS_ZIP_PLUS_4: v.addressZipPlus4 ?? v.addressZip5,
    $SUBJECT: v.subject,
    $MESSAGE: v.message,
    $TOPIC: v.topic ?? '',
  };
  // Longest first, so $ADDRESS_STREET_2 is not eaten by $ADDRESS_STREET.
  const names = Object.keys(table).sort((a, b) => b.length - a.length);
  let out = value;
  for (const name of names) out = out.split(name).join(table[name]);
  return out;
}

/** "(775) 555-0100", the shape some forms insist on. */
export function formatPhoneParens(phone?: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length !== 10) return phone ?? '';
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const KINDS: StepKind[] = ['visit', 'find', 'fill_in', 'check', 'uncheck', 'choose', 'select', 'click_on', 'wait', 'javascript', 'recaptcha'];

/** Parse one definition. Returns null when it is missing or unusable. */
export function parseDefinition(raw: string, bioguide: string): ContactFormDefinition | null {
  let doc: unknown;
  try {
    doc = yaml.parse(raw);
  } catch {
    return null;
  }
  const form = (doc as { contact_form?: Record<string, unknown> } | null)?.contact_form;
  if (!form || !Array.isArray(form.steps)) return null;

  const steps: Step[] = [];
  let needsCaptcha = false;
  let needsJavascript = false;

  for (const entry of form.steps as Array<Record<string, unknown>>) {
    const kind = Object.keys(entry).find((k) => (KINDS as string[]).includes(k)) as StepKind | undefined;
    if (!kind) continue;
    if (kind === 'recaptcha') needsCaptcha = true;
    if (kind === 'javascript') needsJavascript = true;

    const body = entry[kind];
    if (kind === 'visit' || kind === 'wait') {
      steps.push({ kind, value: body as string | number, fields: [] });
      continue;
    }
    const list = Array.isArray(body) ? body : [body];
    steps.push({
      kind,
      fields: list.map((f) => {
        if (typeof f === 'string' || typeof f === 'number') return { value: String(f) };
        const o = (f ?? {}) as Record<string, unknown>;
        // `options` is a wait on a `find` and a list of permitted choices on
        // a `select`. Keeping them apart matters: a dropdown only accepts what
        // it lists, and sending anything else fails the whole form.
        const opts = o.options;
        const allowedOptions = Array.isArray(opts)
          ? opts.map(String)
          : opts && typeof opts === 'object' && !('wait' in (opts as object))
            ? Object.values(opts as Record<string, unknown>).map(String)
            : undefined;
        return {
          name: typeof o.name === 'string' ? o.name : undefined,
          selector: typeof o.selector === 'string' ? o.selector : undefined,
          value: o.value === undefined ? undefined : String(o.value),
          required: o.required === true,
          options: Array.isArray(opts) ? undefined : ((opts as FieldSpec['options']) ?? undefined),
          allowedOptions,
        };
      }),
    });
  }

  const rawSuccess = (form.success ?? {}) as { headers?: { status?: unknown }; body?: { contains?: unknown } };
  const success: SuccessMatcher = {
    status: typeof rawSuccess.headers?.status === 'number' ? rawSuccess.headers.status : undefined,
    contains: typeof rawSuccess.body?.contains === 'string' ? rawSuccess.body.contains : undefined,
  };

  if (steps.length === 0) return null;
  return {
    bioguide,
    method: typeof form.method === 'string' ? form.method : 'post',
    steps,
    success,
    needsCaptcha,
    needsJavascript,
  };
}

/** Load the vendored definition for one member, or null. */
export function loadDefinition(bioguide: string): ContactFormDefinition | null {
  const file = path.join(DEFINITIONS_DIR, `${bioguide}.yaml`);
  try {
    return parseDefinition(fs.readFileSync(file, 'utf-8'), bioguide);
  } catch {
    return null;
  }
}

/** Bioguide ids we hold a definition for. */
export function definedMembers(): string[] {
  try {
    return fs
      .readdirSync(DEFINITIONS_DIR)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => f.replace(/\.yaml$/, ''))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Whether we can fill this office's form without a person present.
 *
 * A challenge step means the constituent has to solve it themselves, so the
 * unattended worker must not take the message: holding it is honest, pressing
 * submit and hoping is not.
 */
export function isAutomatable(def: ContactFormDefinition | null): boolean {
  return !!def && !def.needsCaptcha;
}

/** The first URL a definition visits, for an audit or a dry run. */
export function entryUrl(def: ContactFormDefinition): string | null {
  const visit = def.steps.find((s) => s.kind === 'visit');
  return typeof visit?.value === 'string' ? visit.value : null;
}

/**
 * The value to send to a dropdown that only accepts what it lists.
 *
 * Every office writes its own topic taxonomy, so the subject we would like to
 * file under is usually not on the list. Exact match first, then a
 * containment match either way round, then anything that reads as a general
 * catch-all, then the first option. Returning null is reserved for a list
 * that is empty, which is a definition problem rather than a choice problem.
 */
export function chooseOption(wanted: string, allowed: string[] | undefined): string | null {
  if (!allowed || allowed.length === 0) return null;
  const want = wanted.trim().toLowerCase();
  if (want) {
    const exact = allowed.find((o) => o.trim().toLowerCase() === want);
    if (exact) return exact;
    const partial = allowed.find((o) => {
      const low = o.trim().toLowerCase();
      return low.includes(want) || want.includes(low);
    });
    if (partial) return partial;
  }
  const catchAll = allowed.find((o) => /^(other|general|misc)/i.test(o.trim()));
  return catchAll ?? allowed[0];
}
