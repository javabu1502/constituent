/**
 * Maps congressional committee names to LDA issue codes.
 * Used to show lobbying activity relevant to a representative's committees.
 *
 * Issue codes from: https://lda.senate.gov/api/v1/constants/filing/lobbyingactivityissues/
 */

// Committee name fragment → LDA issue codes
// We use partial name matching to handle variations like
// "Committee on Energy and Commerce" vs "Energy and Commerce"
export const COMMITTEE_ISSUE_MAP: Record<string, string[]> = {
  // Senate Committees
  'agriculture': ['AGR', 'FOO', 'NAT', 'ANI'],
  'appropriations': ['BUD'],
  'armed services': ['DEF', 'AER'],
  'banking': ['BAN', 'FIN', 'HOU', 'INS'],
  'budget': ['BUD'],
  'commerce, science': ['COM', 'SCI', 'TRA', 'TEC', 'AVI', 'AER', 'CSP'],
  'energy and natural resources': ['ENG', 'FUE', 'NAT'],
  'energy and commerce': ['ENG', 'HCR', 'ENV', 'TEC', 'COM', 'CSP'],
  'environment and public works': ['ENV', 'CAW', 'WAS', 'ROD', 'TRA'],
  'finance': ['TAX', 'HCR', 'MMM', 'TRD', 'TAR'],
  'foreign relations': ['FOR', 'TRD'],
  'foreign affairs': ['FOR', 'TRD'],
  'health, education, labor': ['HCR', 'EDU', 'LBR', 'MED', 'PHA', 'RET'],
  'education and the workforce': ['EDU', 'LBR'],
  'education and labor': ['EDU', 'LBR'],
  'homeland security': ['HOM', 'GOV', 'DIS'],
  'indian affairs': ['IND'],
  'native american': ['IND'],
  'natural resources': ['NAT', 'ENG', 'IND'],
  'intelligence': ['INT', 'DEF'],
  'judiciary': ['LAW', 'CIV', 'CON', 'IMM', 'CPT'],
  'rules': ['GOV'],
  'small business': ['SMB', 'ECN'],
  'veterans': ['VET'],
  'ways and means': ['TAX', 'HCR', 'MMM', 'TRD'],
  'financial services': ['BAN', 'FIN', 'INS', 'HOU'],
  'oversight': ['GOV'],
  'science, space': ['SCI', 'AER', 'ENG'],
  'transportation': ['TRA', 'AVI', 'ROD', 'MAR', 'RRR'],
  'infrastructure': ['TRA', 'ROD', 'URB'],
};

// Default issue codes if no committee match is found
export const DEFAULT_ISSUE_CODES = ['HCR', 'TAX', 'DEF', 'EDU', 'ENV', 'BUD'];

/**
 * Given a list of committee names, return unique LDA issue codes
 */
export function committeesToIssueCodes(committees: string[]): string[] {
  const codes = new Set<string>();

  for (const committee of committees) {
    const lower = committee.toLowerCase();
    for (const [fragment, issueCodes] of Object.entries(COMMITTEE_ISSUE_MAP)) {
      if (lower.includes(fragment)) {
        for (const code of issueCodes) {
          codes.add(code);
        }
      }
    }
  }

  if (codes.size === 0) {
    return DEFAULT_ISSUE_CODES;
  }

  return [...codes];
}

/**
 * Map of LDA issue code → display name for reference
 */
export const ISSUE_CODE_NAMES: Record<string, string> = {
  ACC: 'Accounting',
  ADV: 'Advertising',
  AER: 'Aerospace',
  AGR: 'Agriculture',
  ALC: 'Alcohol and Drug Abuse',
  ANI: 'Animals',
  APP: 'Apparel/Clothing Industry/Textiles',
  ART: 'Arts/Entertainment',
  AUT: 'Automotive Industry',
  AVI: 'Aviation/Airlines/Airports',
  BAN: 'Banking',
  BNK: 'Bankruptcy',
  BEV: 'Beverage Industry',
  BUD: 'Budget/Appropriations',
  CIV: 'Civil Rights/Civil Liberties',
  CHM: 'Chemicals/Chemical Industry',
  CAW: 'Clean Air and Water',
  CDT: 'Commodities',
  COM: 'Communications/Broadcasting/Radio/TV',
  CPI: 'Computer Industry',
  CON: 'Constitution',
  CSP: 'Consumer Issues/Safety/Products',
  CPT: 'Copyright/Patent/Trademark',
  DEF: 'Defense',
  DIS: 'Disaster Planning/Emergencies',
  DOC: 'District of Columbia',
  ECN: 'Economics/Economic Development',
  EDU: 'Education',
  ENG: 'Energy/Nuclear',
  ENV: 'Environment/Superfund',
  FAM: 'Family Issues/Abortion/Adoption',
  FIN: 'Financial Institutions/Investments/Securities',
  FIR: 'Firearms/Guns/Ammunition',
  FOO: 'Food Industry',
  FOR: 'Foreign Relations',
  FUE: 'Fuel/Gas/Oil',
  GAM: 'Gaming/Gambling/Casino',
  GOV: 'Government Issues',
  HCR: 'Health Issues',
  HOM: 'Homeland Security',
  HOU: 'Housing',
  IMM: 'Immigration',
  IND: 'Indian/Native American Affairs',
  INS: 'Insurance',
  INT: 'Intelligence',
  LBR: 'Labor Issues/Antitrust/Workplace',
  LAW: 'Law Enforcement/Crime/Criminal Justice',
  MAN: 'Manufacturing',
  MAR: 'Marine/Maritime/Boating/Fisheries',
  MIA: 'Media (Information/Publishing)',
  MED: 'Medical/Disease Research/Clinical Labs',
  MMM: 'Medicare/Medicaid',
  MON: 'Minting/Money/Gold Standard',
  NAT: 'Natural Resources',
  PHA: 'Pharmacy',
  POS: 'Postal',
  RRR: 'Railroads',
  RES: 'Real Estate/Land Use/Conservation',
  REL: 'Religion',
  RET: 'Retirement',
  ROD: 'Roads/Highway',
  SCI: 'Science/Technology',
  SMB: 'Small Business',
  SPO: 'Sports/Athletics',
  TAR: 'Tariff',
  TAX: 'Taxation/Internal Revenue Code',
  TEC: 'Telecommunications',
  TOB: 'Tobacco',
  TOR: 'Torts',
  TRD: 'Trade (Domestic/Foreign)',
  TRA: 'Transportation',
  TOU: 'Travel/Tourism',
  TRU: 'Trucking/Shipping',
  URB: 'Urban Development/Municipalities',
  UNM: 'Unemployment',
  UTI: 'Utilities',
  VET: 'Veterans',
  WAS: 'Waste (Hazardous/Solid/Interstate/Nuclear)',
  WEL: 'Welfare',
};
