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
    // TODO: confirm exact hosts from the SOAPBox Technical Information page
    // once the Senate testing key is issued.
    test: process.env.SCWC_TEST_URL ?? '',
    production: process.env.SCWC_PRODUCTION_URL ?? '',
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

// Accepted <BillTypeAbbreviation> values. The Senate RNG alternation writes the
// H.Con.Res branch without a trailing period, but in a RelaxNG token pattern the
// alternation is whole-value and `.` means "any char", so "H.Con.Res." matches
// too — and that trailing-period form is the packet's canonical spelling and
// consistent with every sibling type, so we emit it.
// CAUTION: the House sample XML uses LOWERCASE ("hr", "s"). These Title-case
// values are Senate-correct; confirm House casing against /v2/validate before
// House go-live and make this chamber-aware if the House schema is strict.
export const BILL_TYPE_ABBREVIATIONS = {
  hamdt: 'H.Amdt.',
  hconres: 'H.Con.Res.',
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
  organizationAboutMax: 500,
} as const;

// Production send-rate ceiling George gave us: 5–10 messages/second.
export const MAX_MESSAGES_PER_SECOND = 5;
