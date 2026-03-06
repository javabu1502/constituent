// Topic context data for the contact flow

export interface TopicStat {
  value: string;
  label: string;
  source: string;
  sourceUrl?: string;
}

export interface TopicSource {
  label: string;
  url: string;
  type: 'government' | 'nonpartisan' | 'academic';
}

export interface TopicInfo {
  summary: string;
  keyStats?: TopicStat[];
  currentEvents: string[];
  commonAsks: { label: string; ask: string }[];
  perspectives: {
    label: string;
    points: string[];
    counterpoint?: string;
  }[];
  sources?: TopicSource[];
  orgs?: { name: string; url: string }[];
}

export const SUBTOPIC_CONTEXT: Record<string, TopicInfo> = {
  // Immigration subtopics
  'DACA': {
    summary: 'DACA (Deferred Action for Childhood Arrivals) protects hundreds of thousands of people brought to the U.S. as children from deportation and allows them to work legally.',
    keyStats: [
      { value: '~530,000', label: 'Active DACA recipients', source: 'USCIS, 2024', sourceUrl: 'https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data' },
      { value: '$11.7B', label: 'Annual federal tax contributions by DACA recipients', source: 'Center for American Progress, 2024' },
      { value: '97%', label: 'DACA recipients employed or in school', source: 'National Immigration Law Center, 2023' },
    ],
    currentEvents: [
      'Federal courts have blocked new DACA applications while allowing renewals for ~530,000 current recipients',
      'Multiple congressional proposals (DREAM Act, bipartisan frameworks) have stalled',
      'DACA recipients face uncertainty about long-term status and path to citizenship',
    ],
    commonAsks: [
      { label: 'Pass the DREAM Act', ask: 'Pass the DREAM Act to provide a permanent path to citizenship for DACA recipients' },
      { label: 'Protect current recipients', ask: 'Protect current DACA recipients from deportation and preserve their work authorization' },
      { label: 'End the program', ask: 'End the DACA program and enforce existing immigration law' },
      { label: 'Bipartisan solution', ask: 'Work across the aisle to find a permanent legislative solution for Dreamers' },
    ],
    perspectives: [
      { label: 'Protect Dreamers', points: ['They were brought as children and had no choice', 'They contribute significantly to the economy as workers and taxpayers', 'Most have no ties to their birth country'], counterpoint: 'Executive action bypassed the legislative process Congress is meant to control' },
      { label: 'Rule of law', points: ['Executive action bypassed Congress', 'Legal immigration should be the path', 'Amnesty incentivizes future illegal crossings'], counterpoint: 'These individuals grew up American and contribute billions in taxes' },
    ],
    sources: [
      { label: 'USCIS — DACA Data', url: 'https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data', type: 'government' },
      { label: 'CRS — DACA Policy Overview', url: 'https://crsreports.congress.gov/product/pdf/R/R46764', type: 'government' },
      { label: 'Migration Policy Institute — DACA', url: 'https://www.migrationpolicy.org/topics/deferred-action-childhood-arrivals-daca', type: 'nonpartisan' },
    ],
  },
  'Border Security': {
    summary: 'Border security policy covers physical barriers, technology, staffing at ports of entry, and enforcement strategies along U.S. borders.',
    keyStats: [
      { value: '2.5M+', label: 'Border encounters in FY2023', source: 'CBP, 2024', sourceUrl: 'https://www.cbp.gov/newsroom/stats/southwest-land-border-encounters' },
      { value: '~20,000', label: 'Border Patrol agents (authorized ~22,000)', source: 'CBP, 2024' },
      { value: '$25B+', label: 'Annual CBP budget', source: 'DHS Budget, 2024' },
    ],
    currentEvents: [
      'Border encounters remain elevated — over 2.5 million in FY2023',
      'Debates over border wall construction and technology investments',
      'CBP staffing shortages and asylum processing backlogs',
    ],
    commonAsks: [
      { label: 'Fund the wall', ask: 'Fund completion of physical barriers along the southern border' },
      { label: 'Invest in technology', ask: 'Invest in modern border technology (sensors, cameras, drones) rather than physical walls' },
      { label: 'Hire more agents', ask: 'Increase CBP and Border Patrol staffing to process people faster and more humanely' },
      { label: 'Address root causes', ask: 'Address root causes of migration in Central America to reduce border crossings' },
    ],
    perspectives: [
      { label: 'Stronger enforcement', points: ['Secure borders are a national security priority', 'Physical barriers deter crossings', 'Sovereignty requires border control'], counterpoint: 'Most unauthorized entries occur at legal ports of entry, not between them' },
      { label: 'Smart border policy', points: ['Walls are expensive and ineffective in many areas', 'Technology is more cost-effective', 'Legal pathways reduce illegal crossings'], counterpoint: 'Areas with physical barriers have seen measurable reductions in crossings' },
    ],
    sources: [
      { label: 'CBP — Border Encounter Data', url: 'https://www.cbp.gov/newsroom/stats/southwest-land-border-encounters', type: 'government' },
      { label: 'CRS — Border Security', url: 'https://crsreports.congress.gov/product/pdf/R/R47685', type: 'government' },
    ],
  },
  'Asylum': {
    summary: 'Asylum policy determines how the U.S. processes people fleeing persecution. Applicants must prove a credible fear of harm based on protected grounds.',
    keyStats: [
      { value: '3.7M+', label: 'Pending immigration court cases', source: 'TRAC Immigration, 2024', sourceUrl: 'https://trac.syr.edu/phptools/immigration/court_backlog/' },
      { value: '~600', label: 'Immigration judges (Congress authorized 734)', source: 'DOJ EOIR, 2024' },
      { value: '4+ years', label: 'Average wait time for asylum hearing', source: 'TRAC Immigration, 2024' },
    ],
    currentEvents: [
      'Asylum case backlog exceeds 3.7 million pending cases with average 4+ year wait',
      'Debates over "remain in Mexico" and third-country transit rules',
      'Expedited removal vs. due process rights for asylum seekers',
    ],
    commonAsks: [
      { label: 'Speed up processing', ask: 'Hire more immigration judges to reduce the asylum backlog and process cases faster' },
      { label: 'Restrict asylum', ask: 'Tighten asylum eligibility and prevent abuse of the asylum system' },
      { label: 'Protect asylum rights', ask: 'Protect the right to seek asylum as required by U.S. and international law' },
      { label: 'Fund shelters', ask: 'Fund community-based alternatives to detention for asylum-seeking families' },
    ],
    perspectives: [
      { label: 'Protect seekers', points: ['Asylum is a legal right under U.S. and international law', 'People flee genuine persecution', 'Detention costs more than community alternatives'], counterpoint: 'The years-long backlog creates perverse incentives to file claims to gain entry' },
      { label: 'Reform system', points: ['Many claims are not legitimate asylum cases', 'The backlog encourages abuse', 'Other countries should share responsibility'], counterpoint: 'Restricting access can violate international obligations and send genuine refugees back to danger' },
    ],
    sources: [
      { label: 'TRAC — Immigration Court Backlog', url: 'https://trac.syr.edu/phptools/immigration/court_backlog/', type: 'nonpartisan' },
      { label: 'CRS — Asylum Policy', url: 'https://crsreports.congress.gov/product/pdf/R/R45539', type: 'government' },
    ],
  },
  'Visas': {
    summary: 'Visa policy covers work visas (H-1B, H-2A), family visas, student visas, and the green card backlog that can take decades.',
    keyStats: [
      { value: '85,000', label: 'Annual H-1B visa cap (65K + 20K advanced degree)', source: 'USCIS, 2024' },
      { value: '1.8M+', label: 'Employment-based green card backlog', source: 'State Dept, 2024' },
      { value: '371,000', label: 'H-2A agricultural worker visas issued (FY2023)', source: 'State Dept, 2024' },
    ],
    currentEvents: [
      'H-1B visa lottery system and tech industry demand for skilled workers',
      'Agricultural H-2A visa shortages during harvest seasons',
      'Green card backlogs of 10-20+ years for some countries (India: 100+ years for EB-3)',
    ],
    commonAsks: [
      { label: 'Reform H-1B', ask: 'Reform the H-1B visa program to prioritize highest-skilled workers and prevent abuse' },
      { label: 'Clear the backlog', ask: 'Clear the green card backlog so legal immigrants don\'t wait decades' },
      { label: 'Protect American workers', ask: 'Ensure visa programs don\'t displace or undercut American workers\' wages' },
      { label: 'Expand work visas', ask: 'Expand legal work visa programs to meet labor market needs' },
    ],
    perspectives: [
      { label: 'Expand legal paths', points: ['Legal immigration fills critical labor gaps', 'Backlogs punish people who follow the rules', 'Skilled immigrants drive innovation'], counterpoint: 'Expanding visas without wage protections can undercut American workers' },
      { label: 'Protect workers', points: ['H-1B can depress wages for Americans', 'Companies should invest in training Americans', 'Immigration levels should match economic needs'], counterpoint: 'Labor shortages in healthcare, agriculture, and tech are real and growing' },
    ],
    sources: [
      { label: 'USCIS — H-1B Data', url: 'https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub', type: 'government' },
      { label: 'CRS — Immigration Visa Overview', url: 'https://crsreports.congress.gov/product/pdf/R/R45040', type: 'government' },
    ],
  },
  'Refugee Policy': {
    summary: 'Refugee policy sets the annual cap for refugees admitted to the U.S. and determines which populations are prioritized for resettlement.',
    keyStats: [
      { value: '117.3M', label: 'Forcibly displaced people worldwide', source: 'UNHCR, 2024', sourceUrl: 'https://www.unhcr.org/global-trends' },
      { value: '~60,000', label: 'Refugees admitted to U.S. in FY2023', source: 'State Dept, 2024' },
      { value: '18-24 mo', label: 'Average refugee security vetting process', source: 'State Dept' },
    ],
    currentEvents: [
      'Annual refugee admissions cap debates (historically 70-125K, currently lower)',
      'Resettlement of Afghan and Ukrainian refugees',
      'Global refugee crisis with 117+ million displaced people worldwide (UNHCR)',
    ],
    commonAsks: [
      { label: 'Raise the cap', ask: 'Raise the annual refugee admissions cap to meet the global need' },
      { label: 'Lower admissions', ask: 'Reduce refugee admissions to focus resources on Americans in need' },
      { label: 'Prioritize allies', ask: 'Prioritize refugee admissions for those who helped U.S. military and diplomatic missions' },
      { label: 'Fund resettlement', ask: 'Fully fund refugee resettlement programs to help refugees integrate successfully' },
    ],
    perspectives: [
      { label: 'Welcome refugees', points: ['The U.S. has a moral obligation as a world leader', 'Refugees contribute economically within 5 years', 'Vetting is already extremely thorough (18-24 months)'], counterpoint: 'Resettlement costs are real and communities need support to absorb newcomers' },
      { label: 'Limit admissions', points: ['Resources should prioritize citizens first', 'Security vetting needs strengthening', 'Communities need time to absorb newcomers'], counterpoint: 'Refugees undergo the most rigorous vetting of any group entering the U.S.' },
    ],
    sources: [
      { label: 'UNHCR — Global Trends', url: 'https://www.unhcr.org/global-trends', type: 'nonpartisan' },
      { label: 'CRS — U.S. Refugee Admissions', url: 'https://crsreports.congress.gov/product/pdf/RL/RL31269', type: 'government' },
    ],
  },
  // Health subtopics
  'Medicare': {
    summary: 'Medicare provides health insurance for 65+ million Americans over age 65 and those with disabilities. It covers hospital care, doctor visits, and prescriptions.',
    keyStats: [
      { value: '67M+', label: 'Americans enrolled in Medicare', source: 'CMS, 2024', sourceUrl: 'https://www.cms.gov/data-research' },
      { value: '2031', label: 'Projected Hospital Insurance trust fund depletion', source: 'Medicare Trustees Report, 2024' },
      { value: '$1,011B', label: 'Total Medicare spending (FY2023)', source: 'CBO, 2024' },
      { value: '$170.10', label: 'Standard Part B monthly premium (2025)', source: 'CMS, 2024' },
    ],
    currentEvents: [
      'Medicare trust fund projected to face shortfall by 2031 — potential 11% benefit cut without action',
      'Drug price negotiation for Medicare under the Inflation Reduction Act (first 10 drugs)',
      'Debates over expanding Medicare eligibility age or benefits',
    ],
    commonAsks: [
      { label: 'No benefit cuts', ask: 'Oppose any cuts to Medicare benefits for current and future seniors' },
      { label: 'Lower drug costs', ask: 'Expand Medicare\'s ability to negotiate prescription drug prices' },
      { label: 'Shore up funding', ask: 'Ensure the Medicare trust fund remains solvent for future generations' },
      { label: 'Expand coverage', ask: 'Expand Medicare to cover dental, vision, and hearing' },
      { label: 'Medicare buy-in at 60', ask: 'Allow Americans aged 60-64 to buy into Medicare early' },
    ],
    perspectives: [
      { label: 'Expand coverage', points: ['Seniors earned their benefits through a lifetime of payroll taxes', 'Expanding benefits improves quality of life', 'Medicare is more efficient than private insurance (2% admin vs. 12-18%)'], counterpoint: 'Expanding benefits without fixing the trust fund shortfall accelerates insolvency' },
      { label: 'Ensure solvency', points: ['Without reform, the trust fund will run out', 'Means-testing could focus resources on those most in need', 'Competition from private plans can improve choices'], counterpoint: 'Means-testing and privatization undermine the universal nature that makes Medicare work' },
    ],
    sources: [
      { label: 'CMS — Medicare Data', url: 'https://www.cms.gov/data-research', type: 'government' },
      { label: 'CBO — Medicare Topics', url: 'https://www.cbo.gov/topics/health-care/medicare', type: 'government' },
      { label: 'KFF — Medicare Overview', url: 'https://www.kff.org/medicare/', type: 'nonpartisan' },
    ],
  },
  'Medicaid': {
    summary: 'Medicaid provides health coverage for 90+ million low-income Americans, including children, pregnant women, elderly, and disabled individuals.',
    keyStats: [
      { value: '93M+', label: 'Americans enrolled in Medicaid/CHIP', source: 'CMS, 2024', sourceUrl: 'https://www.medicaid.gov/medicaid/program-information/medicaid-and-chip-enrollment-data/index.html' },
      { value: '10', label: 'States that have not expanded Medicaid', source: 'KFF, 2024' },
      { value: '$880B', label: 'Total Medicaid spending (FY2023)', source: 'CBO, 2024' },
    ],
    currentEvents: [
      'States that haven\'t expanded Medicaid under the ACA (10 states remain)',
      'Post-pandemic redeterminations removed 25+ million from coverage — many still eligible',
      'Debates over work requirements for Medicaid eligibility',
    ],
    commonAsks: [
      { label: 'Expand Medicaid', ask: 'Support Medicaid expansion in all states to cover the coverage gap' },
      { label: 'Protect funding', ask: 'Oppose block grants or per-capita caps that would cut Medicaid funding' },
      { label: 'Add work requirements', ask: 'Support work requirements for able-bodied Medicaid recipients' },
      { label: 'Simplify enrollment', ask: 'Streamline Medicaid enrollment to prevent eligible people from losing coverage' },
      { label: 'Continuous eligibility for kids', ask: 'Guarantee continuous Medicaid eligibility for children so they don\'t lose coverage during renewals' },
    ],
    perspectives: [
      { label: 'Expand access', points: ['Expansion states see better health outcomes', 'The coverage gap leaves working people uninsured', 'Rural hospitals depend on Medicaid — over 100 have closed since 2010'], counterpoint: 'Costs are growing unsustainably and strain state budgets' },
      { label: 'Reform program', points: ['States need flexibility to manage their programs', 'Work requirements encourage self-sufficiency', 'Costs are growing unsustainably'], counterpoint: 'In Arkansas, work requirements mainly removed eligible people through paperwork — not by getting people jobs' },
    ],
    sources: [
      { label: 'CMS — Medicaid Enrollment Data', url: 'https://www.medicaid.gov/medicaid/program-information/medicaid-and-chip-enrollment-data/index.html', type: 'government' },
      { label: 'KFF — Medicaid', url: 'https://www.kff.org/medicaid/', type: 'nonpartisan' },
    ],
  },
  'Prescription Drug Costs': {
    summary: 'Americans pay the highest drug prices in the world. Policy debates focus on Medicare negotiation, generic competition, and importation.',
    keyStats: [
      { value: '2-3x', label: 'U.S. drug prices vs. other wealthy nations', source: 'RAND, 2024', sourceUrl: 'https://www.rand.org/pubs/research_briefs/RBA1296-1.html' },
      { value: '$1,432', label: 'Average annual out-of-pocket drug spending per person', source: 'CMS, 2024' },
      { value: '$2,000', label: 'New Medicare Part D out-of-pocket cap (2025)', source: 'CMS, 2024' },
    ],
    currentEvents: [
      'Medicare now negotiating prices on first 10 high-cost drugs (expanding annually)',
      'Insulin price cap of $35/month for Medicare patients; $2,000 annual Part D out-of-pocket cap in 2025',
      'Patent "thickets" that delay generic competition',
    ],
    commonAsks: [
      { label: 'Expand negotiation', ask: 'Expand Medicare drug price negotiation to cover more drugs faster' },
      { label: 'Cap out-of-pocket costs', ask: 'Cap out-of-pocket prescription drug costs for all Americans, not just Medicare' },
      { label: 'Allow importation', ask: 'Allow safe importation of cheaper drugs from Canada and other countries' },
      { label: 'Protect innovation', ask: 'Ensure drug pricing reforms don\'t stifle pharmaceutical research and development' },
      { label: 'Extend $35 insulin cap', ask: 'Extend the $35/month insulin price cap to all Americans, not just Medicare patients' },
      { label: 'Ban pay-for-delay', ask: 'Ban pay-for-delay deals where brand-name drug companies pay to keep generics off the market' },
    ],
    perspectives: [
      { label: 'Lower prices', points: ['Americans pay 2-3x what other countries pay for the same drugs (RAND)', 'Drug companies have record profits', 'High prices force 1 in 4 Americans to ration medications'], counterpoint: 'The U.S. leads the world in drug development partly because of market-based pricing' },
      { label: 'Protect innovation', points: ['Price controls could reduce investment in new cures', 'The U.S. leads the world in drug development', 'Insurance reforms are better than price caps'], counterpoint: 'Drug company R&D spending is a fraction of marketing and stock buyback spending' },
    ],
    sources: [
      { label: 'RAND — Drug Price Comparison', url: 'https://www.rand.org/pubs/research_briefs/RBA1296-1.html', type: 'nonpartisan' },
      { label: 'CBO — Prescription Drugs', url: 'https://www.cbo.gov/topics/health-care/pharmaceutical-costs', type: 'government' },
      { label: 'CMS — Drug Spending Dashboard', url: 'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data', type: 'government' },
    ],
  },
  'Mental Health': {
    summary: 'Mental health policy covers access to treatment, parity with physical health coverage, crisis services, and school counseling.',
    keyStats: [
      { value: '1 in 5', label: 'U.S. adults with a mental health condition', source: 'NIMH, 2024', sourceUrl: 'https://www.nimh.nih.gov/health/statistics' },
      { value: '160M+', label: 'Americans in mental health provider shortage areas', source: 'HRSA, 2024' },
      { value: '49,000+', label: 'U.S. suicide deaths annually', source: 'CDC, 2024', sourceUrl: 'https://www.cdc.gov/suicide/facts/index.html' },
    ],
    currentEvents: [
      '988 Suicide & Crisis Lifeline fielded 5+ million contacts in its first full year',
      'Youth mental health crisis declared a national emergency — teen depression rates doubled in a decade',
      'Mental health parity enforcement — insurers still limit coverage despite federal law',
    ],
    commonAsks: [
      { label: 'Fund mental health', ask: 'Increase federal funding for mental health services and workforce development' },
      { label: 'Enforce parity', ask: 'Enforce mental health parity laws so insurance covers mental health equally to physical health' },
      { label: 'School counselors', ask: 'Fund school-based mental health counselors to support youth mental health' },
      { label: 'Crisis services', ask: 'Expand crisis intervention services including mobile crisis teams' },
      { label: 'Fund 988 Lifeline', ask: 'Fully fund the 988 Suicide & Crisis Lifeline to ensure it can meet demand' },
      { label: 'Expand telehealth', ask: 'Make permanent the expanded telehealth access for mental health services' },
    ],
    perspectives: [
      { label: 'Invest in care', points: ['1 in 5 Americans has a mental health condition', 'Treatment saves money by reducing ER visits and incarceration', '160+ million Americans live in mental health provider shortage areas'], counterpoint: 'Federal mandates can be inflexible — local communities know their needs best' },
      { label: 'Community-based', points: ['Local solutions work better than federal mandates', 'Faith-based and community organizations play a vital role', 'Focus on prevention and resilience'], counterpoint: 'Without federal funding and standards, rural and underserved areas go without' },
    ],
    sources: [
      { label: 'NIMH — Mental Health Statistics', url: 'https://www.nimh.nih.gov/health/statistics', type: 'government' },
      { label: 'CDC — Suicide Data', url: 'https://www.cdc.gov/suicide/facts/index.html', type: 'government' },
      { label: 'KFF — Mental Health', url: 'https://www.kff.org/mental-health/', type: 'nonpartisan' },
    ],
  },
  'Reproductive Health': {
    summary: 'Reproductive health policy covers abortion access, contraception, maternal health, and fertility treatments after the Dobbs decision returned regulation to states.',
    keyStats: [
      { value: '14+', label: 'States with near-total abortion bans post-Dobbs', source: 'Guttmacher Institute, 2024', sourceUrl: 'https://www.guttmacher.org/state-policy' },
      { value: '22.3', label: 'U.S. maternal deaths per 100K births (2x the peer average)', source: 'CDC, 2024', sourceUrl: 'https://www.cdc.gov/maternal-mortality/' },
      { value: '7 of 7', label: 'Abortion-rights ballot measures passed since Dobbs', source: 'Ballotpedia, 2024' },
    ],
    currentEvents: [
      'Post-Dobbs: 14+ states have enacted near-total abortion bans',
      'Ballot measures on abortion rights winning in red and blue states (7 for 7)',
      'Debates over medication abortion access and interstate travel',
    ],
    commonAsks: [
      { label: 'Codify Roe', ask: 'Pass federal legislation to codify the right to abortion access nationwide' },
      { label: 'Protect life', ask: 'Support protections for unborn life and oppose taxpayer funding of abortion' },
      { label: 'Protect contraception', ask: 'Pass the Right to Contraception Act to guarantee access to birth control' },
      { label: 'Maternal health', ask: 'Invest in maternal health to reduce the U.S. maternal mortality rate' },
      { label: 'Extend postpartum Medicaid', ask: 'Extend postpartum Medicaid coverage to 12 months in all states' },
    ],
    perspectives: [
      { label: 'Pro-choice', points: ['Reproductive decisions belong to individuals, not government', 'Bans don\'t stop abortions, they make them unsafe', 'Access to contraception prevents abortions'], counterpoint: 'Many Americans believe life begins at conception and deserves legal protection' },
      { label: 'Pro-life', points: ['Life begins at conception and deserves protection', 'States should set their own policies', 'Alternatives like adoption should be supported'], counterpoint: 'Voters in every state where abortion has been on the ballot — including red states — have chosen access' },
    ],
    sources: [
      { label: 'Guttmacher — Abortion Policy', url: 'https://www.guttmacher.org/state-policy', type: 'nonpartisan' },
      { label: 'CDC — Maternal Mortality', url: 'https://www.cdc.gov/maternal-mortality/', type: 'government' },
    ],
  },
  'ACA/Obamacare': {
    summary: 'The Affordable Care Act provides insurance marketplace subsidies, Medicaid expansion, pre-existing condition protections, and young adult coverage to age 26.',
    keyStats: [
      { value: '21.3M', label: 'ACA marketplace enrollees (record, 2024)', source: 'CMS, 2024', sourceUrl: 'https://www.cms.gov/newsroom/fact-sheets/marketplace-2024-open-enrollment-period-report' },
      { value: '133M', label: 'Americans with pre-existing conditions protected', source: 'HHS, 2021' },
      { value: '$800+', label: 'Average annual premium savings from enhanced subsidies', source: 'CBO, 2023' },
    ],
    currentEvents: [
      'Enhanced ACA subsidies set to expire — without extension, premiums rise $800+/year for millions',
      'Record enrollment of 21+ million through the marketplace',
      'Ongoing debates over repeal, reform, or expansion',
    ],
    commonAsks: [
      { label: 'Extend subsidies', ask: 'Make the enhanced ACA premium subsidies permanent so millions don\'t lose affordable coverage' },
      { label: 'Protect pre-existing', ask: 'Protect the pre-existing condition coverage guarantee under the ACA' },
      { label: 'Replace with better', ask: 'Replace the ACA with a system that lowers costs and increases choice' },
      { label: 'Fix the gaps', ask: 'Close the Medicaid coverage gap in states that haven\'t expanded' },
      { label: 'Add a public option', ask: 'Create a public health insurance option to compete with private plans and lower costs' },
    ],
    perspectives: [
      { label: 'Keep and strengthen', points: ['21+ million Americans rely on marketplace coverage', 'Pre-existing condition protections are supported by 80%+ of Americans', 'Subsidies keep coverage affordable for working families'], counterpoint: 'Premiums and deductibles remain too high for many middle-income families' },
      { label: 'Reform the system', points: ['Premiums and deductibles are still too high for many', 'Competition should drive down costs', 'One-size-fits-all doesn\'t work for every situation'], counterpoint: 'Every Republican repeal attempt failed to protect pre-existing conditions or match enrollment' },
    ],
    sources: [
      { label: 'CMS — ACA Enrollment Data', url: 'https://www.cms.gov/newsroom/fact-sheets/marketplace-2024-open-enrollment-period-report', type: 'government' },
      { label: 'KFF — ACA Overview', url: 'https://www.kff.org/health-reform/', type: 'nonpartisan' },
    ],
  },
  // Crime subtopics
  'Gun Violence': {
    summary: 'Gun policy debates center on background checks, assault weapons, red flag laws, Second Amendment rights, and community violence intervention.',
    keyStats: [
      { value: '48,000+', label: 'Annual U.S. gun deaths (including suicide)', source: 'CDC, 2024', sourceUrl: 'https://www.cdc.gov/nchs/fastats/injury.htm' },
      { value: '120.5', label: 'Civilian firearms per 100 people (highest in world)', source: 'Small Arms Survey, 2024' },
      { value: '83%', label: 'Americans who support universal background checks', source: 'Pew Research, 2023' },
      { value: '21', label: 'States with red flag laws', source: 'Everytown, 2024' },
    ],
    currentEvents: [
      'Bipartisan Safer Communities Act passed in 2022 (first gun law in 30 years)',
      'State-level red flag laws expanding — now in 21 states + DC',
      'Over 48,000 annual gun deaths; everyday community violence far exceeds mass shootings',
    ],
    commonAsks: [
      { label: 'Universal background checks', ask: 'Pass universal background checks for all gun sales including private and online sales' },
      { label: 'Assault weapons ban', ask: 'Reinstate the federal assault weapons ban' },
      { label: 'Red flag laws', ask: 'Support federal incentives for state red flag laws that temporarily remove guns from people in crisis' },
      { label: 'Protect 2nd Amendment', ask: 'Oppose new gun restrictions that infringe on law-abiding citizens\' Second Amendment rights' },
      { label: 'Fund violence intervention', ask: 'Fund community violence intervention programs that reduce gun violence in the most affected neighborhoods' },
      { label: 'Raise purchase age to 21', ask: 'Raise the minimum age to purchase semi-automatic rifles to 21' },
    ],
    perspectives: [
      { label: 'More regulation', points: ['83% of Americans support universal background checks', 'The U.S. has 25x the gun homicide rate of peer nations', 'Red flag laws have helped prevent mass shootings'], counterpoint: 'The Second Amendment protects an individual right affirmed by the Supreme Court' },
      { label: 'Protect rights', points: ['The Second Amendment is a fundamental right', 'New laws won\'t stop criminals who ignore existing ones', 'Focus on mental health and enforcement, not restrictions'], counterpoint: 'The U.S. is the only wealthy nation where gun deaths are a leading cause of death for children' },
    ],
    sources: [
      { label: 'CDC WONDER — Firearm Mortality', url: 'https://wonder.cdc.gov/', type: 'government' },
      { label: 'CRS — Gun Control Overview', url: 'https://crsreports.congress.gov/product/pdf/R/R45941', type: 'government' },
      { label: 'RAND — Gun Policy Research', url: 'https://www.rand.org/research/gun-policy.html', type: 'nonpartisan' },
    ],
    orgs: [
      { name: 'Everytown for Gun Safety', url: 'https://www.everytown.org/' },
      { name: 'Giffords Law Center', url: 'https://giffords.org/' },
      { name: 'National Rifle Association — ILA', url: 'https://www.nraila.org/' },
    ],
  },
  'Police Reform': {
    summary: 'Police reform policy covers use of force standards, accountability, qualified immunity, training, and community policing models.',
    keyStats: [
      { value: '~1,200', label: 'People killed by police annually in the U.S.', source: 'Mapping Police Violence, 2024', sourceUrl: 'https://mappingpoliceviolence.us/' },
      { value: '3x', label: 'Rate at which Black Americans are killed by police vs. white Americans', source: 'Mapping Police Violence, 2024' },
      { value: '~700K', label: 'Full-time sworn officers nationwide', source: 'BJS, 2024' },
    ],
    currentEvents: [
      'Federal police reform legislation has stalled in Congress',
      'Cities implementing consent decrees and oversight boards',
      'Debates over qualified immunity that shields officers from lawsuits',
    ],
    commonAsks: [
      { label: 'End qualified immunity', ask: 'Reform qualified immunity so officers can be held accountable for misconduct' },
      { label: 'Fund training', ask: 'Increase funding for de-escalation training and mental health crisis response' },
      { label: 'Support officers', ask: 'Increase police funding and support to help officers do their jobs safely' },
      { label: 'Community policing', ask: 'Invest in community policing programs that build trust between officers and neighborhoods' },
      { label: 'Pass the George Floyd Act', ask: 'Pass the George Floyd Justice in Policing Act to set national standards for use of force and accountability' },
    ],
    perspectives: [
      { label: 'Accountability focus', points: ['Accountability builds public trust', 'De-escalation training saves lives on both sides', 'Mental health calls may need different responders'], counterpoint: 'Officers face split-second life-or-death decisions that are easy to second-guess' },
      { label: 'Support officers', points: ['Officers face dangerous situations daily', 'Communities are safer with well-supported police', 'Better pay and training attract better officers'], counterpoint: 'Black Americans are killed by police at 3x the rate of white Americans' },
    ],
    sources: [
      { label: 'Mapping Police Violence', url: 'https://mappingpoliceviolence.us/', type: 'nonpartisan' },
      { label: 'CRS — Police Reform', url: 'https://crsreports.congress.gov/product/pdf/R/R46843', type: 'government' },
    ],
  },
  'Criminal Justice Reform': {
    summary: 'Criminal justice reform covers sentencing, incarceration, private prisons, re-entry programs, and racial disparities in the system.',
    keyStats: [
      { value: '1.9M', label: 'People incarcerated in the U.S. (highest in world)', source: 'BJS, 2024', sourceUrl: 'https://bjs.ojp.gov/topics/corrections' },
      { value: '5x', label: 'U.S. incarceration rate vs. global average', source: 'World Prison Brief, 2024' },
      { value: '44%', label: 'Released prisoners rearrested within 1 year', source: 'BJS, 2024' },
    ],
    currentEvents: [
      'FIRST STEP Act implementation (bipartisan sentencing reform)',
      'States reducing mandatory minimums and expanding parole',
      'Record numbers of expungement and clemency petitions',
    ],
    commonAsks: [
      { label: 'End mandatory minimums', ask: 'Reform mandatory minimum sentencing to give judges more discretion' },
      { label: 'Fund re-entry', ask: 'Invest in re-entry programs (housing, jobs, treatment) to reduce recidivism' },
      { label: 'End private prisons', ask: 'Phase out federal contracts with private prisons' },
      { label: 'Tough on crime', ask: 'Oppose early release programs and maintain strong sentencing to keep communities safe' },
      { label: 'Expand record expungement', ask: 'Expand federal record expungement and sealing for non-violent offenses to help people find jobs' },
    ],
    perspectives: [
      { label: 'Reform system', points: ['The U.S. incarcerates more people than any country — 1.9M people', 'Rehabilitation reduces reoffending', 'Racial disparities in sentencing need addressing'], counterpoint: 'Violent crime is real — victims deserve justice and community safety matters' },
      { label: 'Public safety', points: ['Violent offenders should serve full sentences', 'Victims deserve justice', 'Reform shouldn\'t come at the cost of safety'], counterpoint: '44% of released prisoners are rearrested within a year, showing incarceration alone doesn\'t prevent crime' },
    ],
    sources: [
      { label: 'BJS — Corrections Statistics', url: 'https://bjs.ojp.gov/topics/corrections', type: 'government' },
      { label: 'Council on Criminal Justice', url: 'https://counciloncj.org/research/', type: 'nonpartisan' },
    ],
  },
  'Drug Policy': {
    summary: 'Drug policy covers marijuana legalization, opioid crisis response, drug scheduling, harm reduction, and treatment vs. enforcement approaches.',
    keyStats: [
      { value: '107,000+', label: 'Annual overdose deaths (primarily fentanyl)', source: 'CDC, 2024', sourceUrl: 'https://www.cdc.gov/drugoverdose/' },
      { value: '24+', label: 'States with legalized recreational marijuana', source: 'NCSL, 2024' },
      { value: '$40B+', label: 'Annual legal cannabis market', source: 'MJBizDaily, 2024' },
    ],
    currentEvents: [
      'Marijuana legalized in 24+ states but remains federally illegal (Schedule I)',
      'Opioid crisis: 107,000+ overdose deaths in 2023, fentanyl driving increase',
      'Harm reduction programs (naloxone access, safe injection sites) expanding',
    ],
    commonAsks: [
      { label: 'Legalize marijuana', ask: 'Deschedule marijuana at the federal level and allow states to regulate it' },
      { label: 'Fight opioid crisis', ask: 'Increase funding for opioid treatment, naloxone distribution, and fentanyl interdiction' },
      { label: 'Treatment over jail', ask: 'Redirect drug enforcement funding toward treatment and harm reduction programs' },
      { label: 'Keep enforcement', ask: 'Maintain strong drug enforcement to keep dangerous substances off the streets' },
      { label: 'SAFE Banking for cannabis', ask: 'Pass the SAFE Banking Act so legal cannabis businesses can access banking services' },
    ],
    perspectives: [
      { label: 'Treatment approach', points: ['Addiction is a health issue, not a criminal one', 'Treatment is cheaper and more effective than incarceration', 'Harm reduction saves lives without enabling use'], counterpoint: 'Fentanyl trafficking is killing 100,000+ Americans a year and requires aggressive enforcement' },
      { label: 'Enforcement approach', points: ['Drug trafficking fuels violence', 'Legalization sends wrong message to youth', 'Fentanyl requires aggressive interdiction'], counterpoint: 'The War on Drugs cost trillions over 50 years yet overdose deaths are at record highs' },
    ],
    sources: [
      { label: 'CDC — Drug Overdose Data', url: 'https://www.cdc.gov/drugoverdose/', type: 'government' },
      { label: 'CRS — Marijuana Policy', url: 'https://crsreports.congress.gov/product/pdf/R/R44782', type: 'government' },
    ],
  },
  // Education subtopics
  'Student Loans': {
    summary: 'Americans owe $1.77+ trillion in student loan debt. Policy debates focus on forgiveness, income-driven repayment, and the cost of college itself.',
    keyStats: [
      { value: '$1.77T', label: 'Total U.S. student loan debt', source: 'Federal Reserve, 2024', sourceUrl: 'https://www.federalreserve.gov/releases/g19/current/' },
      { value: '43M', label: 'Americans with federal student loans', source: 'Dept. of Education, 2024', sourceUrl: 'https://studentaid.gov/data-center/student/portfolio' },
      { value: '$37,850', label: 'Average student loan debt per borrower', source: 'Federal Student Aid, 2024' },
    ],
    currentEvents: [
      'Supreme Court blocked broad forgiveness; targeted relief programs continue',
      'SAVE Plan (income-driven repayment) enrolled millions, faces legal challenges',
      'Total student debt continues to grow — $1.77T across 43 million borrowers',
    ],
    commonAsks: [
      { label: 'Forgive student debt', ask: 'Support broad student loan forgiveness to relieve the burden on borrowers' },
      { label: 'Fix income-driven repayment', ask: 'Protect and expand income-driven repayment plans so payments are affordable' },
      { label: 'No forgiveness', ask: 'Oppose blanket student loan forgiveness that\'s unfair to those who already paid' },
      { label: 'Lower college costs', ask: 'Address the root cause by making college more affordable in the first place' },
      { label: 'Protect PSLF', ask: 'Protect and strengthen Public Service Loan Forgiveness for teachers, nurses, and public servants' },
    ],
    perspectives: [
      { label: 'Forgive debt', points: ['Debt blocks homebuying, starting families, and economic growth', 'Many were misled about the value of their degrees', 'The government profited billions from student loans'], counterpoint: 'Forgiveness costs ~$400B+ and doesn\'t fix the root cause of rising tuition' },
      { label: 'Personal responsibility', points: ['People chose to borrow and should repay', 'Forgiveness doesn\'t fix the cost problem', 'It\'s unfair to non-college workers and those who already repaid'], counterpoint: 'Tuition tripled in 20 years while state funding per student fell — 18-year-olds didn\'t create this system' },
    ],
    sources: [
      { label: 'Federal Student Aid — Data Center', url: 'https://studentaid.gov/data-center/student/portfolio', type: 'government' },
      { label: 'CBO — Student Loan Analysis', url: 'https://www.cbo.gov/topics/education', type: 'government' },
      { label: 'Brookings — Student Loans', url: 'https://www.brookings.edu/topic/student-loans/', type: 'nonpartisan' },
    ],
    orgs: [
      { name: 'Student Borrower Protection Center', url: 'https://protectborrowers.org/' },
      { name: 'Institute for College Access & Success', url: 'https://ticas.org/' },
    ],
  },
  'K-12 Education': {
    summary: 'K-12 policy covers school funding, teacher pay, curriculum standards, school safety, and the achievement gap between affluent and low-income districts.',
    keyStats: [
      { value: '50M+', label: 'Students in U.S. public schools', source: 'NCES, 2024', sourceUrl: 'https://nces.ed.gov/fastfacts/' },
      { value: '$59K', label: 'Average teacher salary (below many college grads)', source: 'NEA, 2024' },
      { value: '300,000+', label: 'Teacher and staff vacancies', source: 'Dept. of Education, 2024' },
    ],
    currentEvents: [
      'Pandemic learning loss recovery — average student lost half a year of math progress',
      'Teacher shortages reaching crisis levels: 300,000+ vacancies',
      'Book bans and curriculum restrictions in multiple states',
    ],
    commonAsks: [
      { label: 'Fund public schools', ask: 'Increase Title I funding for schools in low-income areas' },
      { label: 'Raise teacher pay', ask: 'Support federal incentives to raise teacher salaries and reduce shortages' },
      { label: 'School choice', ask: 'Support school choice options including charter schools and vouchers for parents' },
      { label: 'School safety', ask: 'Invest in school safety measures including counselors, not just hardening' },
      { label: 'Universal free school meals', ask: 'Make free school breakfast and lunch universal for all students regardless of income' },
      { label: 'Support teachers', ask: 'Fund classroom supply stipends and loan forgiveness to recruit and retain teachers' },
    ],
    perspectives: [
      { label: 'Invest in public ed', points: ['Funding gaps create inequality of opportunity', 'Teachers are the #1 factor in student success but average pay is $59K', 'Public schools serve every child'], counterpoint: 'Money alone hasn\'t closed achievement gaps — accountability and innovation matter too' },
      { label: 'Choice & innovation', points: ['Parents know best what works for their child', 'Competition drives improvement', 'One approach doesn\'t fit all learners'], counterpoint: 'Voucher programs divert funds from public schools that serve 90% of students' },
    ],
    sources: [
      { label: 'NCES — Fast Facts', url: 'https://nces.ed.gov/fastfacts/', type: 'government' },
      { label: 'Education Trust — Data Tools', url: 'https://edtrust.org/data-tools/', type: 'nonpartisan' },
    ],
  },
  'School Choice': {
    summary: 'School choice includes vouchers, education savings accounts, charter schools, and open enrollment policies that let families choose alternatives to assigned public schools.',
    keyStats: [
      { value: '7,800+', label: 'Charter schools serving 3.7M students', source: 'NCES, 2024' },
      { value: '30+', label: 'States with some form of school choice program', source: 'EdChoice, 2024' },
      { value: '90%', label: 'Students attend traditional public schools', source: 'NCES, 2024' },
    ],
    currentEvents: [
      'Universal school choice/voucher programs expanding in multiple states',
      'Debates over whether public money should fund private and religious schools',
      'Charter school authorization and accountability standards',
    ],
    commonAsks: [
      { label: 'Support vouchers', ask: 'Support school voucher programs that give parents the freedom to choose the best school for their child' },
      { label: 'Protect public schools', ask: 'Oppose voucher programs that divert funding from public schools' },
      { label: 'Charter accountability', ask: 'Strengthen charter school oversight and accountability while preserving innovation' },
      { label: 'Fund all students', ask: 'Ensure funding follows the student regardless of which school they attend' },
    ],
    perspectives: [
      { label: 'Support choice', points: ['Every family deserves the right to choose', 'Competition improves all schools', 'Low-income families deserve the options wealthy families already have'], counterpoint: '90% of students attend public schools — diverting funds affects millions' },
      { label: 'Protect public schools', points: ['Vouchers drain funding from schools that serve most kids', 'Private schools can reject students; public schools can\'t', 'Public oversight ensures accountability'], counterpoint: 'Families stuck in failing schools shouldn\'t have to wait for systemic reform' },
    ],
    sources: [
      { label: 'NCES — School Choice Data', url: 'https://nces.ed.gov/fastfacts/display.asp?id=30', type: 'government' },
      { label: 'EdChoice — School Choice Research', url: 'https://www.edchoice.org/', type: 'nonpartisan' },
    ],
  },
  // Environment subtopics
  'Climate Change': {
    summary: 'Climate change policy covers emissions reduction targets, clean energy transition, carbon pricing, and adaptation to extreme weather events.',
    keyStats: [
      { value: '$370B+', label: 'IRA clean energy investment', source: 'CBO, 2023' },
      { value: '$165B', label: 'U.S. weather disaster costs in 2023 alone', source: 'NOAA, 2024', sourceUrl: 'https://www.ncei.noaa.gov/access/billions/' },
      { value: '1.2°C', label: 'Global warming above pre-industrial levels', source: 'NASA, 2024' },
    ],
    currentEvents: [
      'Inflation Reduction Act investing $370B+ in clean energy',
      'Record heat waves, wildfires, and hurricanes — $165B in U.S. disaster costs in 2023 (NOAA)',
      'Debates over phasing out fossil fuels vs. "all of the above" energy',
    ],
    commonAsks: [
      { label: 'Aggressive climate action', ask: 'Set binding emissions reduction targets and accelerate the clean energy transition' },
      { label: 'Protect energy jobs', ask: 'Ensure the clean energy transition doesn\'t leave fossil fuel workers behind' },
      { label: 'Carbon pricing', ask: 'Support a carbon tax or cap-and-trade system to make polluters pay' },
      { label: 'No new regulations', ask: 'Oppose costly climate regulations that hurt the economy and raise energy prices' },
      { label: 'Environmental justice', ask: 'Prioritize climate investments in communities disproportionately affected by pollution' },
      { label: 'Climate corps', ask: 'Fund a Civilian Climate Corps to create jobs in conservation and clean energy' },
    ],
    perspectives: [
      { label: 'Aggressive action', points: ['The science is clear and the window is closing', 'Clean energy is now cheaper than fossil fuels in most markets', 'Climate disasters cost $165B in 2023 alone'], counterpoint: 'Rapid transition without alternatives threatens energy reliability and jobs' },
      { label: 'Gradual transition', points: ['Rapid transition threatens energy reliability', 'The U.S. can\'t solve climate change alone (14% of global emissions)', 'Innovation, not regulation, is the answer'], counterpoint: 'Each year of delay locks in decades of higher temperatures and costs' },
    ],
    sources: [
      { label: 'NOAA — Billion-Dollar Disasters', url: 'https://www.ncei.noaa.gov/access/billions/', type: 'government' },
      { label: 'EPA — Climate Change Data', url: 'https://www.epa.gov/climate-indicators', type: 'government' },
      { label: 'CBO — Climate and Energy', url: 'https://www.cbo.gov/topics/climate-and-environment', type: 'government' },
    ],
  },
  'Renewable Energy': {
    summary: 'Renewable energy policy covers solar, wind, and battery storage incentives, grid modernization, and the transition from fossil fuels.',
    keyStats: [
      { value: '23%', label: 'U.S. electricity from renewables (2023)', source: 'EIA, 2024', sourceUrl: 'https://www.eia.gov/electricity/data.php' },
      { value: '334,000+', label: 'Clean energy jobs created by IRA in 2 years', source: 'E2, 2024' },
      { value: '$0.03/kWh', label: 'Average cost of new utility-scale solar (cheapest source)', source: 'Lazard LCOE, 2024' },
    ],
    currentEvents: [
      'Solar and wind are now the cheapest new electricity sources — $0.03/kWh for utility solar',
      'IRA tax credits driving massive clean energy manufacturing investment — 334,000+ jobs',
      'Grid capacity and transmission lines are bottlenecks for new renewables',
    ],
    commonAsks: [
      { label: 'Extend tax credits', ask: 'Extend clean energy tax credits to accelerate solar, wind, and battery deployment' },
      { label: 'Modernize the grid', ask: 'Invest in grid modernization and transmission to handle more renewable energy' },
      { label: 'All-of-the-above energy', ask: 'Support all energy sources including fossil fuels to ensure affordable, reliable power' },
      { label: 'Energy independence', ask: 'Invest in domestic clean energy manufacturing to reduce dependence on foreign supply chains' },
      { label: 'Community solar', ask: 'Expand community solar programs so renters and low-income families can access clean energy savings' },
      { label: 'EV charging infrastructure', ask: 'Accelerate deployment of EV charging stations especially in rural and underserved areas' },
    ],
    perspectives: [
      { label: 'Go renewable', points: ['Renewables create more jobs per dollar than fossil fuels', 'Energy independence through domestic solar and wind', 'New solar is the cheapest electricity ever generated'], counterpoint: 'Solar and wind are intermittent — battery storage isn\'t yet sufficient for grid-scale reliability' },
      { label: 'Reliable energy', points: ['Wind and solar are intermittent', 'Fossil fuels provide baseload reliability', 'Transition needs to be gradual to avoid grid failures'], counterpoint: 'New renewables are already cheaper than keeping existing coal plants running' },
    ],
    sources: [
      { label: 'EIA — Electricity Data', url: 'https://www.eia.gov/electricity/data.php', type: 'government' },
      { label: 'Lazard — LCOE Analysis', url: 'https://www.lazard.com/research-insights/levelized-cost-of-energyplus/', type: 'nonpartisan' },
    ],
  },
  // Housing subtopics
  'Affordable Housing': {
    summary: 'Over 50% of renters are "cost-burdened," spending 30%+ of income on housing. The U.S. is short 4-7 million affordable homes.',
    keyStats: [
      { value: '50%+', label: 'Renters spending 30%+ of income on housing', source: 'Harvard JCHS, 2024', sourceUrl: 'https://www.jchs.harvard.edu/state-nations-housing-2024' },
      { value: '4-7M', label: 'Affordable housing unit shortfall', source: 'National Low Income Housing Coalition, 2024' },
      { value: '75%', label: 'Eligible families turned away from Section 8 (underfunded)', source: 'CBPP, 2024' },
    ],
    currentEvents: [
      'National housing shortage of 4-7 million units driving up costs',
      'NIMBY vs. YIMBY debates over zoning reform and new construction',
      'Low-Income Housing Tax Credit (LIHTC) expansion proposals',
    ],
    commonAsks: [
      { label: 'Build more', ask: 'Support zoning reform and incentives to build more affordable housing' },
      { label: 'Expand vouchers', ask: 'Expand Section 8 housing vouchers so everyone eligible can receive one (75% are turned away)' },
      { label: 'Rent control', ask: 'Support federal rent stabilization measures to prevent extreme rent increases' },
      { label: 'Market approach', ask: 'Remove regulations that increase building costs and let the market increase supply' },
      { label: 'Down payment assistance', ask: 'Fund first-time homebuyer down payment assistance programs to help families build wealth' },
      { label: 'Expand LIHTC', ask: 'Expand the Low-Income Housing Tax Credit to build more affordable housing units' },
    ],
    perspectives: [
      { label: 'Public investment', points: ['The market alone won\'t solve the affordability crisis', '75% of eligible families are turned away from housing vouchers', 'Zoning reform is needed at every level'], counterpoint: 'Subsidies alone won\'t fix the problem — we need more supply' },
      { label: 'Supply-side reform', points: ['Over-regulation drives up building costs', 'Rent control discourages new construction', 'More supply naturally lowers prices'], counterpoint: 'New market-rate housing alone won\'t serve those earning below 30% of area median income' },
    ],
    sources: [
      { label: 'Harvard JCHS — State of Housing', url: 'https://www.jchs.harvard.edu/state-nations-housing-2024', type: 'academic' },
      { label: 'NLIHC — Housing Data', url: 'https://nlihc.org/housing-needs-by-state', type: 'nonpartisan' },
    ],
  },
  'Homelessness': {
    summary: 'Over 650,000 Americans are homeless on any given night. Causes include housing costs, mental illness, addiction, and domestic violence.',
    keyStats: [
      { value: '653,000+', label: 'People experiencing homelessness on a given night', source: 'HUD PIT Count, 2024', sourceUrl: 'https://www.huduser.gov/portal/datasets/ahar.html' },
      { value: '12%', label: 'Increase in homelessness in 2023 (largest ever recorded)', source: 'HUD, 2024' },
      { value: '35,574', label: 'Veterans experiencing homelessness', source: 'HUD, 2024' },
    ],
    currentEvents: [
      'Supreme Court ruling allowing cities to enforce camping bans',
      'Housing First programs showing success in reducing chronic homelessness',
      'Veteran homelessness declining but overall numbers rose 12% in 2023',
    ],
    commonAsks: [
      { label: 'Housing First', ask: 'Fund Housing First programs that provide stable housing before requiring treatment' },
      { label: 'Mental health services', ask: 'Expand mental health and addiction treatment services for homeless individuals' },
      { label: 'Clear encampments', ask: 'Support clearing homeless encampments and directing people to shelter and services' },
      { label: 'Prevention', ask: 'Invest in homelessness prevention — eviction diversion and emergency rental assistance' },
      { label: 'Rapid rehousing', ask: 'Fund rapid rehousing programs that quickly move people from shelters into permanent housing' },
      { label: 'End veteran homelessness', ask: 'Fully fund HUD-VASH vouchers and supportive services to end veteran homelessness' },
    ],
    perspectives: [
      { label: 'Housing First', points: ['You can\'t treat mental illness or addiction without stable housing', 'Housing First costs less than shelter cycling, ER visits, and incarceration', 'Criminalizing homelessness doesn\'t solve it'], counterpoint: 'Housing without treatment requirements can leave people in crisis' },
      { label: 'Accountability', points: ['Encampments are unsafe for residents and homeless individuals', 'Treatment should be a requirement, not optional', 'Enabling without accountability doesn\'t help'], counterpoint: 'Clearing encampments without alternatives just moves people from block to block' },
    ],
    sources: [
      { label: 'HUD — Annual Homeless Assessment', url: 'https://www.huduser.gov/portal/datasets/ahar.html', type: 'government' },
      { label: 'National Alliance to End Homelessness', url: 'https://endhomelessness.org/homelessness-in-america/', type: 'nonpartisan' },
    ],
  },
  // Taxation subtopics
  'Income Tax': {
    summary: 'Federal income tax brackets range from 10% to 37%. Debates center on rates, deductions, credits, and whether the wealthy pay enough.',
    keyStats: [
      { value: '$4.4T', label: 'TCJA extension cost over 10 years', source: 'CBO, 2024', sourceUrl: 'https://www.cbo.gov/topics/taxes' },
      { value: '8.2%', label: 'Effective tax rate of the top 400 earners', source: 'White House CEA, 2024' },
      { value: '$2.3T', label: 'Annual federal income tax revenue', source: 'Treasury, 2024' },
    ],
    currentEvents: [
      '2017 Tax Cuts and Jobs Act individual provisions expire after 2025 — $4.4T cost to extend',
      'If not extended, taxes will increase for most Americans',
      'Debates over extending all cuts vs. only for lower/middle income',
    ],
    commonAsks: [
      { label: 'Extend all cuts', ask: 'Extend the 2017 tax cuts for all income levels to prevent tax increases' },
      { label: 'Only extend for middle class', ask: 'Extend tax cuts only for those making under $400,000 and let top rates rise' },
      { label: 'Simplify the code', ask: 'Simplify the tax code to reduce complexity and close loopholes' },
      { label: 'Billionaire minimum tax', ask: 'Enact a minimum tax on billionaires\' unrealized gains' },
      { label: 'Expand EITC', ask: 'Expand the Earned Income Tax Credit to put more money in working families\' pockets' },
    ],
    perspectives: [
      { label: 'Lower taxes', points: ['Tax cuts boost the economy and job creation', 'People should keep more of their earnings', 'High taxes drive investment offshore'], counterpoint: 'The 2017 cuts added $1.9T to the deficit while top earners pay an 8% effective rate' },
      { label: 'Fair share', points: ['The wealthiest 400 Americans pay an ~8% effective rate', 'Revenue is needed for essential services', 'The deficit exploded after the 2017 cuts'], counterpoint: 'The top 1% already pay 46% of all federal income taxes' },
    ],
    sources: [
      { label: 'CBO — Tax Topics', url: 'https://www.cbo.gov/topics/taxes', type: 'government' },
      { label: 'Tax Policy Center — Data', url: 'https://www.taxpolicycenter.org/statistics', type: 'nonpartisan' },
      { label: 'Tax Foundation — Data', url: 'https://taxfoundation.org/data/', type: 'nonpartisan' },
    ],
  },
  'Corporate Tax': {
    summary: 'The U.S. corporate tax rate was cut from 35% to 21% in 2017. Some corporations pay an effective rate far below 21% through deductions and offshoring.',
    keyStats: [
      { value: '21%', label: 'U.S. statutory corporate tax rate (was 35%)', source: 'IRS, 2024' },
      { value: '55', label: 'Fortune 500 firms that paid $0 federal tax in at least one recent year', source: 'ITEP, 2024' },
      { value: '15%', label: 'Global minimum corporate tax rate (agreed by 140 countries)', source: 'OECD, 2024' },
    ],
    currentEvents: [
      'Global minimum tax of 15% being implemented internationally',
      'Some profitable corporations pay $0 in federal income tax',
      'Debates over raising the rate to 25-28% vs. keeping it competitive',
    ],
    commonAsks: [
      { label: 'Raise corporate tax', ask: 'Raise the corporate tax rate to 28% to fund public investments' },
      { label: 'Close loopholes', ask: 'Close corporate tax loopholes that allow profitable companies to pay nothing' },
      { label: 'Keep rate competitive', ask: 'Maintain the current corporate tax rate to keep American businesses competitive globally' },
      { label: 'Minimum book tax', ask: 'Enforce the corporate minimum tax so no billion-dollar company pays zero' },
      { label: 'Tax stock buybacks', ask: 'Increase the tax on corporate stock buybacks to encourage reinvestment in workers and R&D' },
    ],
    perspectives: [
      { label: 'Raise & close loopholes', points: ['55 major corporations paid $0 in federal tax in at least one recent year', 'Revenue can fund infrastructure and education', 'The 2017 cut primarily benefited shareholders (stock buybacks surged)'], counterpoint: 'Higher rates could push businesses to countries with lower taxes' },
      { label: 'Stay competitive', points: ['High rates drive businesses overseas', 'Corporate taxes are passed to workers and consumers', 'Investment creates jobs'], counterpoint: 'After the 2017 cut, stock buybacks surged but business investment barely changed' },
    ],
    sources: [
      { label: 'ITEP — Corporate Tax Data', url: 'https://itep.org/corporate-tax-avoidance-under-the-tax-cuts-and-jobs-act/', type: 'nonpartisan' },
      { label: 'CBO — Corporate Tax Revenue', url: 'https://www.cbo.gov/topics/taxes', type: 'government' },
    ],
  },
  // Economy subtopics
  'Inflation': {
    summary: 'Inflation measures how fast prices rise. After hitting 40-year highs in 2022, it has moderated but grocery, housing, and insurance costs remain elevated.',
    keyStats: [
      { value: '~20%', label: 'Cumulative price increase since 2020', source: 'BLS CPI, 2024', sourceUrl: 'https://www.bls.gov/cpi/' },
      { value: '3.0%', label: 'Annual CPI inflation rate (down from 9.1% peak)', source: 'BLS, 2024' },
      { value: '25%+', label: 'Grocery price increase since 2020', source: 'USDA ERS, 2024' },
    ],
    currentEvents: [
      'Inflation has come down from 9.1% to ~3% but cumulative prices are up ~20%',
      'Housing and car insurance costs driving remaining inflation',
      'Federal Reserve interest rate decisions affecting mortgages and loans',
    ],
    commonAsks: [
      { label: 'Lower grocery costs', ask: 'Take action to address food price gouging and bring down grocery costs' },
      { label: 'Cut spending', ask: 'Reduce federal spending to stop fueling inflation' },
      { label: 'Anti-price-gouging', ask: 'Pass anti-price-gouging legislation to prevent corporations from exploiting consumers' },
      { label: 'Energy costs', ask: 'Increase domestic energy production to bring down gas and heating costs' },
      { label: 'Strengthen antitrust', ask: 'Strengthen antitrust enforcement to increase competition and bring down prices' },
      { label: 'Cap credit card rates', ask: 'Cap credit card interest rates so families aren\'t crushed by high-interest debt on essentials' },
    ],
    perspectives: [
      { label: 'Structural issues', points: ['Corporate profit margins hit record highs during the inflation spike', 'Supply chain investments prevent future spikes', 'Workers need wages that keep up with prices'], counterpoint: 'Trillions in government spending in 2020-21 clearly contributed to demand-side inflation' },
      { label: 'Fiscal discipline', points: ['Government spending fuels demand-side inflation', 'The Fed needs to stay the course', 'Regulations add costs that get passed to consumers'], counterpoint: 'Supply shocks and corporate pricing power drove most of the spike — not just spending' },
    ],
    sources: [
      { label: 'BLS — Consumer Price Index', url: 'https://www.bls.gov/cpi/', type: 'government' },
      { label: 'USDA ERS — Food Prices', url: 'https://www.ers.usda.gov/data-products/food-price-outlook/', type: 'government' },
    ],
  },
  // Social welfare subtopics
  'Social Security': {
    summary: 'Social Security provides retirement, disability, and survivor benefits to 67+ million Americans. The trust fund faces a projected shortfall by 2033.',
    keyStats: [
      { value: '67M+', label: 'Americans receiving Social Security benefits', source: 'SSA, 2024', sourceUrl: 'https://www.ssa.gov/policy/docs/quickfacts/stat_snapshot/' },
      { value: '2033', label: 'Projected trust fund depletion year', source: 'SSA Trustees Report, 2024' },
      { value: '23%', label: 'Automatic benefit cut if Congress doesn\'t act by 2033', source: 'CBO, 2024' },
      { value: '$1,907', label: 'Average monthly retirement benefit', source: 'SSA, 2024' },
    ],
    currentEvents: [
      'Trust fund projected to be depleted by 2033 — benefits would be cut 23% automatically',
      'Debates over raising the payroll tax cap ($168,600 in 2024), retirement age, or benefit formula',
      'Cost-of-living adjustments (COLA) not keeping up with seniors\' actual costs',
    ],
    commonAsks: [
      { label: 'No cuts to benefits', ask: 'Protect Social Security benefits — oppose any cuts or privatization' },
      { label: 'Raise the cap', ask: 'Lift the payroll tax cap so high earners pay Social Security tax on all their income' },
      { label: 'Reform to sustain', ask: 'Support bipartisan reforms to keep Social Security solvent for future generations' },
      { label: 'Increase COLA', ask: 'Use a more accurate cost-of-living formula that reflects seniors\' actual expenses' },
      { label: 'Repeal WEP/GPO', ask: 'Repeal the Windfall Elimination Provision and Government Pension Offset that cut benefits for public employees' },
      { label: 'Expand benefits', ask: 'Increase the minimum Social Security benefit so no retiree lives in poverty' },
    ],
    perspectives: [
      { label: 'Protect benefits', points: ['Workers paid into the system their whole lives', 'Lifting the $168,600 payroll tax cap solves most of the shortfall', 'Social Security keeps 22 million Americans out of poverty'], counterpoint: 'The ratio of workers to retirees is shrinking — math requires some structural changes' },
      { label: 'Structural reform', points: ['The math doesn\'t work with an aging population (2.8 workers per retiree, was 5.1)', 'Raising the retirement age reflects longer lifespans', 'Means-testing focuses benefits on those who need them'], counterpoint: 'Raising the retirement age hits physical laborers hardest and life expectancy gains favor the wealthy' },
    ],
    sources: [
      { label: 'SSA — Fact Sheet', url: 'https://www.ssa.gov/policy/docs/quickfacts/stat_snapshot/', type: 'government' },
      { label: 'SSA Trustees Report', url: 'https://www.ssa.gov/oact/TR/', type: 'government' },
      { label: 'CBO — Social Security Analysis', url: 'https://www.cbo.gov/topics/social-security', type: 'government' },
    ],
  },
  // Labor subtopics
  'Minimum Wage': {
    summary: 'The federal minimum wage has been $7.25/hour since 2009. About 30 states have set higher minimums, but millions of workers still earn below $15/hour.',
    keyStats: [
      { value: '$7.25', label: 'Federal minimum wage (unchanged since 2009)', source: 'DOL, 2024', sourceUrl: 'https://www.dol.gov/agencies/whd/minimum-wage' },
      { value: '15+ years', label: 'Longest stretch without a federal increase in history', source: 'DOL' },
      { value: '30+', label: 'States with minimums above $7.25', source: 'EPI, 2024' },
      { value: '$2.13', label: 'Federal tipped minimum wage', source: 'DOL, 2024' },
    ],
    currentEvents: [
      'Federal minimum wage frozen at $7.25 for 15+ years (longest stretch ever)',
      'Multiple states and cities have raised minimums to $15-20+',
      'Tipped minimum wage remains $2.13/hour federally',
    ],
    commonAsks: [
      { label: 'Raise to $15', ask: 'Raise the federal minimum wage to $15/hour and index it to inflation' },
      { label: 'Eliminate tipped minimum', ask: 'Eliminate the subminimum tipped wage — everyone deserves a base wage' },
      { label: 'Keep it local', ask: 'Let states and cities set their own minimum wage based on local cost of living' },
      { label: 'Protect small business', ask: 'If raising the minimum wage, phase it in gradually for small businesses' },
      { label: 'Index to inflation', ask: 'Index the minimum wage to inflation so it automatically keeps up with the cost of living' },
    ],
    perspectives: [
      { label: 'Raise the wage', points: ['$7.25 in 2009 is worth ~$5.40 today after inflation', 'States that raised their minimum saw continued job growth', 'A full-time worker at $7.25 earns $15,080/year — below the poverty line'], counterpoint: 'CBO estimates a $15 federal minimum could cost 1.4 million jobs in lower-cost areas' },
      { label: 'Local flexibility', points: ['One size doesn\'t fit all — $15 in NYC differs from rural areas', 'Mandated increases can reduce hours for some low-wage workers', 'Small businesses operate on thin margins'], counterpoint: '$7.25 is below the poverty line everywhere — no area has a cost of living that low' },
    ],
    sources: [
      { label: 'DOL — Minimum Wage', url: 'https://www.dol.gov/agencies/whd/minimum-wage', type: 'government' },
      { label: 'CBO — Minimum Wage Analysis', url: 'https://www.cbo.gov/publication/55681', type: 'government' },
      { label: 'EPI — Minimum Wage Tracker', url: 'https://www.epi.org/minimum-wage-tracker/', type: 'nonpartisan' },
    ],
  },
  // Civil rights subtopics
  'Voting Rights': {
    summary: 'Voting rights policy covers voter access, voter ID laws, mail-in voting, gerrymandering, and protections against discrimination at the polls.',
    keyStats: [
      { value: '66.6%', label: 'Voter turnout in 2020 (highest since 1900)', source: 'Census Bureau, 2021', sourceUrl: 'https://www.census.gov/topics/public-sector/voting.html' },
      { value: '36', label: 'States requiring some form of voter ID', source: 'NCSL, 2024' },
      { value: '22', label: 'States that passed restrictive voting laws since 2020', source: 'Brennan Center, 2024' },
    ],
    currentEvents: [
      'States passing both expansive and restrictive voting laws post-2020',
      'Federal voting rights legislation (John Lewis Act) stalled in Senate',
      'Redistricting battles and gerrymandering court cases',
    ],
    commonAsks: [
      { label: 'Pass voting rights act', ask: 'Pass the John Lewis Voting Rights Advancement Act to restore federal oversight' },
      { label: 'Voter ID', ask: 'Support voter ID requirements to ensure election integrity' },
      { label: 'Expand mail-in voting', ask: 'Expand access to mail-in and early voting in all states' },
      { label: 'End gerrymandering', ask: 'Support independent redistricting commissions to end partisan gerrymandering' },
      { label: 'Automatic voter registration', ask: 'Implement automatic voter registration at DMVs and government agencies nationwide' },
    ],
    perspectives: [
      { label: 'Expand access', points: ['Voting should be easy for every eligible citizen', 'Restrictions disproportionately affect minority and low-income voters', 'Higher turnout strengthens democracy'], counterpoint: 'Voter ID requirements are supported by 80%+ of Americans across parties' },
      { label: 'Election integrity', points: ['ID requirements are common sense and widely supported', 'Secure elections build public confidence', 'States should manage their own elections'], counterpoint: 'Documented voter fraud is exceedingly rare — 0.0025% of ballots (Brennan Center)' },
    ],
    sources: [
      { label: 'Census — Voting Data', url: 'https://www.census.gov/topics/public-sector/voting.html', type: 'government' },
      { label: 'Brennan Center — Voting Laws', url: 'https://www.brennancenter.org/issues/ensure-every-american-can-vote', type: 'nonpartisan' },
    ],
  },
  'LGBTQ+ Rights': {
    summary: 'LGBTQ+ rights policy covers anti-discrimination protections, marriage equality enforcement, transgender rights, and conversion therapy bans.',
    keyStats: [
      { value: '500+', label: 'Anti-LGBTQ+ bills introduced in state legislatures (2023)', source: 'ACLU, 2024', sourceUrl: 'https://www.aclu.org/legislative-attacks-on-lgbtq-rights' },
      { value: '7.6%', label: 'U.S. adults identifying as LGBTQ+ (up from 3.5% in 2012)', source: 'Gallup, 2024' },
      { value: '29', label: 'States without explicit LGBTQ+ non-discrimination laws', source: 'Movement Advancement Project, 2024' },
    ],
    currentEvents: [
      'State-level bills targeting transgender youth (sports, healthcare, bathrooms) — 500+ introduced in 2023',
      'Equality Act (federal non-discrimination) has not passed the Senate',
      'Same-sex marriage federally protected by the Respect for Marriage Act',
    ],
    commonAsks: [
      { label: 'Pass Equality Act', ask: 'Pass the Equality Act to ban discrimination based on sexual orientation and gender identity' },
      { label: 'Protect trans youth', ask: 'Oppose legislation that restricts healthcare and participation for transgender youth' },
      { label: 'Parental rights', ask: 'Support parents\' rights to make decisions about their children without government interference' },
      { label: 'Religious liberty', ask: 'Protect religious organizations\' right to operate according to their beliefs' },
      { label: 'Ban conversion therapy', ask: 'Ban the harmful practice of conversion therapy for minors nationwide' },
    ],
    perspectives: [
      { label: 'Equal protection', points: ['LGBTQ+ people face discrimination in housing, employment, and healthcare', 'Trans youth have alarming rates of depression and suicide', 'Federal protections ensure equal treatment nationwide'], counterpoint: 'Religious institutions and parents have legitimate concerns about age-appropriate policies' },
      { label: 'Traditional values', points: ['Parents should guide decisions about their children', 'Religious institutions need protections too', 'States should decide on age-appropriate policies'], counterpoint: 'LGBTQ+ youth attempt suicide at nearly 4x the rate of their peers — these policies have life-or-death consequences' },
    ],
    sources: [
      { label: 'ACLU — Anti-LGBTQ+ Legislation', url: 'https://www.aclu.org/legislative-attacks-on-lgbtq-rights', type: 'nonpartisan' },
      { label: 'Movement Advancement Project', url: 'https://www.lgbtmap.org/', type: 'nonpartisan' },
    ],
  },
  // Tech subtopics
  'AI': {
    summary: 'AI policy covers safety, regulation, deepfakes, job displacement, algorithmic bias, and whether existing laws can govern rapidly advancing AI technology.',
    keyStats: [
      { value: '40%', label: 'Of U.S. jobs exposed to AI disruption', source: 'IMF, 2024' },
      { value: '$200B+', label: 'Global AI market size (2024)', source: 'Grand View Research, 2024' },
      { value: '96%', label: 'Of deepfakes are non-consensual intimate images', source: 'Sensity AI, 2023' },
    ],
    currentEvents: [
      'Executive orders and proposed legislation on AI safety and transparency',
      'Deepfakes and AI-generated misinformation in elections — 96% of deepfakes are NCII',
      'AI displacing and transforming jobs across industries',
    ],
    commonAsks: [
      { label: 'Regulate AI', ask: 'Pass legislation requiring transparency and safety testing for AI systems' },
      { label: 'Ban deepfakes', ask: 'Ban AI-generated deepfakes in elections and non-consensual intimate images' },
      { label: 'Protect innovation', ask: 'Avoid over-regulating AI to keep the U.S. competitive with China' },
      { label: 'Worker protections', ask: 'Require companies to provide retraining when AI displaces workers' },
      { label: 'Require watermarks', ask: 'Require AI-generated content to include watermarks or disclosures so people know what\'s real' },
      { label: 'Algorithmic bias audits', ask: 'Require audits of AI systems used in hiring, lending, and criminal justice to prevent discrimination' },
    ],
    perspectives: [
      { label: 'Regulate proactively', points: ['AI is moving faster than laws can keep up', 'Bias in AI systems can perpetuate discrimination at scale', 'Deepfakes pose risks to elections and individuals'], counterpoint: 'The U.S. risks falling behind China if regulations slow development' },
      { label: 'Let innovation lead', points: ['Over-regulation pushes development overseas', 'AI will create more jobs than it displaces', 'Industry can self-regulate faster than government'], counterpoint: 'Industries rarely self-regulate against their financial interests without pressure' },
    ],
    sources: [
      { label: 'White House — AI Executive Order', url: 'https://www.whitehouse.gov/ostp/ai-bill-of-rights/', type: 'government' },
      { label: 'Brookings — AI Policy', url: 'https://www.brookings.edu/topic/artificial-intelligence/', type: 'nonpartisan' },
    ],
  },
  'Data Privacy': {
    summary: 'The U.S. has no comprehensive federal privacy law. Companies collect vast amounts of personal data with few restrictions on how it\'s used or sold.',
    keyStats: [
      { value: '19', label: 'States with comprehensive privacy laws (no federal law)', source: 'IAPP, 2024' },
      { value: '4,000+', label: 'Data brokers in the U.S.', source: 'Duke University Research, 2023' },
      { value: '72%', label: 'Americans who feel they have little control over their data', source: 'Pew Research, 2023' },
    ],
    currentEvents: [
      'States passing their own privacy laws (19 states and counting)',
      'Federal comprehensive privacy bill has stalled repeatedly',
      'Data brokers selling personal information including location data',
    ],
    commonAsks: [
      { label: 'Federal privacy law', ask: 'Pass a comprehensive federal data privacy law giving Americans control over their personal data' },
      { label: 'Ban data brokers', ask: 'Ban the sale of personal data by data brokers without explicit consent' },
      { label: 'Protect kids online', ask: 'Pass stronger protections for children\'s data and online safety' },
      { label: 'Industry standards', ask: 'Support industry-led privacy standards rather than heavy government regulation' },
    ],
    perspectives: [
      { label: 'Strong protections', points: ['72% of Americans feel they have little control over their data', 'The EU\'s GDPR shows federal regulation is workable', 'Without rules, companies will maximize data collection'], counterpoint: 'Strict regulation could harm small businesses and free ad-supported services' },
      { label: 'Balanced approach', points: ['Over-regulation could harm small businesses', 'Free services depend on ad-supported data models', 'Patchwork state laws create compliance burden'], counterpoint: 'Without federal action, 4,000+ data brokers continue selling Americans\' data unchecked' },
    ],
    sources: [
      { label: 'IAPP — State Privacy Laws', url: 'https://iapp.org/resources/article/us-state-privacy-legislation-tracker/', type: 'nonpartisan' },
      { label: 'Pew Research — Privacy', url: 'https://www.pewresearch.org/internet/topic/privacy-security/', type: 'nonpartisan' },
    ],
  },
  'Social Media Regulation': {
    summary: 'Social media regulation debates cover Section 230 liability, content moderation, algorithms, youth safety, and platform monopoly power.',
    keyStats: [
      { value: '95%', label: 'Of teens who use social media (50%+ say they use it "almost constantly")', source: 'Pew Research, 2024' },
      { value: '57%', label: 'Of teen girls experiencing persistent sadness (doubled in a decade)', source: 'CDC YRBS, 2023' },
      { value: '$155B', label: 'Annual U.S. social media ad revenue', source: 'eMarketer, 2024' },
    ],
    currentEvents: [
      'Surgeon General called youth social media use an "urgent public health issue"',
      'Bipartisan Kids Online Safety Act advancing in Congress',
      'Section 230 reform proposals from both parties',
    ],
    commonAsks: [
      { label: 'Protect kids', ask: 'Pass the Kids Online Safety Act to protect children from harmful social media content' },
      { label: 'Reform Section 230', ask: 'Reform Section 230 to hold platforms accountable for harmful content they amplify' },
      { label: 'Protect free speech', ask: 'Oppose social media regulations that could lead to government censorship' },
      { label: 'Algorithm transparency', ask: 'Require social media companies to be transparent about how their algorithms promote content' },
      { label: 'Age verification', ask: 'Require age verification for social media accounts to protect children under 13' },
    ],
    perspectives: [
      { label: 'Regulate platforms', points: ['50%+ of teens use social media "almost constantly"', 'Platforms profit from outrage and misinformation', 'Transparency about algorithms is the bare minimum'], counterpoint: 'Government regulation of content is a slippery slope toward censorship' },
      { label: 'Protect speech', points: ['Government regulation of content is a slippery slope', 'Parents, not government, should monitor kids\' use', 'Section 230 is what makes the internet work'], counterpoint: 'Platforms\' own internal research shows they know their products harm teen mental health' },
    ],
    sources: [
      { label: 'Pew — Teens & Social Media', url: 'https://www.pewresearch.org/internet/topic/teens-and-technology/', type: 'nonpartisan' },
      { label: 'CDC — Youth Risk Behavior Survey', url: 'https://www.cdc.gov/healthyyouth/data/yrbs/', type: 'government' },
    ],
  },
  // Energy subtopics
  'Oil and Gas': {
    summary: 'Oil and gas policy covers drilling leases, pipeline approvals, fracking regulations, fossil fuel subsidies, and energy independence.',
    keyStats: [
      { value: '#1', label: 'U.S. is the world\'s top oil and gas producer', source: 'EIA, 2024', sourceUrl: 'https://www.eia.gov/todayinenergy/' },
      { value: '13.2M', label: 'Barrels of oil produced per day (record)', source: 'EIA, 2024' },
      { value: '$20B+', label: 'Annual federal fossil fuel subsidies', source: 'IMF, 2023' },
    ],
    currentEvents: [
      'U.S. is the world\'s top oil and gas producer — record 13.2M barrels/day',
      'Debates over new drilling leases on federal lands and offshore',
      '$20B+ in annual fossil fuel subsidies debated',
    ],
    commonAsks: [
      { label: 'End fossil fuel subsidies', ask: 'End federal subsidies for fossil fuel companies that are highly profitable' },
      { label: 'Expand drilling', ask: 'Expand domestic oil and gas production to lower energy costs and ensure energy independence' },
      { label: 'No new leases', ask: 'Stop approving new fossil fuel leases on federal lands to meet climate goals' },
      { label: 'Transition support', ask: 'Support fossil fuel workers with job training and economic development during the energy transition' },
      { label: 'Clean up orphaned wells', ask: 'Fund cleanup of orphaned oil and gas wells that leak methane and contaminate groundwater' },
    ],
    perspectives: [
      { label: 'Transition away', points: ['Fossil fuels are the primary driver of climate change', 'Subsidies of $20B+/year go to the most profitable industry in history', 'Clean energy is already cheaper in many areas'], counterpoint: 'Oil and gas still supply 80% of U.S. energy — transition takes time' },
      { label: 'Continue production', points: ['Oil and gas ensure energy reliability today', 'U.S. production reduces reliance on hostile nations', 'Transition should be gradual, not forced'], counterpoint: 'The industry\'s own scientists documented climate harm decades ago' },
    ],
    sources: [
      { label: 'EIA — Energy Data', url: 'https://www.eia.gov/todayinenergy/', type: 'government' },
      { label: 'CRS — Fossil Fuel Subsidies', url: 'https://crsreports.congress.gov/product/pdf/R/R45493', type: 'government' },
    ],
  },
  // Trade subtopics
  'Tariffs': {
    summary: 'Tariffs are taxes on imported goods. They raise revenue and protect domestic industries but can increase consumer prices and spark trade wars.',
    keyStats: [
      { value: '$80B+', label: 'Annual tariff costs passed to U.S. consumers', source: 'Tax Foundation, 2024', sourceUrl: 'https://taxfoundation.org/research/all/federal/tariffs-trade-war/' },
      { value: '25-100%', label: 'Range of tariffs on Chinese imports', source: 'USTR, 2024' },
      { value: '$1,300', label: 'Average annual cost of tariffs per U.S. household', source: 'Tax Foundation, 2024' },
    ],
    currentEvents: [
      'Tariffs on Chinese goods ranging from 25-100% across categories',
      'Tariffs cost U.S. households an estimated $1,300/year in higher prices',
      'Trade tensions with allies over steel, aluminum, and auto tariffs',
    ],
    commonAsks: [
      { label: 'More tariffs', ask: 'Support tariffs to protect American manufacturing and bring jobs back' },
      { label: 'Reduce tariffs', ask: 'Reduce tariffs that are raising prices for American consumers and businesses' },
      { label: 'Targeted tariffs', ask: 'Use targeted tariffs on strategic industries (chips, clean energy) not broad ones that raise costs' },
      { label: 'Negotiate trade deals', ask: 'Negotiate fair trade agreements rather than relying on unilateral tariffs' },
      { label: 'Trade Adjustment Assistance', ask: 'Fund Trade Adjustment Assistance to help workers and communities displaced by trade policy changes' },
    ],
    perspectives: [
      { label: 'Protect industry', points: ['Tariffs bring manufacturing jobs back', 'China doesn\'t play by fair trade rules', 'National security requires domestic production of critical goods'], counterpoint: 'Tariffs cost U.S. households ~$1,300/year and are paid by American consumers, not foreign governments' },
      { label: 'Free trade', points: ['Tariffs are a tax on consumers — $80B+/year passed through', 'Trade wars hurt farmers and exporters', 'Allies should work together, not against each other'], counterpoint: 'Without tariffs, China\'s subsidized industries can undercut any American manufacturer' },
    ],
    sources: [
      { label: 'Tax Foundation — Tariffs', url: 'https://taxfoundation.org/research/all/federal/tariffs-trade-war/', type: 'nonpartisan' },
      { label: 'USITC — Trade Data', url: 'https://www.usitc.gov/research_and_analysis.htm', type: 'government' },
    ],
  },
  // International subtopics
  'Ukraine': {
    summary: 'U.S. policy on Ukraine covers military and economic aid, sanctions on Russia, NATO alliance management, and diplomatic efforts to end the war.',
    keyStats: [
      { value: '$175B+', label: 'Total U.S. aid to Ukraine committed since 2022', source: 'State Dept, 2024' },
      { value: '90%', label: 'Of U.S. military aid spent on American manufacturing', source: 'Pentagon, 2024' },
      { value: '3.5%', label: 'Of annual U.S. defense budget represented by Ukraine aid', source: 'CRS, 2024' },
    ],
    currentEvents: [
      'Ongoing debates over continued U.S. military and economic aid to Ukraine',
      'Sanctions on Russia and their effectiveness',
      'Diplomatic efforts and ceasefire negotiations',
    ],
    commonAsks: [
      { label: 'Continue aid', ask: 'Continue military and economic aid to Ukraine to defend against Russian aggression' },
      { label: 'Reduce aid', ask: 'Reduce U.S. aid to Ukraine and focus resources on domestic priorities' },
      { label: 'Push diplomacy', ask: 'Push for diplomatic negotiations to end the war and prevent escalation' },
      { label: 'Strengthen sanctions', ask: 'Strengthen sanctions on Russia and enforce them more aggressively' },
    ],
    perspectives: [
      { label: 'Support Ukraine', points: ['Defending Ukraine deters future aggression by Russia and China', 'Abandoning allies emboldens autocrats', '90% of U.S. military aid is spent on American-made weapons'], counterpoint: '$175B+ is real money that could address domestic needs' },
      { label: 'Focus at home', points: ['$175B+ should go to American needs first', 'There\'s no clear endgame or exit strategy', 'Risk of escalation with a nuclear power'], counterpoint: 'Ukraine aid is ~3.5% of the annual defense budget — and weakens a top U.S. adversary without U.S. troops' },
    ],
    sources: [
      { label: 'CRS — Ukraine Aid Tracker', url: 'https://crsreports.congress.gov/product/pdf/R/R47859', type: 'government' },
      { label: 'State Dept — Ukraine Support', url: 'https://www.state.gov/u-s-security-cooperation-with-ukraine/', type: 'government' },
    ],
  },
  'Foreign Aid': {
    summary: 'Foreign aid is less than 1% of the federal budget but funds global health, disaster relief, development, and diplomatic influence in 100+ countries.',
    keyStats: [
      { value: '<1%', label: 'Of the federal budget goes to foreign aid', source: 'OMB, 2024' },
      { value: '25M+', label: 'Lives saved by PEPFAR (HIV/AIDS program)', source: 'State Dept, 2024' },
      { value: '$68B', label: 'Total U.S. international affairs budget (FY2024)', source: 'State Dept, 2024' },
    ],
    currentEvents: [
      'Proposed cuts to State Department and USAID funding',
      'Debates over aid effectiveness and accountability',
      'Humanitarian crises in multiple regions requiring emergency aid',
    ],
    commonAsks: [
      { label: 'Protect aid', ask: 'Maintain foreign aid funding that saves lives and advances U.S. interests abroad' },
      { label: 'Cut foreign aid', ask: 'Reduce foreign aid spending and redirect it to domestic programs' },
      { label: 'Reform aid', ask: 'Reform foreign aid to ensure it\'s effective, accountable, and aligned with U.S. interests' },
      { label: 'Humanitarian focus', ask: 'Prioritize humanitarian aid for the most vulnerable populations worldwide' },
      { label: 'Protect PEPFAR', ask: 'Maintain funding for PEPFAR, the HIV/AIDS program that has saved 25+ million lives' },
    ],
    perspectives: [
      { label: 'Invest abroad', points: ['Foreign aid prevents conflicts that cost far more than military intervention', 'PEPFAR alone has saved 25+ million lives', 'Aid builds goodwill and counters Chinese influence'], counterpoint: 'Some aid programs have poor oversight and don\'t reach their intended recipients' },
      { label: 'Domestic focus', points: ['Charity begins at home', 'Much aid is wasted or goes to corrupt governments', 'Americans overestimate aid spending by 10-25x (think it\'s 25% of budget, it\'s <1%)'], counterpoint: 'Aid is less than 1% of the budget — cutting it saves little but costs diplomatic influence' },
    ],
    sources: [
      { label: 'State Dept — Foreign Aid Data', url: 'https://www.foreignassistance.gov/', type: 'government' },
      { label: 'CRS — Foreign Aid Overview', url: 'https://crsreports.congress.gov/product/pdf/R/R40213', type: 'government' },
    ],
  },
  // Families subtopics
  'Child Care': {
    summary: 'Child care policy covers affordability, availability, provider quality, and how working parents access care. Average costs exceed $14,000/year.',
    keyStats: [
      { value: '$14,760', label: 'Average annual child care cost per child', source: 'Child Care Aware, 2024', sourceUrl: 'https://www.childcareaware.org/catalyzing-growth/' },
      { value: '51%', label: 'Of Americans living in child care deserts', source: 'Center for American Progress, 2024' },
      { value: '1 in 6', label: 'Eligible families that receive CCDBG subsidies', source: 'HHS, 2024' },
      { value: '$13.07', label: 'Median hourly wage for child care workers', source: 'BLS, 2024' },
    ],
    currentEvents: [
      'Pandemic-era childcare funding expired — over 70,000 programs affected',
      '51% of Americans live in child care deserts — many areas lack enough licensed providers',
      'Debates over universal pre-K and expanding the child tax credit',
    ],
    commonAsks: [
      { label: 'Expand child tax credit', ask: 'Expand and make permanent the child tax credit to help families with child care costs' },
      { label: 'Fund universal pre-K', ask: 'Fund universal pre-kindergarten so every child has access to early education' },
      { label: 'Support providers', ask: 'Increase pay and funding for child care workers to reduce provider shortages' },
      { label: 'Tax incentives for employers', ask: 'Create tax incentives for employers who offer child care benefits to workers' },
      { label: 'Expand child care subsidies', ask: 'Expand the Child Care and Development Block Grant (CCDBG) so more families qualify for child care subsidies' },
      { label: 'Cap costs at 7% of income', ask: 'Cap child care costs at no more than 7% of family income so parents can afford to work' },
    ],
    perspectives: [
      { label: 'Public investment', points: ['Affordable child care lets parents work — generates $8.60 in economic activity per $1 invested', 'Early childhood education improves long-term outcomes', 'Provider pay is $13.07/hour — too low to attract enough workers'], counterpoint: 'Large federal programs can be rigid and crowd out family, faith-based, and private options' },
      { label: 'Family choice', points: ['Parents should choose the care arrangement that works for their family', 'Government programs can crowd out private and faith-based options', 'Tax credits give flexibility without growing bureaucracy'], counterpoint: 'Only 1 in 6 eligible families receive subsidies — the market alone isn\'t meeting the need' },
    ],
    sources: [
      { label: 'Child Care Aware — Data', url: 'https://www.childcareaware.org/catalyzing-growth/', type: 'nonpartisan' },
      { label: 'CBO — Child Care Analysis', url: 'https://www.cbo.gov/publication/58861', type: 'government' },
      { label: 'DOL — Women\'s Bureau', url: 'https://www.dol.gov/agencies/wb/topics/childcare', type: 'government' },
    ],
  },
  'Paid Family Leave': {
    summary: 'The U.S. has no federal paid family leave law. The FMLA guarantees 12 weeks of unpaid leave, but many workers can\'t afford to take it.',
    keyStats: [
      { value: '0 weeks', label: 'Federally guaranteed paid leave (only wealthy nation at zero)', source: 'OECD, 2024' },
      { value: '13', label: 'States + DC with paid family leave programs', source: 'National Partnership, 2024' },
      { value: '24%', label: 'Of private-sector workers with access to paid family leave', source: 'BLS, 2024' },
    ],
    currentEvents: [
      'Several states have implemented their own paid leave programs (13 + DC)',
      'Federal paid leave proposals have stalled in Congress',
      'Debates over employer mandates vs. tax-credit approaches',
    ],
    commonAsks: [
      { label: 'Federal paid leave', ask: 'Pass a federal paid family and medical leave program' },
      { label: 'Tax credits approach', ask: 'Offer tax credits to employers who voluntarily provide paid leave' },
      { label: 'Expand FMLA', ask: 'Expand FMLA to cover more workers and smaller employers' },
      { label: 'State-level solutions', ask: 'Let states design their own paid leave programs with federal support' },
      { label: 'Pass the FAMILY Act', ask: 'Pass the FAMILY Act to create a national paid family and medical leave insurance program' },
    ],
    perspectives: [
      { label: 'Worker support', points: ['No one should have to choose between a paycheck and caring for family', 'Paid leave improves worker retention and productivity', 'The U.S. is the only wealthy nation with zero guaranteed paid leave'], counterpoint: 'Mandates can be particularly burdensome for small businesses with thin margins' },
      { label: 'Business concerns', points: ['Mandates are especially hard on small businesses', 'Voluntary employer programs are growing without mandates', 'One-size-fits-all doesn\'t work for every industry'], counterpoint: 'States with paid leave saw no negative employment effects — businesses adapted' },
    ],
    sources: [
      { label: 'DOL — FMLA', url: 'https://www.dol.gov/agencies/whd/fmla', type: 'government' },
      { label: 'National Partnership — Paid Leave Data', url: 'https://nationalpartnership.org/issue/paid-leave/', type: 'nonpartisan' },
    ],
  },
  // Economy subtopics (missing)
  'Cost of Living': {
    summary: 'Cost of living encompasses housing, food, healthcare, transportation, and childcare — the everyday expenses that determine whether families can make ends meet.',
    keyStats: [
      { value: '~20%', label: 'Cumulative price increase since 2020', source: 'BLS CPI, 2024' },
      { value: '37%', label: 'Of Americans can\'t cover a $400 emergency', source: 'Federal Reserve, 2024' },
      { value: '$78,000', label: 'Median household income (2023)', source: 'Census Bureau, 2024' },
    ],
    currentEvents: [
      'Housing, groceries, and insurance costs remain elevated even as overall inflation moderates',
      'Regional cost differences create uneven economic pressure across the country',
      'Debates over whether wages are keeping pace with rising costs',
    ],
    commonAsks: [
      { label: 'Lower everyday costs', ask: 'Take action to reduce the cost of groceries, gas, and housing for working families' },
      { label: 'Raise wages', ask: 'Support policies that help wages keep up with the rising cost of living' },
      { label: 'Cut regulations', ask: 'Reduce regulations that drive up costs for consumers and businesses' },
      { label: 'Targeted relief', ask: 'Provide targeted tax credits or subsidies for families struggling with rising costs' },
      { label: 'Cap insulin & drug costs', ask: 'Cap out-of-pocket costs for insulin and essential medications for all Americans' },
    ],
    perspectives: [
      { label: 'Structural solutions', points: ['Wages haven\'t kept up with costs for decades', 'Housing supply and healthcare reform address root causes', '37% of Americans can\'t cover a $400 emergency'], counterpoint: 'Government intervention can distort markets and create unintended consequences' },
      { label: 'Market solutions', points: ['Government spending contributes to higher prices', 'Reducing regulations lowers costs for everyone', 'A growing economy is the best path to affordability'], counterpoint: 'Real wages for the bottom half have barely grown in 40 years — the market hasn\'t solved this' },
    ],
    sources: [
      { label: 'BLS — Consumer Price Index', url: 'https://www.bls.gov/cpi/', type: 'government' },
      { label: 'Federal Reserve — Economic Well-Being', url: 'https://www.federalreserve.gov/publications/report-economic-well-being-us-households.htm', type: 'government' },
    ],
  },
  'Federal Budget': {
    summary: 'The federal budget sets annual spending priorities across defense, healthcare, education, infrastructure, and more. Congress must pass appropriations bills or face shutdowns.',
    keyStats: [
      { value: '$6.1T', label: 'Total federal spending (FY2023)', source: 'CBO, 2024', sourceUrl: 'https://www.cbo.gov/topics/budget' },
      { value: '70%', label: 'Of spending is mandatory (Social Security, Medicare, interest)', source: 'CBO, 2024' },
      { value: '$659B', label: 'Net interest payments on the debt (FY2023)', source: 'Treasury, 2024' },
    ],
    currentEvents: [
      'Government shutdown threats during budget negotiations',
      'Mandatory spending (70% of budget) grows automatically each year',
      'Interest payments on the debt ($659B) now exceed defense spending',
    ],
    commonAsks: [
      { label: 'Increase domestic spending', ask: 'Increase funding for education, infrastructure, and social programs' },
      { label: 'Cut spending', ask: 'Reduce federal spending to bring the budget closer to balance' },
      { label: 'Reform the process', ask: 'Reform the budget process to prevent shutdowns and last-minute continuing resolutions' },
      { label: 'Prioritize defense', ask: 'Prioritize defense spending to maintain national security' },
    ],
    perspectives: [
      { label: 'Invest in priorities', points: ['Public investment in infrastructure and education drives growth', 'Safety net programs reduce poverty and stabilize the economy', 'Revenue increases can fund priorities responsibly'], counterpoint: 'Interest payments on the debt are crowding out the very programs investments would fund' },
      { label: 'Fiscal restraint', points: ['Government spending must be sustainable', 'Waste and inefficiency should be addressed first', 'Future generations shouldn\'t bear the burden of today\'s spending'], counterpoint: 'Discretionary spending (the part Congress debates) is only 30% of the budget — cuts there have limited impact' },
    ],
    sources: [
      { label: 'CBO — Budget Topics', url: 'https://www.cbo.gov/topics/budget', type: 'government' },
      { label: 'OMB — Budget Data', url: 'https://www.whitehouse.gov/omb/budget/', type: 'government' },
    ],
  },
  'National Debt': {
    summary: 'The U.S. national debt exceeds $35 trillion. Interest payments on the debt are now one of the largest federal expenditures.',
    keyStats: [
      { value: '$35T+', label: 'Total national debt', source: 'Treasury, 2024', sourceUrl: 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/' },
      { value: '$659B', label: 'Annual interest payments (exceeds defense)', source: 'CBO, 2024' },
      { value: '120%', label: 'Debt-to-GDP ratio', source: 'CBO, 2024' },
    ],
    currentEvents: [
      'Debt ceiling negotiations create recurring political standoffs',
      'Interest payments ($659B) now exceed the entire defense budget',
      'CBO projects debt will continue growing under current policy',
    ],
    commonAsks: [
      { label: 'Balance the budget', ask: 'Work toward a balanced federal budget to stop adding to the debt' },
      { label: 'Raise revenue', ask: 'Increase tax revenue from high earners and corporations to reduce the deficit' },
      { label: 'Cut entitlements', ask: 'Reform entitlement programs to reduce long-term spending growth' },
      { label: 'Grow the economy', ask: 'Focus on economic growth to increase revenue without raising tax rates' },
    ],
    perspectives: [
      { label: 'Reduce the debt', points: ['$35T+ in debt burdens future generations', 'Interest payments ($659B/year) now exceed defense spending', 'Fiscal discipline is essential for long-term stability'], counterpoint: 'Austerity during economic weakness has historically made things worse, not better' },
      { label: 'Strategic investment', points: ['Not all debt is bad — borrowing for growth pays off', 'Austerity during downturns makes things worse', 'The U.S. can manage its debt as the world\'s reserve currency'], counterpoint: 'At 120% debt-to-GDP, interest payments are the fastest-growing budget item — that\'s not sustainable' },
    ],
    sources: [
      { label: 'Treasury — Debt to the Penny', url: 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/', type: 'government' },
      { label: 'CBO — Long-Term Budget Outlook', url: 'https://www.cbo.gov/publication/59711', type: 'government' },
    ],
  },
  // Education subtopics (missing)
  'Higher Education': {
    summary: 'Higher education policy covers college affordability, the value of degrees, vocational alternatives, and how institutions are funded and regulated.',
    keyStats: [
      { value: '$28,840', label: 'Average annual cost of a 4-year public university (in-state)', source: 'College Board, 2024' },
      { value: '3x', label: 'Tuition increase since 2000 (adjusted for inflation)', source: 'NCES, 2024' },
      { value: '$7,395', label: 'Maximum Pell Grant (covers ~30% of public university costs)', source: 'Dept. of Education, 2024' },
    ],
    currentEvents: [
      'College tuition has risen 3x since 2000, far outpacing inflation',
      'Growing interest in trade schools, apprenticeships, and alternative credentials',
      'Debates over the return on investment of a four-year degree',
    ],
    commonAsks: [
      { label: 'Free community college', ask: 'Make community college tuition-free to expand access to higher education' },
      { label: 'Expand Pell Grants', ask: 'Increase Pell Grant funding so low-income students can afford college' },
      { label: 'Fund vocational training', ask: 'Invest in vocational and trade school programs as alternatives to four-year degrees' },
      { label: 'Reduce costs', ask: 'Hold colleges accountable for rising costs and administrative bloat' },
      { label: 'Double the Pell Grant', ask: 'Double the maximum Pell Grant to restore its purchasing power for low-income students' },
      { label: 'Expand apprenticeships', ask: 'Expand registered apprenticeship programs as earn-while-you-learn alternatives to college' },
    ],
    perspectives: [
      { label: 'Expand access', points: ['Education is the best path to upward mobility', 'Cost shouldn\'t determine who gets a degree — Pell covers only 30% of public university costs', 'Public investment in education pays for itself'], counterpoint: 'Subsidizing tuition without accountability can enable cost inflation' },
      { label: 'Accountability first', points: ['Colleges need accountability for the outcomes they deliver', 'Not everyone needs a four-year degree', 'Trade skills are in high demand and lead to good-paying jobs'], counterpoint: 'Without investment, low-income students are locked out regardless of merit' },
    ],
    sources: [
      { label: 'NCES — College Costs', url: 'https://nces.ed.gov/fastfacts/display.asp?id=76', type: 'government' },
      { label: 'College Board — Trends in College Pricing', url: 'https://research.collegeboard.org/trends/college-pricing', type: 'nonpartisan' },
    ],
  },
  // Environment subtopics (missing)
  'Clean Air': {
    summary: 'Clean air policy covers emissions standards for vehicles and industry, air quality monitoring, wildfire smoke, and environmental justice in overburdened communities.',
    keyStats: [
      { value: '100,000+', label: 'Premature deaths annually from air pollution in the U.S.', source: 'EPA, 2024', sourceUrl: 'https://www.epa.gov/clean-air-act-overview/air-pollution-current-and-future-challenges' },
      { value: '40%', label: 'Of Americans live in counties with unhealthy air quality', source: 'American Lung Association, 2024' },
      { value: '$2T+', label: 'Estimated health and economic benefits of the Clean Air Act since 1970', source: 'EPA, 2011' },
    ],
    currentEvents: [
      'EPA vehicle emissions standards pushing transition to cleaner cars',
      'Wildfire smoke affecting air quality across wide regions',
      'Environmental justice concerns about pollution in low-income communities',
    ],
    commonAsks: [
      { label: 'Strengthen EPA standards', ask: 'Strengthen EPA air quality standards to protect public health' },
      { label: 'EV transition', ask: 'Support the transition to electric vehicles to improve air quality' },
      { label: 'Flexible compliance', ask: 'Give industries flexible timelines to meet air quality standards without harming jobs' },
      { label: 'Environmental justice', ask: 'Prioritize cleaning up pollution in communities that bear the greatest burden' },
    ],
    perspectives: [
      { label: 'Stronger standards', points: ['Air pollution causes hundreds of thousands of premature deaths', 'Low-income communities bear disproportionate exposure', 'Clean air technology creates economic opportunity'], counterpoint: 'Stricter standards can raise energy costs and displace workers in affected industries' },
      { label: 'Practical approach', points: ['Regulations should consider economic impact on workers and industries', 'Technology transitions need realistic timelines', 'Local conditions should inform standards'], counterpoint: 'The Clean Air Act has delivered $2T+ in health benefits — delays cost lives' },
    ],
    sources: [
      { label: 'EPA — Clean Air Act Overview', url: 'https://www.epa.gov/clean-air-act-overview', type: 'government' },
      { label: 'American Lung Association — State of the Air', url: 'https://www.lung.org/research/sota', type: 'nonpartisan' },
      { label: 'CRS — Air Quality Policy', url: 'https://crsreports.congress.gov/product/pdf/R/R47235', type: 'government' },
    ],
  },
  'Clean Water': {
    summary: 'Clean water policy covers drinking water safety, infrastructure upgrades, PFAS contamination, agricultural runoff, and wastewater treatment.',
    keyStats: [
      { value: '9.2M', label: 'Lead service lines still in use across the U.S.', source: 'EPA, 2024', sourceUrl: 'https://www.epa.gov/ground-water-and-drinking-water/lead-service-line-replacement' },
      { value: '$625B', label: 'Estimated investment needed for water infrastructure over 20 years', source: 'EPA Water Infrastructure Needs Survey, 2023' },
      { value: '100M+', label: 'Americans potentially exposed to PFAS in drinking water', source: 'USGS, 2023' },
    ],
    currentEvents: [
      'Ongoing lead pipe replacement funded by infrastructure law',
      'PFAS "forever chemicals" found in drinking water nationwide',
      'Aging water infrastructure needs trillions in investment',
    ],
    commonAsks: [
      { label: 'Replace lead pipes', ask: 'Accelerate replacement of lead pipes to protect children and families' },
      { label: 'Regulate PFAS', ask: 'Set enforceable limits on PFAS contamination in drinking water' },
      { label: 'Fund infrastructure', ask: 'Increase funding for water infrastructure upgrades in aging systems' },
      { label: 'Polluter accountability', ask: 'Hold polluters financially responsible for cleaning up water contamination' },
      { label: 'Protect wetlands', ask: 'Restore Clean Water Act protections for wetlands and streams that filter drinking water' },
    ],
    perspectives: [
      { label: 'Federal standards', points: ['Safe water is a basic right that requires strong standards', 'Local systems need federal help to replace aging infrastructure', 'PFAS contamination is a nationwide problem requiring a national response'], counterpoint: 'Unfunded federal mandates shift billions in costs to local ratepayers' },
      { label: 'Local control', points: ['States and localities understand their water systems best', 'Federal mandates without funding shift costs to ratepayers', 'Regulations should be based on sound science and cost-benefit analysis'], counterpoint: 'Flint, Jackson, and hundreds of other cities show local systems fail without federal oversight' },
    ],
    sources: [
      { label: 'EPA — Drinking Water Data', url: 'https://www.epa.gov/ground-water-and-drinking-water', type: 'government' },
      { label: 'USGS — PFAS in Drinking Water', url: 'https://www.usgs.gov/news/national-news-release/tap-water-study-detects-pfas-forever-chemicals-across-us', type: 'government' },
      { label: 'American Water Works Association', url: 'https://www.awwa.org/Policy-Advocacy/AWWA-Policy-Statements', type: 'nonpartisan' },
    ],
  },
  // Housing subtopics (missing)
  'Rent': {
    summary: 'Rent policy covers affordability, tenant protections, eviction processes, and whether rent stabilization helps or hurts the housing market.',
    keyStats: [
      { value: '50%+', label: 'Of renters are cost-burdened (spending 30%+ of income on rent)', source: 'Harvard JCHS, 2024', sourceUrl: 'https://www.jchs.harvard.edu/state-nations-housing-2024' },
      { value: '3.6M', label: 'Eviction filings annually in the U.S.', source: 'Eviction Lab, Princeton, 2024', sourceUrl: 'https://evictionlab.org/' },
      { value: '30%+', label: 'Rent increase in many metro areas since 2020', source: 'Zillow Rent Index, 2024' },
    ],
    currentEvents: [
      'Rents have increased significantly in most metro areas',
      'Eviction filings rising after pandemic-era protections expired',
      'Debates over rent control and tenant protection legislation',
    ],
    commonAsks: [
      { label: 'Rent stabilization', ask: 'Support rent stabilization measures to prevent extreme rent increases' },
      { label: 'Tenant protections', ask: 'Strengthen tenant protections against unfair evictions and fee gouging' },
      { label: 'Build more housing', ask: 'Focus on increasing housing supply rather than price controls' },
      { label: 'Landlord fairness', ask: 'Balance tenant protections with the ability of landlords to maintain and invest in properties' },
      { label: 'Rental assistance', ask: 'Expand emergency rental assistance programs to prevent evictions before they happen' },
      { label: 'Ban junk fees', ask: 'Ban hidden junk fees in rental applications and leases that surprise tenants' },
    ],
    perspectives: [
      { label: 'Protect renters', points: ['Housing instability harms families, health, and children\'s education', 'Renters need protections against sudden, extreme increases', 'Eviction prevention saves money compared to homelessness services'], counterpoint: 'Strict rent controls can reduce housing supply by discouraging new construction' },
      { label: 'Market approach', points: ['Rent control discourages new construction and reduces supply', 'More housing supply is the most effective way to lower rents', 'Property owners need predictability to invest in maintenance'], counterpoint: 'Building alone takes years — renters facing 30%+ increases need relief now' },
    ],
    sources: [
      { label: 'Harvard JCHS — State of Housing', url: 'https://www.jchs.harvard.edu/state-nations-housing-2024', type: 'academic' },
      { label: 'Eviction Lab — Princeton University', url: 'https://evictionlab.org/', type: 'academic' },
      { label: 'NLIHC — Out of Reach Report', url: 'https://nlihc.org/oor', type: 'nonpartisan' },
    ],
  },
  'Mortgage Rates': {
    summary: 'Mortgage rates affect whether families can afford to buy homes. Rates are influenced by the Federal Reserve, inflation, and housing market conditions.',
    keyStats: [
      { value: '~7%', label: 'Average 30-year fixed mortgage rate (up from ~3% in 2021)', source: 'Freddie Mac, 2024', sourceUrl: 'https://www.freddiemac.com/pmms' },
      { value: '$2,200+', label: 'Median monthly mortgage payment for new buyers', source: 'NAR, 2024' },
      { value: '33%', label: 'Drop in home affordability since 2020', source: 'Federal Reserve Bank of Atlanta, 2024' },
    ],
    currentEvents: [
      'Higher mortgage rates have significantly reduced home affordability',
      'Low housing inventory and high rates creating a "lock-in" effect for existing homeowners',
      'First-time buyers face especially steep barriers to homeownership',
    ],
    commonAsks: [
      { label: 'First-time buyer help', ask: 'Expand first-time homebuyer programs including down payment assistance' },
      { label: 'Increase supply', ask: 'Address the housing supply shortage to bring down home prices' },
      { label: 'Keep government out', ask: 'Let the market set mortgage rates without government intervention' },
      { label: 'Zoning reform', ask: 'Reform local zoning laws that restrict new housing construction' },
    ],
    perspectives: [
      { label: 'Assist buyers', points: ['Homeownership is how most families build wealth', 'Current rates lock out an entire generation of buyers', 'Targeted assistance helps without distorting the market'], counterpoint: 'Demand-side subsidies without more supply can push prices even higher' },
      { label: 'Let markets work', points: ['Government subsidies can inflate prices further', 'Supply-side solutions address the root problem', 'Artificially low rates contributed to past housing bubbles'], counterpoint: 'Without assistance, the homeownership gap between white and Black families remains near its 1960s level' },
    ],
    sources: [
      { label: 'Freddie Mac — Mortgage Rate Survey', url: 'https://www.freddiemac.com/pmms', type: 'government' },
      { label: 'NAR — Housing Affordability Index', url: 'https://www.nar.realtor/research-and-statistics/housing-statistics/housing-affordability-index', type: 'nonpartisan' },
      { label: 'Federal Reserve — Mortgage Data', url: 'https://www.federalreserve.gov/releases/h15/', type: 'government' },
    ],
  },
  // Taxation subtopics (missing)
  'Tax Reform': {
    summary: 'Tax reform efforts aim to simplify the tax code, close loopholes, adjust rates, and make the system fairer — though what "fairer" means depends on your perspective.',
    keyStats: [
      { value: '$4.4T', label: 'Cost to extend all 2017 TCJA provisions over 10 years', source: 'CBO, 2024', sourceUrl: 'https://www.cbo.gov/topics/taxes' },
      { value: '$600B+', label: 'Annual tax gap (taxes owed but not collected)', source: 'IRS, 2024' },
      { value: '6.5B hours', label: 'Americans spend on tax compliance annually', source: 'IRS Taxpayer Advocate, 2024' },
    ],
    currentEvents: [
      'Tax Cuts and Jobs Act provisions set to expire, prompting a major reform debate',
      'Proposals range from flat taxes to expanded credits to wealth taxes',
      'Complexity of the code costs Americans billions in compliance time and fees',
    ],
    commonAsks: [
      { label: 'Simplify filing', ask: 'Simplify the tax code so most Americans can file easily without professional help' },
      { label: 'Close loopholes', ask: 'Close tax loopholes that allow some to pay less than their fair share' },
      { label: 'Lower rates', ask: 'Lower tax rates for individuals and businesses to spur economic growth' },
      { label: 'Progressive reform', ask: 'Make the tax code more progressive so higher earners contribute more' },
    ],
    perspectives: [
      { label: 'Simpler and lower', points: ['The current code is too complex and costly to comply with', 'Lower rates encourage investment and job creation', 'Fewer loopholes mean a broader, fairer base'], counterpoint: 'Previous "simplification" efforts like the 2017 TCJA added to the deficit without closing major loopholes' },
      { label: 'More equitable', points: ['The wealthy often pay lower effective rates than workers', 'Revenue from closing loopholes can fund essential services', 'The tax code should reduce inequality, not increase it'], counterpoint: 'The top 1% already pay 46% of all federal income taxes' },
    ],
    sources: [
      { label: 'CBO — Tax Topics', url: 'https://www.cbo.gov/topics/taxes', type: 'government' },
      { label: 'Tax Policy Center — Briefing Book', url: 'https://www.taxpolicycenter.org/briefing-book', type: 'nonpartisan' },
      { label: 'IRS — Tax Gap Estimates', url: 'https://www.irs.gov/statistics/tax-gap-estimates', type: 'government' },
    ],
  },
  // Social Welfare subtopics (missing)
  'Disability Benefits': {
    summary: 'Social Security Disability Insurance (SSDI) and Supplemental Security Income (SSI) provide income to Americans with disabilities. Application wait times can stretch over a year.',
    keyStats: [
      { value: '13M+', label: 'Americans receiving SSDI or SSI disability benefits', source: 'SSA, 2024', sourceUrl: 'https://www.ssa.gov/policy/docs/quickfacts/stat_snapshot/' },
      { value: '$943', label: 'Maximum monthly SSI benefit (below the federal poverty line)', source: 'SSA, 2024' },
      { value: '1.1M+', label: 'Pending disability applications in the backlog', source: 'SSA, 2024' },
      { value: '6+ months', label: 'Average initial disability determination wait time', source: 'SSA, 2024' },
    ],
    currentEvents: [
      'Application backlogs and long wait times for disability determinations',
      'Debates over benefit adequacy — SSI maximum is below the poverty line',
      'Work incentive programs aimed at helping beneficiaries return to work',
    ],
    commonAsks: [
      { label: 'Reduce wait times', ask: 'Hire more administrative law judges to reduce the disability application backlog' },
      { label: 'Increase benefits', ask: 'Raise SSI benefit levels above the poverty line' },
      { label: 'Work incentives', ask: 'Improve work incentive programs so people can work without losing benefits abruptly' },
      { label: 'Prevent fraud', ask: 'Strengthen oversight to prevent disability fraud while protecting legitimate claimants' },
      { label: 'Expand ABLE accounts', ask: 'Expand ABLE savings accounts so people with disabilities can save without losing benefits' },
      { label: 'Eliminate marriage penalty', ask: 'Eliminate the SSI marriage penalty that cuts benefits when disabled individuals marry' },
    ],
    perspectives: [
      { label: 'Strengthen the safety net', points: ['People with disabilities deserve adequate support', 'The application process is inhumane — people die waiting', 'Benefits haven\'t kept up with the cost of living'], counterpoint: 'The SSDI rolls grew significantly in recent decades, raising questions about program design' },
      { label: 'Reform for sustainability', points: ['The system needs better oversight to ensure it helps those truly in need', 'Work incentives help people regain independence', 'Long-term solvency requires smart reforms'], counterpoint: 'Fraud is under 1% of payments — most denied applicants are genuinely disabled and die waiting for appeals' },
    ],
    sources: [
      { label: 'SSA — Disability Fact Sheet', url: 'https://www.ssa.gov/policy/docs/quickfacts/stat_snapshot/', type: 'government' },
      { label: 'CBO — Disability Insurance', url: 'https://www.cbo.gov/topics/social-security', type: 'government' },
      { label: 'Center on Budget — SSI Overview', url: 'https://www.cbpp.org/research/social-security/supplemental-security-income', type: 'nonpartisan' },
    ],
  },
  'Safety Net Programs': {
    summary: 'Federal safety net programs include SNAP (food assistance), TANF (cash assistance), WIC (nutrition for mothers and children), and housing assistance.',
    keyStats: [
      { value: '42M+', label: 'Americans receiving SNAP benefits', source: 'USDA FNS, 2024', sourceUrl: 'https://www.fns.usda.gov/pd/supplemental-nutrition-assistance-program-snap' },
      { value: '$6.20', label: 'Average daily SNAP benefit per person', source: 'USDA FNS, 2024' },
      { value: '37M', label: 'Americans lifted out of poverty by safety net programs (2021)', source: 'Census Bureau SPM, 2023' },
    ],
    currentEvents: [
      'Debates over work requirements for SNAP and other benefit programs',
      'SNAP benefit adjustments and eligibility changes',
      'Pandemic-era expansions have expired, affecting millions of families',
    ],
    commonAsks: [
      { label: 'Protect benefits', ask: 'Protect SNAP, WIC, and other safety net programs from cuts' },
      { label: 'Add work requirements', ask: 'Add or strengthen work requirements for able-bodied adults receiving benefits' },
      { label: 'Expand eligibility', ask: 'Expand eligibility for safety net programs to cover more working families' },
      { label: 'Block grants to states', ask: 'Convert programs to block grants so states have more flexibility in how they serve residents' },
      { label: 'Expand EITC', ask: 'Expand the Earned Income Tax Credit to lift more working families out of poverty' },
    ],
    perspectives: [
      { label: 'Protect and expand', points: ['These programs keep millions out of poverty', 'Most recipients are working families, children, elderly, or disabled', 'Hunger and poverty cost more in healthcare and lost productivity'], counterpoint: 'Poorly designed programs can create dependency and discourage work' },
      { label: 'Reform and accountability', points: ['Programs should encourage self-sufficiency', 'States know their populations best and need flexibility', 'Spending must be sustainable long-term'], counterpoint: 'TANF block grants let states divert funds — only 23% of TANF spending goes to cash assistance' },
    ],
    sources: [
      { label: 'USDA — SNAP Data', url: 'https://www.fns.usda.gov/pd/supplemental-nutrition-assistance-program-snap', type: 'government' },
      { label: 'CBPP — Safety Net Programs', url: 'https://www.cbpp.org/research/poverty-and-inequality/economic-security-programs-cut-poverty-nearly-in-half-over-last-50', type: 'nonpartisan' },
      { label: 'Census — Supplemental Poverty Measure', url: 'https://www.census.gov/topics/income-poverty/supplemental-poverty-measure.html', type: 'government' },
    ],
  },
  // Armed Forces subtopics (missing)
  'Veterans': {
    summary: 'Over 18 million Americans are veterans. Key issues include healthcare access through the VA, disability benefits, mental health, homelessness, and the transition to civilian life.',
    keyStats: [
      { value: '18.5M', label: 'U.S. military veterans', source: 'VA, 2024', sourceUrl: 'https://www.va.gov/vetdata/' },
      { value: '17/day', label: 'Veterans who die by suicide', source: 'VA National Suicide Data Report, 2024' },
      { value: '3.5M+', label: 'Veterans enrolled in PACT Act-expanded care', source: 'VA, 2024' },
      { value: '35,574', label: 'Veterans experiencing homelessness', source: 'HUD, 2024' },
    ],
    currentEvents: [
      'PACT Act expanded benefits for veterans exposed to burn pits and toxic substances',
      'VA modernization efforts to reduce wait times and improve care',
      'Veteran suicide prevention remains a major focus',
    ],
    commonAsks: [
      { label: 'Expand VA care', ask: 'Expand VA healthcare access and reduce wait times for veterans' },
      { label: 'Mental health resources', ask: 'Increase mental health and suicide prevention resources for veterans' },
      { label: 'Community care options', ask: 'Expand community care options so veterans can see private doctors when VA wait times are too long' },
      { label: 'Transition support', ask: 'Improve programs that help veterans transition to civilian careers' },
      { label: 'Fund PACT Act fully', ask: 'Fully fund the PACT Act to ensure all veterans exposed to burn pits and toxins receive care' },
      { label: 'Support military families', ask: 'Expand support for military families including spouse employment programs and childcare' },
    ],
    perspectives: [
      { label: 'Strengthen the VA', points: ['Veterans earned their care through service', 'The VA understands veteran-specific needs better than private providers', 'Funding the VA properly solves most access problems'], counterpoint: 'Wait times at some VA facilities still exceed 30 days — veterans need options now' },
      { label: 'More options', points: ['Veterans deserve the freedom to choose their healthcare provider', 'Competition improves quality for veterans', 'Not every veteran lives near a VA facility'], counterpoint: 'Private providers often lack expertise in veteran-specific conditions like PTSD and toxic exposure' },
    ],
    sources: [
      { label: 'VA — Veteran Data', url: 'https://www.va.gov/vetdata/', type: 'government' },
      { label: 'VA — National Suicide Prevention Report', url: 'https://www.mentalhealth.va.gov/suicide_prevention/data.asp', type: 'government' },
      { label: 'CRS — Veterans Policy', url: 'https://crsreports.congress.gov/product/pdf/R/R44837', type: 'government' },
    ],
  },
  'Military Funding': {
    summary: 'The U.S. military budget is the largest in the world. Debates focus on whether spending levels are adequate, how funds are allocated, and what threats to prioritize.',
    keyStats: [
      { value: '$886B', label: 'FY2024 National Defense Authorization (NDAA)', source: 'DOD, 2024', sourceUrl: 'https://comptroller.defense.gov/Budget-Materials/' },
      { value: '39%', label: 'Of global military spending is by the U.S. alone', source: 'SIPRI, 2024' },
      { value: '0', label: 'Times the Pentagon has passed a comprehensive audit', source: 'GAO, 2024' },
    ],
    currentEvents: [
      'Annual defense budget exceeds $800 billion',
      'Competition with China driving modernization and technology investment',
      'Military recruitment challenges across service branches',
    ],
    commonAsks: [
      { label: 'Increase funding', ask: 'Increase military funding to maintain readiness and deter adversaries' },
      { label: 'Audit spending', ask: 'Require the Pentagon to pass a full audit and eliminate waste' },
      { label: 'Redirect to domestic', ask: 'Redirect some military spending toward domestic priorities like infrastructure and education' },
      { label: 'Modernize', ask: 'Prioritize military modernization and technology over legacy systems' },
    ],
    perspectives: [
      { label: 'Strong defense', points: ['Peace through strength deters conflict', 'Threats from China, Russia, and others are growing', 'Underfunding the military risks national security'], counterpoint: 'The U.S. spends more than the next 10 nations combined — the issue is efficiency, not amount' },
      { label: 'Smarter spending', points: ['The Pentagon has never passed a full audit', 'Spending more doesn\'t always mean better outcomes', 'Domestic investments also strengthen national security'], counterpoint: 'China\'s military spending is growing 7%+ annually — falling behind has real consequences' },
    ],
    sources: [
      { label: 'DOD — Budget Materials', url: 'https://comptroller.defense.gov/Budget-Materials/', type: 'government' },
      { label: 'SIPRI — Military Expenditure Database', url: 'https://www.sipri.org/databases/milex', type: 'nonpartisan' },
      { label: 'GAO — DOD Financial Management', url: 'https://www.gao.gov/products/gao-24-105572', type: 'government' },
    ],
  },
  'Defense Spending': {
    summary: 'Defense spending policy covers weapons procurement, military pay, base operations, research and development, and allied burden-sharing.',
    keyStats: [
      { value: '$145B+', label: 'Annual DOD research and development spending', source: 'DOD, 2024', sourceUrl: 'https://comptroller.defense.gov/Budget-Materials/' },
      { value: '750+', label: 'U.S. military bases in 80+ countries', source: 'DOD Base Structure Report, 2024' },
      { value: '23 of 31', label: 'NATO allies now meeting the 2% GDP defense target', source: 'NATO, 2024' },
    ],
    currentEvents: [
      'New weapons systems (hypersonic, AI, space) driving R&D spending',
      'Debates over force structure — fewer troops, more technology',
      'Allied nations increasing their own defense spending',
    ],
    commonAsks: [
      { label: 'Invest in technology', ask: 'Prioritize defense R&D in AI, cyber, and emerging technologies' },
      { label: 'Maintain force strength', ask: 'Maintain troop levels and readiness to meet current threats' },
      { label: 'Allies pay more', ask: 'Insist that allied nations meet their own defense spending commitments' },
      { label: 'Cut excess', ask: 'Close unneeded bases and cut legacy programs to free up funds' },
    ],
    perspectives: [
      { label: 'Maintain superiority', points: ['Technological superiority is the cornerstone of national defense', 'Adversaries are investing heavily — we must keep pace', 'Defense jobs support communities across the country'], counterpoint: 'Cost overruns on major weapons programs waste billions that could fund readiness' },
      { label: 'Efficient spending', points: ['Throwing money at defense doesn\'t guarantee security', 'The Pentagon needs accountability before more funding', 'Diplomacy and alliances can be more cost-effective'], counterpoint: 'Cutting defense while adversaries expand creates real risk of deterrence failure' },
    ],
    sources: [
      { label: 'DOD — Budget Overview', url: 'https://comptroller.defense.gov/Budget-Materials/', type: 'government' },
      { label: 'CRS — Defense Spending', url: 'https://crsreports.congress.gov/product/pdf/R/R47614', type: 'government' },
      { label: 'SIPRI — Arms and Military Expenditure', url: 'https://www.sipri.org/research/armament-and-disarmament/arms-and-military-expenditure', type: 'nonpartisan' },
    ],
  },
  // Civil Rights subtopics (missing)
  'Discrimination': {
    summary: 'Anti-discrimination policy covers protections in employment, housing, education, and public services based on race, gender, religion, disability, and other characteristics.',
    keyStats: [
      { value: '73,000+', label: 'Workplace discrimination charges filed with the EEOC annually', source: 'EEOC, 2024', sourceUrl: 'https://www.eeoc.gov/data/charge-statistics-charges-filed-eeoc-fy-1997-through-fy-2023' },
      { value: '83 cents', label: 'Women earn per dollar earned by men (wider gap for women of color)', source: 'Census Bureau, 2024' },
      { value: '33%', label: 'Of Black mortgage applicants denied vs. 17% of white applicants', source: 'HMDA/CFPB, 2024' },
    ],
    currentEvents: [
      'Supreme Court rulings on affirmative action in college admissions',
      'Debates over diversity, equity, and inclusion (DEI) programs',
      'Enforcement of workplace discrimination protections',
    ],
    commonAsks: [
      { label: 'Strengthen enforcement', ask: 'Strengthen enforcement of existing anti-discrimination laws' },
      { label: 'Color-blind policy', ask: 'Support color-blind, merit-based policies rather than race-conscious ones' },
      { label: 'Protect DEI', ask: 'Protect diversity and inclusion programs that address systemic barriers' },
      { label: 'Religious exemptions', ask: 'Ensure anti-discrimination law includes protections for sincerely held religious beliefs' },
      { label: 'Pass the CROWN Act', ask: 'Pass the CROWN Act to ban race-based hair discrimination in workplaces and schools' },
    ],
    perspectives: [
      { label: 'Active remedies', points: ['Historical discrimination created barriers that persist today', 'Diverse institutions perform better and serve more people', 'Enforcement is essential because discrimination still occurs'], counterpoint: 'Race-conscious policies can create new inequities and violate the principle of equal treatment' },
      { label: 'Equal treatment', points: ['The law should treat everyone the same regardless of identity', 'Merit-based systems are the fairest approach', 'Government mandates can have unintended consequences'], counterpoint: '73,000+ EEOC complaints a year show discrimination persists — ignoring it doesn\'t make it go away' },
    ],
    sources: [
      { label: 'EEOC — Charge Statistics', url: 'https://www.eeoc.gov/data/charge-statistics-charges-filed-eeoc-fy-1997-through-fy-2023', type: 'government' },
      { label: 'Census Bureau — Income and Earnings', url: 'https://www.census.gov/topics/income-poverty/income.html', type: 'government' },
      { label: 'Brookings — Race and Equity', url: 'https://www.brookings.edu/topic/race-equity/', type: 'nonpartisan' },
    ],
  },
  'Free Speech': {
    summary: 'Free speech policy covers First Amendment protections, campus speech, protest rights, government censorship, and the line between free expression and harmful speech.',
    keyStats: [
      { value: '1st', label: 'Amendment ratified in 1791 — cornerstone of the Bill of Rights', source: 'National Archives' },
      { value: '77%', label: 'Americans who say it\'s very important to be able to speak freely', source: 'Pew Research, 2024', sourceUrl: 'https://www.pewresearch.org/topic/politics-policy/political-issues/free-speech/' },
      { value: '900+', label: 'Campus speaker disinvitation attempts since 2000', source: 'FIRE, 2024', sourceUrl: 'https://www.thefire.org/research-learn/campus-disinvitation-database' },
    ],
    currentEvents: [
      'Campus speech codes and speaker disinvitation debates',
      'Government involvement in social media content moderation under scrutiny',
      'Protest rights and laws restricting demonstrations',
    ],
    commonAsks: [
      { label: 'Protect all speech', ask: 'Protect broad free speech rights including speech that is controversial or unpopular' },
      { label: 'Campus free speech', ask: 'Pass legislation protecting free speech and open debate on college campuses' },
      { label: 'Limit harmful speech', ask: 'Establish reasonable limits on speech that directly incites violence or harassment' },
      { label: 'Government neutrality', ask: 'Prevent the government from pressuring private platforms to censor lawful speech' },
    ],
    perspectives: [
      { label: 'Broad protections', points: ['Free speech is the foundation of democracy', 'Unpopular speech is exactly what the First Amendment protects', 'Government should never be the arbiter of acceptable ideas'], counterpoint: 'Targeted harassment and incitement cause real harm that abstract principles don\'t address' },
      { label: 'Responsible limits', points: ['Free speech doesn\'t mean freedom from consequences', 'Some speech causes real harm to vulnerable communities', 'Platforms and institutions can set standards without violating the First Amendment'], counterpoint: 'Once government defines "harmful" speech, every administration can silence its critics' },
    ],
    sources: [
      { label: 'CRS — Free Speech Overview', url: 'https://crsreports.congress.gov/product/pdf/IF/IF11072', type: 'government' },
      { label: 'FIRE — Campus Free Speech', url: 'https://www.thefire.org/', type: 'nonpartisan' },
      { label: 'Knight Foundation — Free Expression Research', url: 'https://knightfoundation.org/topics/free-expression/', type: 'nonpartisan' },
    ],
  },
  // Labor subtopics (missing)
  'Worker Rights': {
    summary: 'Worker rights policy covers workplace safety, overtime protections, gig worker classification, anti-retaliation, and the balance between employer flexibility and employee protections.',
    keyStats: [
      { value: '5,486', label: 'Workers killed on the job in 2022', source: 'BLS, 2024', sourceUrl: 'https://www.bls.gov/iif/fatal-injuries.htm' },
      { value: '59M', label: 'U.S. workers classified as independent contractors or gig workers', source: 'McKinsey, 2023' },
      { value: '$2,100', label: 'Median weekly earnings gap between misclassified and properly classified workers', source: 'EPI, 2024', sourceUrl: 'https://www.epi.org/publication/misclassification/' },
    ],
    currentEvents: [
      'Gig worker classification debates (employee vs. independent contractor)',
      'Remote work policies and employer flexibility after the pandemic',
      'OSHA enforcement and workplace safety standards',
    ],
    commonAsks: [
      { label: 'Classify gig workers', ask: 'Classify gig workers as employees so they receive benefits and protections' },
      { label: 'Strengthen OSHA', ask: 'Strengthen workplace safety enforcement and increase OSHA funding' },
      { label: 'Worker flexibility', ask: 'Preserve worker flexibility and independent contractor status for those who want it' },
      { label: 'Overtime protections', ask: 'Expand overtime pay protections to cover more salaried workers' },
      { label: 'Ban non-competes', ask: 'Ban non-compete agreements that trap workers and suppress wages' },
    ],
    perspectives: [
      { label: 'Stronger protections', points: ['Workers are the backbone of the economy and deserve fair treatment', 'Misclassification denies workers benefits they\'ve earned', 'Safety regulations save lives'], counterpoint: 'Strict classification rules eliminate flexible work arrangements that millions of workers actually prefer' },
      { label: 'Flexibility and choice', points: ['Many workers prefer independent contractor flexibility', 'Over-regulation increases costs and reduces opportunities', 'Businesses need flexibility to compete and create jobs'], counterpoint: 'Misclassified workers lose health insurance, unemployment insurance, and retirement benefits worth thousands per year' },
    ],
    sources: [
      { label: 'BLS — Workplace Fatalities', url: 'https://www.bls.gov/iif/fatal-injuries.htm', type: 'government' },
      { label: 'DOL — Worker Classification', url: 'https://www.dol.gov/agencies/whd/flsa/misclassification', type: 'government' },
      { label: 'EPI — Worker Misclassification', url: 'https://www.epi.org/publication/misclassification/', type: 'nonpartisan' },
    ],
  },
  'Unions': {
    summary: 'Union policy covers the right to organize, collective bargaining, right-to-work laws, and whether labor law should be reformed to make organizing easier or harder.',
    keyStats: [
      { value: '10%', label: 'U.S. union membership rate (down from 35% in 1954)', source: 'BLS, 2024', sourceUrl: 'https://www.bls.gov/news.release/union2.nr0.htm' },
      { value: '$1,216/wk', label: 'Median union weekly earnings vs. $1,029 for nonunion workers', source: 'BLS, 2024' },
      { value: '71%', label: 'Americans who approve of labor unions (near 60-year high)', source: 'Gallup, 2024', sourceUrl: 'https://news.gallup.com/poll/354455/approval-labor-unions-highest-point-1965.aspx' },
    ],
    currentEvents: [
      'High-profile organizing efforts at major companies (Amazon, Starbucks, etc.)',
      'PRO Act (Protecting the Right to Organize) debated in Congress',
      'Right-to-work laws in place in roughly half the states',
    ],
    commonAsks: [
      { label: 'Pass the PRO Act', ask: 'Pass the PRO Act to strengthen workers\' right to organize and bargain collectively' },
      { label: 'Protect right to organize', ask: 'Protect workers from retaliation when they try to form or join a union' },
      { label: 'Right-to-work', ask: 'Support right-to-work laws so no one is forced to pay union dues as a condition of employment' },
      { label: 'Modernize labor law', ask: 'Update labor law to reflect the modern economy including gig and remote work' },
    ],
    perspectives: [
      { label: 'Support organizing', points: ['Unions helped build the middle class', 'Collective bargaining gives workers a fair voice', 'Union workers earn higher wages and better benefits on average'], counterpoint: 'Union contracts can protect underperformers and make it harder to reward top talent' },
      { label: 'Worker freedom', points: ['Workers should choose whether to join a union without pressure', 'Unions can make businesses less competitive', 'Right-to-work protects individual choice'], counterpoint: 'The decline of unions tracks directly with the decline of middle-class wages and rising inequality' },
    ],
    sources: [
      { label: 'BLS — Union Membership Data', url: 'https://www.bls.gov/news.release/union2.nr0.htm', type: 'government' },
      { label: 'NLRB — Rights & Protections', url: 'https://www.nlrb.gov/about-nlrb/rights-we-protect', type: 'government' },
      { label: 'EPI — Unions and Shared Prosperity', url: 'https://www.epi.org/publication/unions-help-reduce-disparities-and-strengthen-our-democracy/', type: 'nonpartisan' },
    ],
  },
  // Additional Food Assistance subtopic
  'Food Assistance': {
    summary: 'SNAP (formerly food stamps) serves roughly 40 million Americans. Policy debates focus on benefit levels, eligibility, work requirements, and nutrition standards.',
    keyStats: [
      { value: '42M+', label: 'Americans receiving SNAP benefits', source: 'USDA FNS, 2024', sourceUrl: 'https://www.fns.usda.gov/pd/supplemental-nutrition-assistance-program-snap' },
      { value: '$6.20/day', label: 'Average SNAP benefit per person per day', source: 'USDA FNS, 2024' },
      { value: '65%', label: 'SNAP households with children, elderly, or disabled members', source: 'CBPP, 2024', sourceUrl: 'https://www.cbpp.org/research/food-assistance/a-quick-guide-to-snap-eligibility-and-benefits' },
    ],
    currentEvents: [
      'SNAP benefit levels adjusted after pandemic-era expansions ended',
      'Work requirement proposals for able-bodied adults in farm bill debates',
      'Rising food costs putting pressure on both families and program budgets',
    ],
    commonAsks: [
      { label: 'Protect SNAP', ask: 'Protect SNAP funding and oppose cuts to food assistance' },
      { label: 'Work requirements', ask: 'Support work requirements for able-bodied SNAP recipients without dependents' },
      { label: 'Increase benefits', ask: 'Increase SNAP benefits to keep up with rising food costs' },
      { label: 'Improve nutrition', ask: 'Update SNAP nutrition standards to encourage healthier food choices' },
      { label: 'Expand school meals', ask: 'Make free school meals universal so no child goes hungry during the school day' },
      { label: 'Fund food banks', ask: 'Increase federal support for food banks and emergency food programs' },
    ],
    perspectives: [
      { label: 'Protect the program', points: ['SNAP is the front line against hunger in America', 'Most recipients are children, elderly, or working adults', 'Hunger reduces productivity and increases healthcare costs'], counterpoint: 'Some recipients could work but lack incentive when benefits have no conditions' },
      { label: 'Reform the program', points: ['Work requirements encourage self-sufficiency', 'The program should focus on those who truly need it', 'Better nutrition standards improve outcomes'], counterpoint: 'Most SNAP recipients who can work already do — the majority are children, elderly, or disabled' },
    ],
    sources: [
      { label: 'USDA FNS — SNAP Data', url: 'https://www.fns.usda.gov/pd/supplemental-nutrition-assistance-program-snap', type: 'government' },
      { label: 'CBPP — SNAP Guide', url: 'https://www.cbpp.org/research/food-assistance/a-quick-guide-to-snap-eligibility-and-benefits', type: 'nonpartisan' },
      { label: 'CRS — SNAP Overview', url: 'https://crsreports.congress.gov/product/pdf/R/R42505', type: 'government' },
    ],
  },
  // Nuclear Energy subtopic
  'Nuclear Energy': {
    summary: 'Nuclear energy provides about 20% of U.S. electricity with near-zero carbon emissions. Policy debates focus on safety, waste, costs, and the role of nuclear in the energy mix.',
    keyStats: [
      { value: '~20%', label: 'Share of U.S. electricity from nuclear power', source: 'EIA, 2024', sourceUrl: 'https://www.eia.gov/energyexplained/nuclear/nuclear-power-and-the-environment.php' },
      { value: '93', label: 'Operating commercial nuclear reactors in the U.S.', source: 'NRC, 2024', sourceUrl: 'https://www.nrc.gov/reactors/operating.html' },
      { value: '~$30B', label: 'Estimated cost of a new large-scale nuclear plant', source: 'EIA, 2024' },
    ],
    currentEvents: [
      'Renewed interest in nuclear as a clean energy source',
      'Small modular reactors (SMRs) advancing through regulatory approval',
      'Debates over extending licenses for existing nuclear plants vs. building new ones',
    ],
    commonAsks: [
      { label: 'Expand nuclear', ask: 'Support expansion of nuclear energy as part of a clean energy strategy' },
      { label: 'Fund SMRs', ask: 'Invest in small modular reactor technology to make nuclear cheaper and safer' },
      { label: 'Phase out nuclear', ask: 'Phase out nuclear power due to waste, cost, and safety concerns' },
      { label: 'Solve waste storage', ask: 'Develop a permanent solution for nuclear waste storage' },
    ],
    perspectives: [
      { label: 'Pro-nuclear', points: ['Nuclear is the largest source of carbon-free electricity', 'New designs are safer and produce less waste', 'Nuclear provides reliable baseload power unlike wind and solar'], counterpoint: 'New nuclear plants routinely run billions over budget and decades behind schedule' },
      { label: 'Nuclear skepticism', points: ['Nuclear waste remains dangerous for thousands of years', 'New plants are extremely expensive and slow to build', 'Renewables and storage can fill the same role more cheaply'], counterpoint: 'No energy source matches nuclear for reliable, 24/7 carbon-free electricity at scale' },
    ],
    sources: [
      { label: 'EIA — Nuclear Energy Explained', url: 'https://www.eia.gov/energyexplained/nuclear/', type: 'government' },
      { label: 'NRC — Operating Reactors', url: 'https://www.nrc.gov/reactors/operating.html', type: 'government' },
      { label: 'UCS — Nuclear Power', url: 'https://www.ucsusa.org/resources/nuclear-power-dilemma', type: 'nonpartisan' },
    ],
  },
  'VA Healthcare': {
    summary: 'The VA healthcare system serves over 9 million enrolled veterans. Issues include wait times, quality of care, mental health services, and the balance between VA and private care.',
    keyStats: [
      { value: '9.1M', label: 'Veterans enrolled in VA healthcare', source: 'VA, 2024', sourceUrl: 'https://www.va.gov/health/aboutVHA.asp' },
      { value: '17/day', label: 'Veteran suicides per day on average', source: 'VA National Suicide Data Report, 2024', sourceUrl: 'https://www.mentalhealth.va.gov/suicide_prevention/data.asp' },
      { value: '3.5M+', label: 'Veterans newly eligible under the PACT Act', source: 'VA, 2024' },
    ],
    currentEvents: [
      'PACT Act expanding eligibility for veterans exposed to toxic substances',
      'VA wait times and staffing shortages at some facilities',
      'Community Care program allowing veterans to see private doctors',
    ],
    commonAsks: [
      { label: 'Reduce wait times', ask: 'Hire more VA medical staff to reduce wait times for veteran appointments' },
      { label: 'Expand Community Care', ask: 'Expand the Community Care program so veterans have more options near them' },
      { label: 'Mental health focus', ask: 'Increase VA mental health and suicide prevention resources' },
      { label: 'Strengthen the VA', ask: 'Invest in VA facilities and staff rather than privatizing veteran care' },
      { label: 'Caregiver support', ask: 'Expand the VA Caregiver Support Program to cover more veterans and family caregivers' },
    ],
    perspectives: [
      { label: 'Invest in the VA', points: ['The VA understands veteran-specific conditions like no other system', 'Properly funded, the VA delivers excellent care', 'Privatization fragments care and loses institutional knowledge'], counterpoint: 'Some VA facilities have dangerous wait times that force veterans to go without care' },
      { label: 'Veteran choice', points: ['Veterans should choose where they get care', 'Private options reduce wait times', 'Competition improves quality for everyone'], counterpoint: 'Private providers often lack expertise in combat-related PTSD, TBI, and toxic exposure conditions' },
    ],
    sources: [
      { label: 'VA — About VHA', url: 'https://www.va.gov/health/aboutVHA.asp', type: 'government' },
      { label: 'VA — National Suicide Prevention Data', url: 'https://www.mentalhealth.va.gov/suicide_prevention/data.asp', type: 'government' },
      { label: 'RAND — VA Healthcare Quality', url: 'https://www.rand.org/health-care/projects/military-veterans.html', type: 'nonpartisan' },
    ],
  },
};

export const CATEGORY_CONTEXT: Record<string, TopicInfo> = {
  'Health': {
    summary: 'Healthcare policy covers insurance coverage, drug pricing, hospital access, and public health programs.',
    currentEvents: [
      'Prescription drug price negotiation under the Inflation Reduction Act',
      'Debates over Medicaid expansion in remaining holdout states',
      'Mental health parity enforcement and funding',
    ],
    commonAsks: [
      { label: 'Lower drug prices', ask: 'Support legislation to lower prescription drug costs for consumers' },
      { label: 'Protect Medicare', ask: 'Oppose any cuts to Medicare benefits' },
      { label: 'Expand mental health funding', ask: 'Increase funding for community mental health services' },
      { label: 'Protect ACA coverage', ask: 'Protect the Affordable Care Act and coverage for pre-existing conditions' },
    ],
    perspectives: [
      { label: 'Expand access', points: ['Universal coverage reduces ER costs', 'Preventive care saves money long-term', 'No one should go bankrupt from medical bills'] },
      { label: 'Market-based', points: ['Competition drives down costs', 'More choices give patients power', 'Government programs can be inefficient'] },
    ],
  },
  'Immigration': {
    summary: 'Immigration policy includes border enforcement, visa programs, asylum processing, and pathways to legal status.',
    currentEvents: [
      'Record border encounters and asylum case backlogs',
      'DACA program legal challenges and congressional proposals',
      'H-1B visa reform and agricultural worker shortages',
    ],
    commonAsks: [
      { label: 'Secure the border', ask: 'Support stronger border security measures' },
      { label: 'Protect DACA recipients', ask: 'Pass legislation to protect DACA recipients with a path to citizenship' },
      { label: 'Fix asylum system', ask: 'Reform the asylum process to reduce backlogs while protecting those fleeing persecution' },
      { label: 'Immigration reform', ask: 'Support comprehensive immigration reform' },
    ],
    perspectives: [
      { label: 'Enforcement first', points: ['Secure borders protect communities', 'Legal immigration should be prioritized', 'Existing laws need enforcement'] },
      { label: 'Reform focus', points: ['Immigrants strengthen the economy', 'Families shouldn\'t be separated', 'A path to citizenship reduces undocumented population'] },
    ],
  },
  'Education': {
    summary: 'Education policy covers K-12 schools, higher education, student loans, teacher pay, and curriculum standards.',
    currentEvents: ['Student loan forgiveness programs and repayment reforms', 'Debates over school choice and voucher programs', 'Teacher shortages and compensation nationwide'],
    commonAsks: [
      { label: 'Cancel student debt', ask: 'Support student loan forgiveness to reduce the burden on borrowers' },
      { label: 'Fund public schools', ask: 'Increase federal funding for public schools, especially in underserved areas' },
      { label: 'Support teachers', ask: 'Increase teacher pay and reduce class sizes' },
    ],
    perspectives: [
      { label: 'Invest in public ed', points: ['Equitable funding improves outcomes', 'Public schools serve all communities', 'Teachers need better compensation'] },
      { label: 'Choice & accountability', points: ['Parents should choose their school', 'Competition improves quality', 'Focus on outcomes, not spending'] },
    ],
  },
  'Crime and Law Enforcement': {
    summary: 'Criminal justice policy includes policing, gun policy, sentencing, drug laws, and community safety programs.',
    currentEvents: ['Gun violence prevention legislation and Second Amendment debates', 'Bipartisan criminal justice reform efforts', 'Community policing and mental health crisis response'],
    commonAsks: [
      { label: 'Universal background checks', ask: 'Support universal background checks for all gun purchases' },
      { label: 'Reform sentencing', ask: 'Support sentencing reform to reduce mass incarceration' },
      { label: 'Fund community safety', ask: 'Invest in community-based violence prevention programs' },
    ],
    perspectives: [
      { label: 'More regulation', points: ['Background checks can save lives', 'Community programs reduce violence', 'Mental health and gun access are connected'] },
      { label: 'Protect rights', points: ['Law-abiding citizens have a right to self-defense', 'Enforce existing laws before adding new ones', 'Root causes need addressing'] },
    ],
  },
  'Environmental Protection': {
    summary: 'Environmental policy covers climate change, emissions standards, clean energy, pollution, and conservation.',
    currentEvents: ['Clean energy investments from the Inflation Reduction Act', 'EPA emissions standards for vehicles and power plants', 'Extreme weather events and disaster preparedness'],
    commonAsks: [
      { label: 'Climate action', ask: 'Support aggressive action to reduce carbon emissions and combat climate change' },
      { label: 'Clean energy jobs', ask: 'Invest in clean energy to create jobs and reduce dependence on fossil fuels' },
      { label: 'Protect clean water', ask: 'Strengthen clean water protections and infrastructure' },
    ],
    perspectives: [
      { label: 'Faster action', points: ['Scientific consensus supports action', 'Clean energy creates economic opportunity', 'Extreme weather costs are rising'] },
      { label: 'Measured transition', points: ['Regulations must consider job impacts', 'Energy independence needs all sources', 'Gradual transitions protect workers and communities'] },
    ],
  },
  'Taxation': {
    summary: 'Tax policy includes income tax rates, corporate taxes, deductions, credits, and how revenue funds government services.',
    currentEvents: ['Tax Cuts and Jobs Act provisions set to expire', 'Debates over corporate tax rates and loopholes', 'State and local tax (SALT) deduction cap debates'],
    commonAsks: [
      { label: 'Tax the wealthy', ask: 'Support higher taxes on the wealthiest Americans to fund public services' },
      { label: 'Lower taxes', ask: 'Support lower tax rates to stimulate economic growth' },
      { label: 'Close loopholes', ask: 'Close corporate tax loopholes so all businesses pay their fair share' },
    ],
    perspectives: [
      { label: 'More revenue', points: ['Higher earners can contribute more', 'Revenue funds essential services', 'Tax credits help working families'] },
      { label: 'Lower rates', points: ['Lower taxes spur growth', 'People spend their money better than government', 'Simplify the tax code'] },
    ],
  },
  'Economics and Public Finance': {
    summary: 'Economic policy covers the federal budget, national debt, inflation, and the cost of living.',
    currentEvents: ['Inflation impacts on grocery, housing, and energy costs', 'Federal deficit and debt ceiling debates', 'Interest rate policy and its effect on borrowing costs'],
    commonAsks: [
      { label: 'Reduce inflation', ask: 'Take action to reduce inflation and lower the cost of living' },
      { label: 'Cut spending', ask: 'Reduce federal spending to address the national debt' },
      { label: 'Invest in growth', ask: 'Invest in infrastructure and programs that grow the economy for everyone' },
    ],
    perspectives: [
      { label: 'Invest to grow', points: ['Public investment creates jobs', 'Safety nets stabilize the economy', 'Deficit spending can be strategic'] },
      { label: 'Fiscal discipline', points: ['Debt burdens future generations', 'Government spending fuels inflation', 'Private sector drives growth'] },
    ],
  },
  'Housing and Community Development': {
    summary: 'Housing policy covers affordability, homelessness, zoning, rental protections, and mortgage access.',
    currentEvents: ['Housing affordability crisis affecting renters and buyers', 'Homelessness increasing in major cities', 'Zoning reform debates to allow more housing construction'],
    commonAsks: [
      { label: 'Build more housing', ask: 'Support policies that increase housing supply to bring down costs' },
      { label: 'Rental assistance', ask: 'Expand rental assistance programs for low-income families' },
      { label: 'Address homelessness', ask: 'Fund comprehensive programs to address homelessness including housing-first approaches' },
    ],
    perspectives: [
      { label: 'Build & subsidize', points: ['Housing is a right', 'Government subsidies help vulnerable populations', 'Zoning reform enables building'] },
      { label: 'Market solutions', points: ['Reduce regulations to lower building costs', 'Market-rate housing reduces prices over time', 'Property rights matter'] },
    ],
  },
  'Armed Forces and National Security': {
    summary: 'Defense and veteran policy covers military spending, troop deployments, veteran benefits, and national security.',
    currentEvents: ['Military budget negotiations and modernization priorities', 'VA healthcare access and benefit improvements', 'Global security challenges and troop deployment decisions'],
    commonAsks: [
      { label: 'Support veterans', ask: 'Improve VA healthcare and expand benefits for veterans' },
      { label: 'Increase defense', ask: 'Maintain strong defense spending to protect national security' },
      { label: 'Improve VA services', ask: 'Fix VA wait times and expand mental health services for veterans' },
    ],
    perspectives: [
      { label: 'Strong defense', points: ['Peace through strength', 'Modernization keeps us safe', 'Veterans earned their benefits'] },
      { label: 'Diplomatic focus', points: ['Diplomacy is cheaper than war', 'Overspending crowds out domestic needs', 'Veteran care should be the priority'] },
    ],
  },
  'Social Welfare': {
    summary: 'Social welfare policy covers Social Security, disability benefits, poverty programs, and the social safety net.',
    currentEvents: ['Social Security trust fund projected shortfall', 'Debates over work requirements for benefit programs', 'SNAP benefit levels and eligibility changes'],
    commonAsks: [
      { label: 'Protect Social Security', ask: 'Oppose any cuts to Social Security benefits' },
      { label: 'Expand benefits', ask: 'Strengthen the social safety net for vulnerable Americans' },
      { label: 'Fix disability', ask: 'Reduce wait times and improve the disability benefits process' },
    ],
    perspectives: [
      { label: 'Protect & expand', points: ['Social Security is an earned benefit', 'Safety nets prevent poverty', 'Benefits should keep up with costs'] },
      { label: 'Reform & sustain', points: ['Programs need reform to stay solvent', 'Work incentives help people', 'Means-testing focuses help'] },
    ],
  },
  'Labor and Employment': {
    summary: 'Labor policy covers wages, worker protections, unions, workplace safety, and employment programs.',
    currentEvents: ['Federal minimum wage has not been raised since 2009', 'Gig worker classification and benefits debates', 'Union organizing efforts across industries'],
    commonAsks: [
      { label: 'Raise minimum wage', ask: 'Raise the federal minimum wage to a living wage' },
      { label: 'Protect workers', ask: 'Strengthen worker protections and workplace safety regulations' },
      { label: 'Support unions', ask: 'Protect the right to organize and support union workers' },
    ],
    perspectives: [
      { label: 'Worker power', points: ['Workers deserve a living wage', 'Unions balance corporate power', 'Paid leave is standard in most countries'] },
      { label: 'Business flexibility', points: ['Mandates can reduce hiring', 'Flexible work arrangements benefit both sides', 'Small businesses need different rules'] },
    ],
  },
  'Civil Rights and Liberties, Minority Issues': {
    summary: 'Civil rights policy covers voting access, anti-discrimination protections, free speech, and equality under law.',
    currentEvents: ['Voting rights legislation and state-level voting law changes', 'LGBTQ+ rights protections and legal challenges', 'Affirmative action and anti-discrimination enforcement'],
    commonAsks: [
      { label: 'Protect voting rights', ask: 'Support legislation to protect and expand voting access' },
      { label: 'Anti-discrimination', ask: 'Strengthen anti-discrimination protections in employment and housing' },
      { label: 'LGBTQ+ protections', ask: 'Pass comprehensive non-discrimination protections for LGBTQ+ Americans' },
    ],
    perspectives: [
      { label: 'Expand protections', points: ['Equal rights strengthen democracy', 'Systemic barriers need active remedies', 'Voting should be easy for everyone'] },
      { label: 'Liberty focus', points: ['Government overreach threatens freedom', 'Individual rights must be balanced', 'States should decide many of these issues'] },
    ],
  },
  'Families': {
    summary: 'Family policy covers child care, parental leave, adoption, child welfare, and work-family balance.',
    currentEvents: ['Childcare costs rising faster than wages', 'Federal paid leave proposals debated in Congress', 'Child tax credit expansion debates'],
    commonAsks: [
      { label: 'Affordable child care', ask: 'Support policies that make child care affordable for working families' },
      { label: 'Paid family leave', ask: 'Pass federal paid family leave so parents can bond with newborns without losing income' },
      { label: 'Expand child tax credit', ask: 'Expand the child tax credit to help families with the cost of raising children' },
    ],
    perspectives: [
      { label: 'Public investment', points: ['Families need support to thrive in today\'s economy', 'Affordable child care benefits children and parents', 'Paid leave improves child health and family stability'] },
      { label: 'Family choice', points: ['Parents know best how to raise their children', 'Tax credits give flexibility without government programs', 'Mandates on employers can reduce jobs and wages'] },
    ],
  },
  'Energy': {
    summary: 'Energy policy covers the mix of sources powering the nation — oil, gas, nuclear, solar, wind — and the balance between affordability, reliability, and environmental impact.',
    currentEvents: ['Debates over the pace of transition from fossil fuels to clean energy', 'Energy prices affected by global supply and domestic policy', 'Grid modernization and reliability challenges'],
    commonAsks: [
      { label: 'All-of-the-above', ask: 'Support an all-of-the-above energy strategy that includes fossil fuels and renewables' },
      { label: 'Clean energy', ask: 'Accelerate the transition to clean energy sources' },
      { label: 'Energy independence', ask: 'Prioritize domestic energy production to reduce reliance on foreign sources' },
    ],
    perspectives: [
      { label: 'Transition faster', points: ['Clean energy is now cheaper and creates jobs', 'Climate change requires urgent action', 'Energy independence through renewables'] },
      { label: 'Reliable and affordable', points: ['Fossil fuels ensure reliability today', 'Rapid transitions risk grid stability', 'Energy costs must remain affordable'] },
    ],
  },
  'Foreign Trade and International Finance': {
    summary: 'Trade policy covers tariffs, trade agreements, supply chains, and the balance between protecting domestic industries and keeping consumer prices low.',
    currentEvents: ['Tariffs on imports from multiple countries', 'Supply chain reshoring and "friend-shoring" efforts', 'Trade tensions with major partners'],
    commonAsks: [
      { label: 'Protect American jobs', ask: 'Use tariffs and trade policy to protect American manufacturing jobs' },
      { label: 'Free trade', ask: 'Reduce tariffs and barriers to lower costs for consumers and businesses' },
      { label: 'Fair trade deals', ask: 'Negotiate trade deals that protect workers and the environment' },
    ],
    perspectives: [
      { label: 'Protect industry', points: ['Tariffs bring manufacturing back', 'Trade partners must play by fair rules', 'National security requires domestic production'] },
      { label: 'Open trade', points: ['Tariffs raise costs for consumers', 'Trade creates jobs in export industries', 'Allies benefit from economic cooperation'] },
    ],
  },
  'Science, Technology, Communications': {
    summary: 'Tech policy covers AI regulation, data privacy, social media, broadband access, and how technology affects jobs, elections, and daily life.',
    currentEvents: ['AI regulation proposals advancing', 'Data privacy legislation debated', 'Social media and youth safety concerns'],
    commonAsks: [
      { label: 'Regulate AI', ask: 'Pass legislation requiring transparency and safety standards for AI systems' },
      { label: 'Data privacy', ask: 'Pass a comprehensive federal data privacy law' },
      { label: 'Protect kids online', ask: 'Pass stronger protections for children on social media platforms' },
    ],
    perspectives: [
      { label: 'Regulate technology', points: ['Technology is moving faster than the law', 'Privacy and safety require federal standards', 'Platforms should be accountable'] },
      { label: 'Encourage innovation', points: ['Over-regulation pushes companies overseas', 'The private sector innovates faster than government', 'Light-touch regulation preserves competition'] },
    ],
  },
};

// Look up context: specific issue first, then category fallback
export function getTopicContext(issue: string, category: string): TopicInfo | null {
  return SUBTOPIC_CONTEXT[issue] || CATEGORY_CONTEXT[category] || null;
}
