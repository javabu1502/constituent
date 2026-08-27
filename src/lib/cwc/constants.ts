// Communicating With Congress (CWC) constants.
//
// Values here are transcribed from the authoritative RelaxNG schema
// (Senate `incoming_xml_message_2_0.rng`) and the House API documentation.
// The XML payload spec is identical across chambers; the Senate validates
// more strictly, so we build to the Senate rules and the House follows.

export type Chamber = 'senate' | 'house';

// CWC API endpoints. The House exposes a UAT host + a validate endpoint that
// checks XML WITHOUT saving/sending. The Senate has separate test/prod hosts
// surfaced in the SOAPBox Technical Information page (fill in once issued).
export const CWC_ENDPOINTS = {
  house: {
    uat: 'https://uat-cwc.house.gov',
    production: 'https://cwc.house.gov',
  },
  senate: {
    // Confirmed from the SOAPBox Technical Information page (2026-08-12,
    // saved in docs/Jared Shared Resources — marked proprietary, keep out of
    // public docs). Key goes in ?apikey=; Content-Type MUST be
    // application/xml (else 415). Success = 201 Created; 400 body explains
    // validation failures; 409 = duplicate DeliveryId. SCWC maintenance
    // windows: Sun 12a–6a + Wed 5a–7a ET — expect intermittent outages.
    test: process.env.SCWC_TEST_URL ?? 'https://soapbox.senate.gov/api/testing-messages/',
    production: process.env.SCWC_PRODUCTION_URL ?? 'https://soapbox.senate.gov/api/production-messages/',
    // Participating offices — the doc requires querying this regularly and
    // before large campaigns; messages to unlisted offices are rejected.
    activeOffices: process.env.SCWC_OFFICES_URL ?? 'https://soapbox.senate.gov/api/active_offices',
  },
} as const;

// The Senate validates the prefix against EXACTLY these five values. Anything
// else is rejected. (The House historically does not validate prefixes.)
export const ALLOWED_PREFIXES = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.'] as const;
export type Prefix = (typeof ALLOWED_PREFIXES)[number];

// Library of Congress policy areas — the ONLY accepted <LibraryOfCongressTopic>
// values (schema `choice`). Use the Senate list; it trails the House's newest
// addition, and George asked us to use the Senate values.
export const LOC_TOPICS = [
  'Agriculture and Food',
  'Animals',
  'Armed Forces and National Security',
  'Arts, Culture, Religion',
  'Civil Rights and Liberties, Minority Issues',
  'Commerce',
  'Congress',
  'Crime and Law Enforcement',
  'Economics and Public Finance',
  'Education',
  'Emergency Management',
  'Energy',
  'Environmental Protection',
  'Families',
  'Finance and Financial Sector',
  'Foreign Trade and International Finance',
  'Government Operations and Politics',
  'Health',
  'Housing and Community Development',
  'Immigration',
  'International Affairs',
  'Labor and Employment',
  'Law',
  'Native Americans',
  'Public Lands and Natural Resources',
  'Science, Technology, Communications',
  'Social Sciences and History',
  'Social Welfare',
  'Sports and Recreation',
  'Taxation',
  'Transportation and Public Works',
  'Water Resources Development',
] as const;
export type LocTopic = (typeof LOC_TOPICS)[number];
export const LOC_TOPIC_SET: ReadonlySet<string> = new Set(LOC_TOPICS);

// Accepted <BillTypeAbbreviation> values, matching the Senate RNG alternation
// EXACTLY. RelaxNG/XSD `pattern` is a whole-string (anchored) match, so the
// H.Con.Res branch — which the schema writes WITHOUT a trailing period — only
// accepts the 9-char literal "H.Con.Res"; "H.Con.Res." (10 chars) matches no
// branch and is REJECTED. So H.Con.Res must NOT have a trailing dot, even though
// every sibling type does. (Verified: "H.Con.Res." → fails, "H.Con.Res" → passes.)
// CAUTION: the House sample XML uses LOWERCASE ("hr", "s"). These Title-case
// values are Senate-correct; confirm House casing against /v2/validate before
// House go-live and make this chamber-aware if the House schema is strict.
export const BILL_TYPE_ABBREVIATIONS = {
  hamdt: 'H.Amdt.',
  hconres: 'H.Con.Res',
  hjres: 'H.J.Res.',
  hr: 'H.R.',
  hres: 'H.Res.',
  s: 'S.',
  samdt: 'S.Amdt.',
  sconres: 'S.Con.Res.',
  sjres: 'S.J.Res.',
  sres: 'S.Res.',
} as const;
export type BillTypeKey = keyof typeof BILL_TYPE_ABBREVIATIONS;

// Valid two-letter state/territory codes (schema enum for <StateAbbreviation>).
export const CWC_STATE_CODES: ReadonlySet<string> = new Set([
  'AK','AL','AR','AS','AZ','CA','CO','CT','DC','DE','FL','GA','GU','HI','IA','ID',
  'IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MP','MS','MT','NC','ND',
  'NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','PR','RI','SC','SD','TN','TX',
  'UT','VA','VI','VT','WA','WI','WV','WY',
]);

// Field length bounds from the schema, so callers can validate/trim upstream.
export const FIELD_LIMITS = {
  subjectMin: 6,
  subjectMax: 500,
  messageMin: 6,
  messageMax: 10_000,
  organizationAboutMin: 6,
  organizationAboutMax: 500,
  organizationMin: 3,
  organizationContactNameMin: 2,
  deliveryAgentContactNameMin: 6,
} as const;

// Production send-rate ceiling George gave us: 5–10 messages/second.
export const MAX_MESSAGES_PER_SECOND = 5;

/**
 * SCWC scheduled maintenance windows (SOAPBox Technical Information page):
 * Sunday 12:00a–6:00a and Wednesday 5:00a–7:00a, US Eastern. Sends during a
 * window hit intermittent outages, so the batch sender refuses to start.
 * Evaluated in America/New_York so EST/EDT shifts are handled by Intl.
 */
export function isInScwcMaintenanceWindow(date: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value) % 24; // "24" → 0
  if (weekday === 'Sun' && hour < 6) return true; // Sun 12:00a–5:59a
  if (weekday === 'Wed' && hour >= 5 && hour < 7) return true; // Wed 5:00a–6:59a
  return false;
}

/**
 * House CWC daily maintenance window: 12:00a–6:00a US Eastern, EVERY day
 * (House CWC documentation). Same Intl-based evaluation as the SCWC windows
 * so EST/EDT transitions are handled correctly. The 2026-08-26 audit flagged
 * this as unhandled — Senate windows were checked, House's never was.
 */
export function isInHouseMaintenanceWindow(date: Date = new Date()): boolean {
  const hour =
    Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: false,
      })
        .formatToParts(date)
        .find((p) => p.type === 'hour')?.value,
    ) % 24; // "24" → 0
  return hour < 6; // 12:00a–5:59a ET daily
}

/** Chamber-aware window check — the send path's single entry point. */
export function isInMaintenanceWindow(chamber: Chamber, date: Date = new Date()): boolean {
  return chamber === 'senate' ? isInScwcMaintenanceWindow(date) : isInHouseMaintenanceWindow(date);
}
