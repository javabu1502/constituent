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

// Keyword synonyms: common words people type → terms that match our labels/categories
const KEYWORD_ALIASES: Record<string, string[]> = {
  'guns': ['gun violence', 'crime and law enforcement'],
  'gun': ['gun violence', 'crime and law enforcement'],
  'firearms': ['gun violence', 'crime and law enforcement'],
  'shooting': ['gun violence', 'crime and law enforcement'],
  'second amendment': ['gun violence', 'crime and law enforcement'],
  '2a': ['gun violence', 'crime and law enforcement'],
  'taxes': ['taxation', 'income tax', 'tax reform'],
  'tax': ['taxation', 'income tax', 'tax reform'],
  'irs': ['taxation', 'income tax'],
  'roads': ['roads', 'infrastructure', 'transportation'],
  'highways': ['roads', 'infrastructure', 'transportation'],
  'bridges': ['infrastructure', 'transportation'],
  'potholes': ['roads', 'infrastructure'],
  'traffic': ['roads', 'public transit', 'transportation'],
  'train': ['rail', 'public transit'],
  'trains': ['rail', 'public transit'],
  'subway': ['public transit', 'transportation'],
  'bus': ['public transit', 'transportation'],
  'doctor': ['health', 'medicare', 'medicaid'],
  'doctors': ['health', 'medicare', 'medicaid'],
  'hospital': ['health', 'medicare', 'prescription drug costs'],
  'insurance': ['health', 'aca/obamacare', 'medicare'],
  'medicine': ['prescription drug costs', 'health'],
  'drugs': ['drug policy', 'prescription drug costs', 'opioids'],
  'opioid': ['opioids', 'drug policy'],
  'abortion': ['reproductive health', 'health'],
  'roe': ['reproductive health', 'health'],
  'pro-choice': ['reproductive health', 'health'],
  'pro-life': ['reproductive health', 'health'],
  'school': ['k-12 education', 'education', 'school choice'],
  'schools': ['k-12 education', 'education', 'school choice'],
  'college': ['higher education', 'student loans'],
  'university': ['higher education', 'student loans'],
  'tuition': ['higher education', 'student loans'],
  'loans': ['student loans', 'credit'],
  'debt': ['national debt', 'student loans'],
  'jobs': ['labor and employment', 'minimum wage', 'unemployment'],
  'job': ['labor and employment', 'unemployment'],
  'work': ['labor and employment', 'worker rights'],
  'wages': ['minimum wage', 'labor and employment'],
  'salary': ['minimum wage', 'labor and employment'],
  'pay': ['minimum wage', 'labor and employment'],
  'union': ['unions', 'labor and employment'],
  'rent': ['rent', 'affordable housing'],
  'renting': ['rent', 'affordable housing'],
  'apartment': ['rent', 'affordable housing', 'housing'],
  'house': ['affordable housing', 'mortgage rates', 'housing'],
  'mortgage': ['mortgage rates', 'housing'],
  'homeless': ['homelessness', 'housing'],
  'climate': ['climate change', 'environmental protection'],
  'warming': ['climate change', 'environmental protection'],
  'weather': ['climate change', 'environmental protection'],
  'pollution': ['pollution', 'clean air', 'clean water'],
  'carbon': ['climate change', 'clean air'],
  'solar': ['renewable energy', 'energy'],
  'wind': ['renewable energy', 'energy'],
  'electric': ['renewable energy', 'energy costs'],
  'gas': ['oil and gas', 'energy costs'],
  'oil': ['oil and gas', 'energy'],
  'border': ['border security', 'immigration'],
  'immigrants': ['immigration', 'daca', 'asylum'],
  'immigrant': ['immigration', 'daca', 'asylum'],
  'undocumented': ['immigration', 'daca'],
  'deportation': ['immigration', 'border security'],
  'deport': ['immigration', 'border security'],
  'wall': ['border security', 'immigration'],
  'refugee': ['refugee policy', 'asylum', 'immigration'],
  'refugees': ['refugee policy', 'asylum', 'immigration'],
  'welfare': ['social welfare', 'safety net programs', 'snap/food stamps'],
  'food stamps': ['snap/food stamps', 'agriculture and food'],
  'snap': ['snap/food stamps', 'agriculture and food'],
  'social security': ['social security', 'social welfare'],
  'retirement': ['social security', 'social welfare'],
  'medicare': ['medicare', 'health'],
  'medicaid': ['medicaid', 'health'],
  'veteran': ['veterans', 'armed forces and national security'],
  'vets': ['veterans', 'armed forces and national security'],
  'military': ['military funding', 'defense spending', 'armed forces'],
  'army': ['military funding', 'armed forces and national security'],
  'navy': ['military funding', 'armed forces and national security'],
  'war': ['armed forces and national security', 'foreign aid'],
  'police': ['police reform', 'crime and law enforcement'],
  'cops': ['police reform', 'crime and law enforcement'],
  'prison': ['criminal justice reform', 'sentencing'],
  'jail': ['criminal justice reform', 'sentencing'],
  'crime': ['crime and law enforcement', 'criminal justice reform'],
  'weed': ['drug policy', 'crime and law enforcement'],
  'marijuana': ['drug policy', 'crime and law enforcement'],
  'cannabis': ['drug policy', 'crime and law enforcement'],
  'crypto': ['cryptocurrency', 'finance and financial sector'],
  'bitcoin': ['cryptocurrency', 'finance and financial sector'],
  'banks': ['banking', 'finance and financial sector'],
  'wall street': ['wall street regulation', 'finance'],
  'internet': ['internet/broadband', 'science, technology'],
  'broadband': ['internet/broadband', 'science, technology'],
  'wifi': ['internet/broadband', 'science, technology'],
  'privacy': ['data privacy', 'science, technology'],
  'tiktok': ['social media regulation', 'data privacy'],
  'social media': ['social media regulation', 'data privacy'],
  'ai': ['ai', 'science, technology'],
  'artificial intelligence': ['ai', 'science, technology'],
  'tariff': ['tariffs', 'foreign trade'],
  'tariffs': ['tariffs', 'foreign trade'],
  'trade': ['trade', 'trade agreements', 'foreign trade'],
  'china': ['china', 'international affairs', 'tariffs'],
  'ukraine': ['ukraine', 'international affairs', 'foreign aid'],
  'israel': ['middle east', 'international affairs', 'foreign aid'],
  'palestine': ['middle east', 'international affairs'],
  'gaza': ['middle east', 'international affairs'],
  'nato': ['nato', 'international affairs'],
  'voting': ['voting rights', 'elections'],
  'vote': ['voting rights', 'elections'],
  'election': ['elections', 'campaign finance'],
  'gerrymandering': ['elections', 'voting rights'],
  'lgbtq': ['lgbtq+ rights', 'civil rights'],
  'gay': ['lgbtq+ rights', 'civil rights'],
  'trans': ['lgbtq+ rights', 'civil rights'],
  'transgender': ['lgbtq+ rights', 'civil rights'],
  'discrimination': ['discrimination', 'civil rights'],
  'racism': ['discrimination', 'civil rights'],
  'disability': ['disability rights', 'disability benefits'],
  'disabled': ['disability rights', 'disability benefits'],
  'childcare': ['child care', 'families'],
  'daycare': ['child care', 'families'],
  'parental leave': ['paid family leave', 'families'],
  'maternity': ['paid family leave', 'families'],
  'paternity': ['paid family leave', 'families'],
  'parks': ['national parks', 'public lands'],
  'forest': ['forestry', 'public lands'],
  'water': ['clean water', 'water infrastructure'],
  'flood': ['flood control', 'disaster relief'],
  'hurricane': ['disaster relief', 'fema', 'emergency management'],
  'tornado': ['disaster relief', 'fema', 'emergency management'],
  'earthquake': ['disaster relief', 'fema'],
  'fema': ['fema', 'disaster relief', 'emergency management'],
  'inflation': ['inflation', 'cost of living', 'economics'],
  'prices': ['inflation', 'cost of living'],
  'expensive': ['inflation', 'cost of living'],
  'groceries': ['inflation', 'cost of living', 'snap/food stamps'],
  'farm': ['farming', 'agriculture and food'],
  'farmer': ['farming', 'agriculture and food'],
  'food': ['food safety', 'snap/food stamps', 'school meals'],
  'animals': ['animal welfare', 'endangered species'],
  'pets': ['animal welfare', 'animals'],
  'space': ['space', 'science, technology'],
  'nasa': ['space', 'science, technology'],
  'nuclear': ['nuclear energy', 'energy'],
  'corruption': ['government accountability', 'campaign finance'],
  'congress': ['congressional reform', 'term limits'],
  'term limits': ['term limits', 'congressional reform'],
  'supreme court': ['supreme court', 'judicial appointments'],
  'scotus': ['supreme court', 'judicial appointments'],
  'judges': ['judicial appointments', 'supreme court'],
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

  // Expand query with keyword aliases
  const expandedTerms = new Set<string>();
  // Add original terms
  const originalTerms = q.split(/\s+/);
  for (const term of originalTerms) {
    expandedTerms.add(term);
  }
  // Check for multi-word aliases (e.g., "food stamps", "social security")
  for (const [alias, expansions] of Object.entries(KEYWORD_ALIASES)) {
    if (q.includes(alias)) {
      for (const expansion of expansions) {
        expandedTerms.add(expansion);
      }
    }
  }

  const allOptions = getAllIssueOptions();

  // Score each option: higher score = better match
  const scored = allOptions.map((option) => {
    const haystack = `${option.label} ${option.category}`.toLowerCase();
    let score = 0;

    // Direct match on original terms (highest weight)
    for (const term of originalTerms) {
      if (haystack.includes(term)) score += 10;
    }

    // Expanded term matches (lower weight)
    for (const term of expandedTerms) {
      if (originalTerms.includes(term)) continue; // already counted
      if (haystack.includes(term)) score += 5;
    }

    return { option, score };
  });

  // Filter to options with any match, sort by score descending
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.option);
}
