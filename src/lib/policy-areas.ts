/**
 * Congressional Research Service (CRS) Policy Areas
 *
 * The 32 official policy area categories used on congress.gov,
 * each with common subtopics for user-friendly selection.
 */

export interface IssueOption {
  label: string;
  category: string;
}

const POLICY_AREAS: Record<string, string[]> = {
  'Agriculture and Food': ['Farming', 'Food Safety', 'SNAP/Food Stamps', 'School Meals', 'Rural Development'],
  'Animals': ['Animal Welfare', 'Endangered Species', 'Wildlife'],
  'Armed Forces and National Security': ['Veterans', 'Military Funding', 'National Guard', 'Defense Spending'],
  'Arts, Culture, Religion': ['Arts Funding', 'Museums', 'Religious Liberty'],
  'Civil Rights and Liberties, Minority Issues': ['Voting Rights', 'Discrimination', 'LGBTQ+ Rights', 'Disability Rights', 'Free Speech'],
  'Commerce': ['Small Business', 'Consumer Protection', 'Trade', 'Antitrust'],
  'Congress': ['Congressional Reform', 'Term Limits', 'Government Accountability'],
  'Crime and Law Enforcement': ['Gun Violence', 'Police Reform', 'Drug Policy', 'Criminal Justice Reform', 'Sentencing'],
  'Economics and Public Finance': ['Federal Budget', 'National Debt', 'Inflation', 'Cost of Living'],
  'Education': ['K-12 Education', 'Student Loans', 'Higher Education', 'Special Education', 'School Choice'],
  'Emergency Management': ['Disaster Relief', 'FEMA', 'Emergency Preparedness'],
  'Energy': ['Oil and Gas', 'Renewable Energy', 'Energy Costs', 'Nuclear Energy'],
  'Environmental Protection': ['Climate Change', 'Clean Air', 'Clean Water', 'Pollution', 'EPA'],
  'Families': ['Child Care', 'Paid Family Leave', 'Child Welfare', 'Foster Care', 'Adoption'],
  'Finance and Financial Sector': ['Banking', 'Credit', 'Wall Street Regulation', 'Cryptocurrency'],
  'Foreign Trade and International Finance': ['Tariffs', 'Trade Agreements', 'Sanctions', 'Imports/Exports'],
  'Government Operations and Politics': ['Elections', 'Campaign Finance', 'Government Spending', 'Federal Agencies'],
  'Health': ['Medicare', 'Medicaid', 'Prescription Drug Costs', 'Mental Health', 'Reproductive Health', 'Opioids', 'ACA/Obamacare'],
  'Housing and Community Development': ['Affordable Housing', 'Homelessness', 'Rent', 'Mortgage Rates', 'HUD'],
  'Immigration': ['Border Security', 'DACA', 'Visas', 'Asylum', 'Refugee Policy'],
  'International Affairs': ['Foreign Aid', 'Diplomacy', 'NATO', 'Middle East', 'Ukraine', 'China'],
  'Labor and Employment': ['Minimum Wage', 'Worker Rights', 'Unions', 'Workplace Safety', 'Unemployment'],
  'Law': ['Supreme Court', 'Judicial Appointments', 'Legal Reform'],
  'Native Americans': ['Tribal Sovereignty', 'Indian Health Service', 'Native Land Rights'],
  'Public Lands and Natural Resources': ['National Parks', 'Public Lands', 'Mining', 'Forestry'],
  'Science, Technology, Communications': ['AI', 'Internet/Broadband', 'Space', 'Social Media Regulation', 'Data Privacy'],
  'Social Welfare': ['Social Security', 'Poverty', 'Disability Benefits', 'Safety Net Programs'],
  'Sports and Recreation': ['Youth Sports', 'Outdoor Recreation'],
  'Taxation': ['Income Tax', 'Corporate Tax', 'Tax Reform', 'Tax Credits'],
  'Transportation and Public Works': ['Roads', 'Public Transit', 'Airports', 'Rail', 'Infrastructure'],
  'Water Resources Development': ['Dams', 'Flood Control', 'Water Infrastructure', 'Drought'],
};

// Pre-built flat list for search
let cachedOptions: IssueOption[] | null = null;

export function getAllIssueOptions(): IssueOption[] {
  if (cachedOptions) return cachedOptions;

  cachedOptions = [];
  for (const [category, subtopics] of Object.entries(POLICY_AREAS)) {
    for (const label of subtopics) {
      cachedOptions.push({ label, category });
    }
  }
  return cachedOptions;
}

export function searchIssues(query: string): IssueOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return getAllIssueOptions();

  const terms = q.split(/\s+/);

  return getAllIssueOptions().filter((option) => {
    const haystack = `${option.label} ${option.category}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
