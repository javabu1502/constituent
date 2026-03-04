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
  'Agriculture and Food': ['Farming', 'Food Safety', 'SNAP/Food Stamps', 'School Meals', 'Rural Development', 'Farm Subsidies', 'Organic Farming', 'GMOs', 'Agricultural Workers', 'Crop Insurance'],
  'Animals': ['Animal Welfare', 'Endangered Species', 'Wildlife', 'Factory Farming', 'Animal Testing', 'Puppy Mills'],
  'Armed Forces and National Security': ['Veterans', 'Military Funding', 'National Guard', 'Defense Spending', 'VA Healthcare', 'Nuclear Weapons', 'Cybersecurity', 'Military Bases', 'Military Families', 'PTSD', 'Arms Sales', 'Military Housing', 'Drone Warfare'],
  'Arts, Culture, Religion': ['Arts Funding', 'Museums', 'Religious Liberty'],
  'Civil Rights and Liberties, Minority Issues': ['Voting Rights', 'Discrimination', 'LGBTQ+ Rights', 'Disability Rights', 'Free Speech', 'Racial Justice', 'Police Accountability', 'Affirmative Action', 'Reparations', 'Censorship'],
  'Commerce': ['Small Business', 'Consumer Protection', 'Trade', 'Antitrust', 'Gig Economy', 'Supply Chain', 'Price Gouging'],
  'Congress': ['Congressional Reform', 'Term Limits', 'Government Accountability', 'Congressional Oversight', 'Congressional Pay'],
  'Crime and Law Enforcement': ['Gun Violence', 'Police Reform', 'Drug Policy', 'Criminal Justice Reform', 'Sentencing', 'Fentanyl', 'Human Trafficking', 'Cybercrime', 'Domestic Violence', 'Hate Crimes', 'Mass Incarceration', 'Death Penalty', 'Bail Reform', 'Juvenile Justice', 'Gang Violence', 'Recidivism'],
  'Economics and Public Finance': ['Federal Budget', 'National Debt', 'Inflation', 'Cost of Living', 'Wage Growth', 'Federal Reserve', 'Recession', 'Trade Deficit'],
  'Education': ['K-12 Education', 'Student Loans', 'Higher Education', 'Special Education', 'School Choice', 'Teacher Pay', 'School Safety', 'Book Bans', 'School Funding', 'Early Childhood Education', 'Pre-K', 'Title IX', 'STEM Education', 'Homeschooling'],
  'Emergency Management': ['Disaster Relief', 'FEMA', 'Emergency Preparedness', 'Climate Resilience', 'Pandemic Preparedness', 'First Responders'],
  'Energy': ['Oil and Gas', 'Renewable Energy', 'Energy Costs', 'Nuclear Energy', 'Electric Vehicles', 'Energy Grid', 'Fracking', 'Carbon Tax'],
  'Environmental Protection': ['Climate Change', 'Clean Air', 'Clean Water', 'Pollution', 'EPA', 'PFAS/Forever Chemicals', 'Plastics', 'Environmental Justice', 'Wildfires'],
  'Families': ['Child Care', 'Paid Family Leave', 'Child Welfare', 'Foster Care', 'Adoption', 'Child Tax Credit', 'Parental Rights', 'Child Safety Online', 'Child Poverty', 'Grandparent Caregivers', 'Youth Mental Health'],
  'Finance and Financial Sector': ['Banking', 'Credit', 'Wall Street Regulation', 'Cryptocurrency', 'Predatory Lending', 'Insurance Regulation', 'Financial Literacy', 'Student Debt'],
  'Foreign Trade and International Finance': ['Tariffs', 'Trade Agreements', 'Sanctions', 'Imports/Exports', 'Trade with China', 'USMCA', 'Currency Manipulation', 'Supply Chain Security'],
  'Government Operations and Politics': ['Elections', 'Campaign Finance', 'Government Spending', 'Federal Agencies', 'Voter ID', 'Redistricting', 'Ethics Reform', 'Lobbying Reform', 'Government Transparency', 'Filibuster Reform'],
  'Health': ['Medicare', 'Medicaid', 'Prescription Drug Costs', 'Mental Health', 'Reproductive Health', 'Opioids', 'ACA/Obamacare', 'Public Health', 'Telehealth', 'Hospital Access', 'Veterans Health', 'Infant/Early Childhood Mental Health', 'Maternal Health', 'Dental Care', 'Long-Term Care', 'Nursing Shortage', 'Vaccine Policy', 'Health Equity'],
  'Housing and Community Development': ['Affordable Housing', 'Homelessness', 'Rent', 'Mortgage Rates', 'HUD', 'Zoning Reform', 'Public Housing', 'Housing Discrimination'],
  'Immigration': ['Border Security', 'DACA', 'Visas', 'Asylum', 'Refugee Policy', 'Legal Immigration', 'Immigration Courts', 'H-1B Visas', 'Citizenship', 'Deportation'],
  'International Affairs': ['Foreign Aid', 'Diplomacy', 'NATO', 'Middle East', 'Ukraine', 'China', 'Iran', 'Israel/Palestine', 'Russia', 'Taiwan', 'North Korea', 'Africa', 'Latin America', 'United Nations', 'Human Rights Abroad', 'Arms Control', 'Terrorism'],
  'Labor and Employment': ['Minimum Wage', 'Worker Rights', 'Unions', 'Workplace Safety', 'Unemployment', 'Paid Sick Leave', 'Remote Work', 'Overtime Pay', 'Child Labor', 'Pension', 'Right to Work'],
  'Law': ['Supreme Court', 'Judicial Appointments', 'Legal Reform', 'Court Reform', 'Legal Aid', 'Civil Asset Forfeiture'],
  'Native Americans': ['Tribal Sovereignty', 'Indian Health Service', 'Native Land Rights', 'Missing and Murdered Indigenous People', 'Tribal Education'],
  'Public Lands and Natural Resources': ['National Parks', 'Public Lands', 'Mining', 'Forestry', 'Conservation', 'Wilderness Protection', 'Drilling on Public Lands'],
  'Science, Technology, Communications': ['AI', 'Internet/Broadband', 'Space', 'Social Media Regulation', 'Data Privacy', 'Cybersecurity', 'Net Neutrality', 'Tech Monopolies', 'Automation/Robotics'],
  'Social Welfare': ['Social Security', 'Poverty', 'Disability Benefits', 'Safety Net Programs', 'Universal Basic Income', 'Food Insecurity', 'Senior Care', 'Aging'],
  'Sports and Recreation': ['Youth Sports', 'Outdoor Recreation'],
  'Taxation': ['Income Tax', 'Corporate Tax', 'Tax Reform', 'Tax Credits', 'Capital Gains Tax', 'Wealth Tax', 'Estate Tax', 'Tax Loopholes'],
  'Transportation and Public Works': ['Roads', 'Public Transit', 'Airports', 'Rail', 'Infrastructure', 'High-Speed Rail', 'Highway Safety', 'Trucking', 'EV Charging Infrastructure'],
  'Water Resources Development': ['Dams', 'Flood Control', 'Water Infrastructure', 'Drought', 'Clean Drinking Water', 'Water Rights'],
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
  'deportation': ['deportation', 'immigration', 'border security'],
  'deport': ['deportation', 'immigration', 'border security'],
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
  'israel': ['israel/palestine', 'middle east', 'international affairs', 'foreign aid'],
  'palestine': ['israel/palestine', 'middle east', 'international affairs'],
  'gaza': ['israel/palestine', 'middle east', 'international affairs'],
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
  'nuclear': ['nuclear energy', 'nuclear weapons', 'energy'],
  'corruption': ['government accountability', 'campaign finance'],
  'congress': ['congressional reform', 'term limits'],
  'term limits': ['term limits', 'congressional reform'],
  'supreme court': ['supreme court', 'judicial appointments'],
  'scotus': ['supreme court', 'judicial appointments'],
  'judges': ['judicial appointments', 'supreme court'],
  // International affairs
  'iran': ['iran', 'international affairs'],
  'tehran': ['iran', 'international affairs'],
  'hamas': ['israel/palestine', 'middle east'],
  'hezbollah': ['middle east', 'international affairs'],
  'netanyahu': ['israel/palestine', 'international affairs'],
  'russia': ['russia', 'international affairs'],
  'putin': ['russia', 'international affairs'],
  'taiwan': ['taiwan', 'international affairs', 'china'],
  'north korea': ['north korea', 'international affairs'],
  'kim jong': ['north korea', 'international affairs'],
  // Crime
  'fentanyl': ['fentanyl', 'drug policy', 'crime and law enforcement'],
  'trafficking': ['human trafficking', 'crime and law enforcement'],
  // Cybersecurity
  'cybersecurity': ['cybersecurity', 'science, technology', 'armed forces and national security'],
  'hack': ['cybersecurity', 'cybercrime'],
  'hacking': ['cybersecurity', 'cybercrime'],
  // Energy & environment
  'electric vehicle': ['electric vehicles', 'energy'],
  'ev': ['electric vehicles', 'energy'],
  'tesla': ['electric vehicles', 'energy'],
  'pfas': ['pfas/forever chemicals', 'environmental protection'],
  'fracking': ['fracking', 'energy'],
  'wildfire': ['wildfires', 'environmental protection'],
  'wildfires': ['wildfires', 'environmental protection'],
  // Education
  'teacher': ['teacher pay', 'education'],
  'book ban': ['book bans', 'education'],
  'book bans': ['book bans', 'education'],
  // Commerce & economy
  'gig': ['gig economy', 'commerce'],
  'uber': ['gig economy', 'worker rights'],
  'lyft': ['gig economy', 'worker rights'],
  // Housing
  'zoning': ['zoning reform', 'housing and community development'],
  // Taxation
  'wealth tax': ['wealth tax', 'taxation'],
  'billionaire': ['wealth tax', 'taxation'],
  'billionaires': ['wealth tax', 'taxation'],
  // Health - new
  'iecmh': ['infant/early childhood mental health', 'mental health', 'health'],
  'infant mental health': ['infant/early childhood mental health', 'health'],
  'maternal': ['maternal health', 'reproductive health', 'health'],
  'pregnancy': ['maternal health', 'reproductive health'],
  'postpartum': ['maternal health', 'health'],
  'dentist': ['dental care', 'health'],
  'dental': ['dental care', 'health'],
  'nurse': ['nursing shortage', 'health'],
  'nurses': ['nursing shortage', 'health'],
  'nursing': ['nursing shortage', 'long-term care', 'health'],
  'vaccine': ['vaccine policy', 'public health'],
  'vaccines': ['vaccine policy', 'public health'],
  'vaccination': ['vaccine policy', 'public health'],
  'telehealth': ['telehealth', 'health'],
  'long-term care': ['long-term care', 'senior care'],
  'elderly': ['senior care', 'aging', 'long-term care'],
  'seniors': ['senior care', 'aging', 'social security'],
  // Crime & justice - new
  'incarceration': ['mass incarceration', 'criminal justice reform'],
  'death penalty': ['death penalty', 'sentencing'],
  'execution': ['death penalty', 'sentencing'],
  'bail': ['bail reform', 'criminal justice reform'],
  'juvenile': ['juvenile justice', 'crime and law enforcement'],
  'youth crime': ['juvenile justice', 'gang violence'],
  'gang': ['gang violence', 'crime and law enforcement'],
  'gangs': ['gang violence', 'crime and law enforcement'],
  'recidivism': ['recidivism', 'criminal justice reform'],
  'reentry': ['recidivism', 'criminal justice reform'],
  // Education - new
  'pre-k': ['pre-k', 'early childhood education'],
  'preschool': ['pre-k', 'early childhood education'],
  'title ix': ['title ix', 'education'],
  'stem': ['stem education', 'education'],
  'homeschool': ['homeschooling', 'education'],
  'homeschooling': ['homeschooling', 'education'],
  // Civil rights - new
  'racial justice': ['racial justice', 'discrimination'],
  'blm': ['racial justice', 'police accountability'],
  'affirmative action': ['affirmative action', 'civil rights'],
  'reparations': ['reparations', 'racial justice'],
  'censorship': ['censorship', 'free speech'],
  // Labor - new
  'sick leave': ['paid sick leave', 'labor and employment'],
  'remote work': ['remote work', 'labor and employment'],
  'overtime': ['overtime pay', 'labor and employment'],
  'child labor': ['child labor', 'labor and employment'],
  'pension': ['pension', 'social security'],
  'pensions': ['pension', 'social security'],
  '401k': ['pension', 'finance and financial sector'],
  // Government - new
  'voter id': ['voter id', 'elections', 'voting rights'],
  'redistricting': ['redistricting', 'elections'],
  'lobbying': ['lobbying reform', 'ethics reform'],
  'lobbyist': ['lobbying reform', 'government operations'],
  'filibuster': ['filibuster reform', 'congressional reform'],
  'transparency': ['government transparency', 'government operations'],
  'ethics': ['ethics reform', 'government operations'],
  // Social welfare - new
  'ubi': ['universal basic income', 'social welfare'],
  'basic income': ['universal basic income', 'social welfare'],
  'food insecurity': ['food insecurity', 'snap/food stamps'],
  'hungry': ['food insecurity', 'snap/food stamps'],
  'hunger': ['food insecurity', 'snap/food stamps'],
  'aging': ['aging', 'senior care', 'social welfare'],
  // Agriculture - new
  'gmo': ['gmos', 'food safety'],
  'gmos': ['gmos', 'food safety', 'agriculture and food'],
  'organic': ['organic farming', 'agriculture and food'],
  'crop': ['crop insurance', 'farming'],
  'subsidy': ['farm subsidies', 'agriculture and food'],
  'subsidies': ['farm subsidies', 'agriculture and food'],
  // Animals - new
  'factory farm': ['factory farming', 'animal welfare'],
  'animal testing': ['animal testing', 'animal welfare'],
  'puppy mill': ['puppy mills', 'animal welfare'],
  // Law - new
  'court reform': ['court reform', 'supreme court'],
  'court packing': ['court reform', 'supreme court'],
  'legal aid': ['legal aid', 'law'],
  'forfeiture': ['civil asset forfeiture', 'law'],
  // Emergency - new
  'pandemic': ['pandemic preparedness', 'public health'],
  'first responder': ['first responders', 'emergency management'],
  'first responders': ['first responders', 'emergency management'],
  'firefighter': ['first responders', 'emergency management'],
  'paramedic': ['first responders', 'emergency management'],
  // Native Americans - new
  'mmiw': ['missing and murdered indigenous people', 'native americans'],
  'mmip': ['missing and murdered indigenous people', 'native americans'],
  'indigenous': ['native americans', 'tribal sovereignty'],
  // Public lands - new
  'conservation': ['conservation', 'public lands'],
  'wilderness': ['wilderness protection', 'public lands'],
  'drilling': ['drilling on public lands', 'oil and gas'],
  // Transportation - new
  'high-speed rail': ['high-speed rail', 'rail', 'transportation'],
  'amtrak': ['rail', 'high-speed rail', 'transportation'],
  'trucking': ['trucking', 'transportation'],
  'ev charging': ['ev charging infrastructure', 'electric vehicles'],
  // Families - new
  'youth mental health': ['youth mental health', 'mental health', 'families'],
  // International - new
  'terrorism': ['terrorism', 'armed forces and national security'],
  'arms control': ['arms control', 'nuclear weapons'],
  'human rights': ['human rights abroad', 'international affairs'],
  // Finance - new
  'payday loan': ['predatory lending', 'finance and financial sector'],
  'payday': ['predatory lending', 'finance and financial sector'],
  'student debt': ['student debt', 'student loans'],
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
