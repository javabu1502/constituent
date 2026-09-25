import type { BillTypeKey, Chamber, LocTopic, Prefix } from './constants';

/**
 * Identifies us as the delivery agent. Constant per environment — sourced from
 * env vars, never hardcoded. `deliveryAgent` MUST exactly match the Company
 * Legal Name on the CWC access application (the Senate validates against it).
 */
export interface DeliveryAgentConfig {
  deliveryAgent: string;
  ackEmail: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string; // any format; normalized to XXX-XXX-XXXX on build
}

/**
 * Optional sponsoring organization (e.g. an advocacy group running a campaign
 * through us). Omit entirely for individual constituents acting on their own.
 */
export interface OrganizationInfo {
  name?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  about?: string; // max 500 chars
}

export interface CwcConstituent {
  prefix: Prefix;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string; // two-letter; validated against CWC_STATE_CODES
  zip: string; // 5-digit or ZIP+4; House delivery needs ZIP+4 for district
  email: string;
  // optional
  middleName?: string;
  suffix?: string;
  title?: string;
  constituentOrganization?: string;
  address2?: string;
  phone?: string;
  addressValidated?: boolean;
  emailValidated?: boolean;
}

export interface CwcBill {
  congress: number;
  type: BillTypeKey;
  number: number;
}

export interface CwcMessageContent {
  subject: string;
  topics: LocTopic[]; // at least one
  bills?: CwcBill[];
  /** Pro/con on the bill (or subject if no bill). Required by George when a
   *  bill number is present, and campaigns should be split pro vs con. */
  stance?: 'pro' | 'con';
  /** Verbatim template text the constituent did NOT edit. */
  organizationStatement?: string;
  /** The constituent's own / AI-personalized-then-reviewed message. */
  constituentMessage?: string;
  moreInfoUrl?: string;
  responseRequested?: boolean;
  newsletterOptIn?: boolean;
}

/**
 * Everything needed to render one CWC delivery. `officeCode` is the seat code
 * (Senate `SNY01`, House `HNY12`); `chamber` selects endpoint + validation.
 * `campaignId` groups messages about the same specific topic/bill (see
 * campaign-id.ts) — offices expect one campaign per specific issue.
 */
export interface CwcDelivery {
  chamber: Chamber;
  officeCode: string;
  campaignId: string;
  constituent: CwcConstituent;
  message: CwcMessageContent;
  organization?: OrganizationInfo;
  /** Override the auto-generated 32-char delivery id (e.g. for idempotency). */
  deliveryId?: string;
  /** Override the delivery date (YYYYMMDD). Defaults to today (UTC). */
  deliveryDate?: string;
}
