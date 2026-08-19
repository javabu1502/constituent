import { randomUUID } from 'crypto';
import {
  ALLOWED_PREFIXES,
  BILL_TYPE_ABBREVIATIONS,
  CWC_STATE_CODES,
  FIELD_LIMITS,
  LOC_TOPIC_SET,
} from './constants';
import { stripSignatureBlock } from './content';
import type { CwcDelivery } from './types';

/** Raised when a delivery can't produce schema-valid XML. Message lists every
 *  problem so callers can surface/fix them before hitting the CWC API. */
export class CwcValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`CWC payload invalid:\n- ${problems.join('\n- ')}`);
    this.name = 'CwcValidationError';
  }
}

const escapeXml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** A 32-char alphanumeric GUID (schema: [a-zA-Z0-9]{32}). */
export const newDeliveryId = (): string => randomUUID().replace(/-/g, '');

/** Today in YYYYMMDD (UTC), matching the schema's [0-9]{8}. */
export const today = (): string => new Date().toISOString().slice(0, 10).replace(/-/g, '');

/** Normalize a phone to XXX-XXX-XXXX, or null if it isn't 10 digits. */
export function formatPhone(raw: string): string | null {
  const d = raw.replace(/\D/g, '');
  const ten = d.length === 11 && d[0] === '1' ? d.slice(1) : d;
  if (ten.length !== 10) return null;
  return `${ten.slice(0, 3)}-${ten.slice(3, 6)}-${ten.slice(6)}`;
}

const officeCodePattern: Record<CwcDelivery['chamber'], RegExp> = {
  // Seat codes: Senate S + state + class 01-03; House H + state + district.
  senate: /^S[A-Z]{2}0[1-3]$/,
  house: /^H[A-Z]{2}\d{2}$/,
};

/**
 * Validate a delivery and render it to CWC XML. Every tag is emitted on its own
 * line (offices read the raw message in their CRM; George asked for this).
 *
 * Throws CwcValidationError with a full problem list rather than producing XML
 * the CWC API would reject — cheaper to catch here than round-trip.
 */
export function buildCwcXml(delivery: CwcDelivery): string {
  const problems: string[] = [];
  const { constituent: c, message: m, organization: org } = delivery;

  // --- Recipient ---
  if (!officeCodePattern[delivery.chamber].test(delivery.officeCode)) {
    problems.push(
      `officeCode "${delivery.officeCode}" is not a valid ${delivery.chamber} seat code`,
    );
  }

  // --- Constituent ---
  if (!ALLOWED_PREFIXES.includes(c.prefix)) {
    problems.push(`prefix "${c.prefix}" must be one of: ${ALLOWED_PREFIXES.join(', ')}`);
  }
  if (!c.firstName?.trim()) problems.push('constituent.firstName is required');
  if (!c.lastName?.trim()) problems.push('constituent.lastName is required');
  if ((c.address1?.trim().length ?? 0) < 3) problems.push('constituent.address1 must be ≥3 chars');
  if ((c.city?.trim().length ?? 0) < 3) problems.push('constituent.city must be ≥3 chars');
  if (!CWC_STATE_CODES.has(c.state)) problems.push(`constituent.state "${c.state}" is not a valid code`);
  if (!/^\d{5}(-\d{4})?$/.test(c.zip)) problems.push(`constituent.zip "${c.zip}" must be 5-digit or ZIP+4`);
  if (!isEmail(c.email)) problems.push(`constituent.email "${c.email}" is invalid`);

  let contactPhone: string | null = null;

  // --- Message ---
  const subjectLen = m.subject?.trim().length ?? 0;
  if (subjectLen < FIELD_LIMITS.subjectMin) {
    problems.push(`message.subject must be ≥${FIELD_LIMITS.subjectMin} chars`);
  } else if (subjectLen > FIELD_LIMITS.subjectMax) {
    problems.push(`message.subject must be ≤${FIELD_LIMITS.subjectMax} chars`);
  }
  if (!m.topics?.length) {
    problems.push('message.topics must include at least one Library of Congress topic');
  }
  for (const t of m.topics ?? []) {
    if (!LOC_TOPIC_SET.has(t)) problems.push(`message topic "${t}" is not a valid LOC policy area`);
  }
  // George's grouping rule: the constituent's name/address must never ride in
  // the body (it's already in the structured <Constituent> tags, and signature
  // blocks break the offices' ~80%-similarity campaign grouping). Strip the
  // closing block HERE, at the last common point before render, so every send
  // path gets it regardless of what upstream generation produced.
  const orgStatement = m.organizationStatement ? stripSignatureBlock(m.organizationStatement) : m.organizationStatement;
  const constituentMessage = m.constituentMessage ? stripSignatureBlock(m.constituentMessage) : m.constituentMessage;

  const hasOrgStatement = !!orgStatement?.trim();
  const hasConstituentMessage = !!constituentMessage?.trim();
  if (!hasOrgStatement && !hasConstituentMessage) {
    problems.push('message must include organizationStatement and/or constituentMessage');
  }
  for (const [label, text] of [
    ['organizationStatement', orgStatement],
    ['constituentMessage', constituentMessage],
  ] as const) {
    if (text && (text.length < FIELD_LIMITS.messageMin || text.length > FIELD_LIMITS.messageMax)) {
      problems.push(`message.${label} must be ${FIELD_LIMITS.messageMin}-${FIELD_LIMITS.messageMax} chars`);
    }
  }
  for (const bill of m.bills ?? []) {
    if (!(bill.type in BILL_TYPE_ABBREVIATIONS)) problems.push(`bill type "${bill.type}" is unknown`);
    if (!Number.isInteger(bill.congress) || bill.congress < 1) problems.push('bill.congress must be a positive integer');
    if (!Number.isInteger(bill.number) || bill.number < 1) problems.push('bill.number must be a positive integer');
  }
  if (m.moreInfoUrl && !isUrl(m.moreInfoUrl)) {
    problems.push(`message.moreInfoUrl "${m.moreInfoUrl}" does not parse as a URL`);
  }

  // --- Organization (schema minimum lengths when the tag is present) ---
  if (org?.name && org.name.trim().length < 3) problems.push('organization.name must be ≥3 chars when present');
  if (org?.contactName && org.contactName.trim().length < 2) problems.push('organization.contactName must be ≥2 chars when present');
  if (org?.about && org.about.trim().length < FIELD_LIMITS.organizationAboutMin) {
    problems.push(`organization.about must be ≥${FIELD_LIMITS.organizationAboutMin} chars when present`);
  }

  if (problems.length) throw new CwcValidationError(problems);

  // --- Render (order follows the documentation; each tag on its own line) ---
  const L: string[] = [];
  L.push('<?xml version="1.0" encoding="UTF-8" ?>');
  L.push('<CWC>');
  L.push(tag('CWCVersion', '2.0'));

  L.push('<Delivery>');
  L.push(tag('DeliveryId', delivery.deliveryId ?? newDeliveryId()));
  L.push(tag('DeliveryDate', delivery.deliveryDate ?? today()));
  L.push(tag('DeliveryAgent', requireEnv('CWC_DELIVERY_AGENT')));
  L.push(tag('DeliveryAgentAckEmailAddress', requireEnv('CWC_ACK_EMAIL')));
  L.push('<DeliveryAgentContact>');
  L.push(tag('DeliveryAgentContactName', requireContactName()));
  L.push(tag('DeliveryAgentContactEmail', requireEnv('CWC_CONTACT_EMAIL')));
  L.push(tag('DeliveryAgentContactPhone', requireAgentPhone()));
  L.push('</DeliveryAgentContact>');
  if (org?.name) L.push(tag('Organization', org.name));
  if (org?.contactName || org?.contactEmail || org?.contactPhone) {
    L.push('<OrganizationContact>');
    if (org.contactName) L.push(tag('OrganizationContactName', org.contactName));
    if (org.contactEmail) L.push(tag('OrganizationContactEmail', org.contactEmail));
    if (org.contactPhone) {
      const p = formatPhone(org.contactPhone);
      if (p) L.push(tag('OrganizationContactPhone', p));
    }
    L.push('</OrganizationContact>');
  }
  if (org?.about) L.push(tag('OrganizationAbout', org.about.slice(0, FIELD_LIMITS.organizationAboutMax)));
  L.push(tag('CampaignId', delivery.campaignId));
  L.push('</Delivery>');

  L.push('<Recipient>');
  L.push(tag('MemberOffice', delivery.officeCode));
  if (m.responseRequested !== undefined) L.push(tag('IsResponseRequested', m.responseRequested ? 'Y' : 'N'));
  if (m.newsletterOptIn !== undefined) L.push(tag('NewsletterOptIn', m.newsletterOptIn ? 'Y' : 'N'));
  L.push('</Recipient>');

  L.push('<Constituent>');
  L.push(tag('Prefix', c.prefix));
  L.push(tag('FirstName', c.firstName.trim()));
  if (c.middleName?.trim()) L.push(tag('MiddleName', c.middleName.trim()));
  L.push(tag('LastName', c.lastName.trim()));
  if (c.suffix?.trim()) L.push(tag('Suffix', c.suffix.trim()));
  if (c.title?.trim()) L.push(tag('Title', c.title.trim()));
  // Optional tags with a schema minimum of 2 chars are DROPPED (not errored)
  // when shorter — a 1-char Address2/"organization" is noise, not signal.
  if ((c.constituentOrganization?.trim().length ?? 0) >= 2) L.push(tag('ConstituentOrganization', c.constituentOrganization!.trim()));
  L.push(tag('Address1', c.address1.trim()));
  if ((c.address2?.trim().length ?? 0) >= 2) L.push(tag('Address2', c.address2!.trim()));
  L.push(tag('City', c.city.trim()));
  L.push(tag('StateAbbreviation', c.state));
  L.push(tag('Zip', c.zip));
  if (c.phone) {
    contactPhone = formatPhone(c.phone);
    if (contactPhone) L.push(tag('Phone', contactPhone));
  }
  if (c.addressValidated !== undefined) L.push(tag('AddressValidation', c.addressValidated ? 'Y' : 'N'));
  L.push(tag('Email', c.email.trim()));
  if (c.emailValidated !== undefined) L.push(tag('EmailValidation', c.emailValidated ? 'Y' : 'N'));
  L.push('</Constituent>');

  L.push('<Message>');
  L.push(tag('Subject', m.subject.trim()));
  L.push('<LibraryOfCongressTopics>');
  for (const t of m.topics) L.push(tag('LibraryOfCongressTopic', t));
  L.push('</LibraryOfCongressTopics>');
  if (m.bills?.length) {
    L.push('<Bills>');
    for (const bill of m.bills) {
      L.push('<Bill>');
      L.push(tag('BillCongress', String(bill.congress)));
      L.push(tag('BillTypeAbbreviation', BILL_TYPE_ABBREVIATIONS[bill.type]));
      L.push(tag('BillNumber', String(bill.number)));
      L.push('</Bill>');
    }
    L.push('</Bills>');
  }
  if (m.stance) L.push(tag('ProOrCon', m.stance === 'pro' ? 'Pro' : 'Con'));
  if (m.moreInfoUrl) L.push(tag('MoreInfo', m.moreInfoUrl));
  // Order matters here: the schema's choice allows either or both, but when
  // both are present OrganizationStatement must precede ConstituentMessage.
  if (hasOrgStatement) L.push(tag('OrganizationStatement', orgStatement!.trim()));
  if (hasConstituentMessage) L.push(tag('ConstituentMessage', constituentMessage!.trim()));
  L.push('</Message>');

  L.push('</CWC>');
  return L.join('\n');
}

function tag(name: string, value: string): string {
  return `<${name}>${escapeXml(value)}</${name}>`;
}

function isEmail(s: string | undefined): boolean {
  return !!s && /^[^@]+@[^.]+\..+$/.test(s.trim());
}

/** <MoreInfo> must be a real URL (offices click it). */
function isUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new CwcValidationError([`env ${name} is not set (delivery-agent identity)`]);
  return v;
}

function requireContactName(): string {
  const name = requireEnv('CWC_CONTACT_NAME');
  if (name.trim().length < FIELD_LIMITS.deliveryAgentContactNameMin) {
    throw new CwcValidationError([
      `env CWC_CONTACT_NAME must be ≥${FIELD_LIMITS.deliveryAgentContactNameMin} chars (schema minimum for DeliveryAgentContactName)`,
    ]);
  }
  return name;
}

function requireAgentPhone(): string {
  const p = formatPhone(process.env.CWC_CONTACT_PHONE ?? '');
  if (!p) throw new CwcValidationError(['env CWC_CONTACT_PHONE is missing or not a 10-digit number']);
  return p;
}
