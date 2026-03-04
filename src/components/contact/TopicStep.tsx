'use client';

import { useState, useMemo, useRef } from 'react';
import type { ContactState, ContactAction } from './ContactFlow';
import type { Official } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { IssuePicker } from '@/components/ui/IssuePicker';

interface TopicStepProps {
  state: ContactState;
  dispatch: React.Dispatch<ContactAction>;
  onBack: () => void;
}

function getPartyColors(party: string): { bg: string; text: string } {
  const p = party.toLowerCase();
  if (p.includes('democrat')) {
    return { bg: 'bg-blue-100', text: 'text-blue-700' };
  }
  if (p.includes('republican')) {
    return { bg: 'bg-red-100', text: 'text-red-700' };
  }
  return { bg: 'bg-gray-100', text: 'text-gray-700' };
}

function OfficialBadge({ official }: { official: Official }) {
  const partyColors = getPartyColors(official.party);

  return (
    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
      <div className="flex items-center gap-2 mb-0.5">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${partyColors.bg} ${partyColors.text}`}>
          {official.party.charAt(0)}
        </span>
      </div>
      <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{official.name}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{official.title}</p>
    </div>
  );
}

// Story starter prompts keyed by issueCategory
const STORY_PROMPTS: Record<string, string[]> = {
  'Health': [
    'I or a family member has been affected by...',
    'My healthcare costs have impacted our family because...',
    'As someone with a pre-existing condition, I...',
  ],
  'Immigration': [
    'As an immigrant / child of immigrants, my experience...',
    'Immigration policy affects my community because...',
    'I have personally seen the impact of enforcement on...',
  ],
  'Education': [
    'As a parent / student / teacher, I have seen...',
    'School funding in my district has affected...',
    'The cost of higher education has meant that I...',
  ],
  'Environmental Protection': [
    'Environmental issues affect my community because...',
    'I have personally experienced the effects of...',
    'Clean air / water is important to me because...',
  ],
  'Crime and Law Enforcement': [
    'I or someone I know has been directly affected by...',
    'Public safety in my neighborhood matters because...',
    'My experience with the justice system showed me...',
  ],
  'Taxation': [
    'As a taxpayer, the current system affects me because...',
    'Tax policy impacts my small business / family budget by...',
    'I have seen firsthand how tax changes affected...',
  ],
  'Economics and Public Finance': [
    'Rising costs have forced my family to...',
    'As a worker in this economy, I struggle with...',
    'The economic situation in my community means that...',
  ],
  'Housing and Community Development': [
    'Finding affordable housing has been a challenge because...',
    'Rent / mortgage costs have forced me to...',
    'I have seen my neighborhood change due to...',
  ],
  'Social Welfare': [
    'Social Security / Medicare is essential for me because...',
    'Without safety net programs, my family would...',
    'I rely on these programs because...',
  ],
  'Armed Forces and National Security': [
    'As a veteran / military family member...',
    'I have served and experienced firsthand...',
    'National security matters to me because...',
  ],
  'Labor and Employment': [
    'As a worker, my conditions have been affected by...',
    'Wage policies directly impact my family because...',
    'My experience in the workplace showed me...',
  ],
  'Families': [
    'As a parent, childcare costs have meant that...',
    'My family has been directly affected by...',
    'Balancing work and family is challenging because...',
  ],
};

const DEFAULT_STORY_PROMPTS = [
  'This issue affects my daily life because...',
  'I or someone I know has been impacted by...',
  'In my community, I have seen...',
];

// Organizations working on each issue area — for "Learn more / Get involved"
const ADVOCACY_ORGS: Record<string, { name: string; url: string }[]> = {
  'Health': [
    { name: 'KFF (Health Policy Research)', url: 'https://www.kff.org/' },
    { name: 'Families USA', url: 'https://familiesusa.org/' },
    { name: 'National Alliance on Mental Illness', url: 'https://www.nami.org/' },
  ],
  'Immigration': [
    { name: 'American Immigration Lawyers Association', url: 'https://www.aila.org/' },
    { name: 'Migration Policy Institute', url: 'https://www.migrationpolicy.org/' },
    { name: 'National Immigration Forum', url: 'https://immigrationforum.org/' },
  ],
  'Environmental Protection': [
    { name: 'Sierra Club', url: 'https://www.sierraclub.org/' },
    { name: 'American Conservation Coalition', url: 'https://www.acc.eco/' },
    { name: 'Environmental Defense Fund', url: 'https://www.edf.org/' },
  ],
  'Education': [
    { name: 'National Education Association', url: 'https://www.nea.org/' },
    { name: 'National PTA', url: 'https://www.pta.org/' },
    { name: 'Education Trust', url: 'https://edtrust.org/' },
  ],
  'Crime and Law Enforcement': [
    { name: 'Brennan Center for Justice', url: 'https://www.brennancenter.org/' },
    { name: 'National Criminal Justice Association', url: 'https://www.ncja.org/' },
    { name: 'Council on Criminal Justice', url: 'https://counciloncj.org/' },
  ],
  'Taxation': [
    { name: 'Tax Foundation', url: 'https://taxfoundation.org/' },
    { name: 'Tax Policy Center', url: 'https://www.taxpolicycenter.org/' },
    { name: 'Center on Budget and Policy Priorities', url: 'https://www.cbpp.org/' },
  ],
  'Economics and Public Finance': [
    { name: 'Brookings Institution', url: 'https://www.brookings.edu/' },
    { name: 'Economic Policy Institute', url: 'https://www.epi.org/' },
    { name: 'Committee for a Responsible Federal Budget', url: 'https://www.crfb.org/' },
  ],
  'Armed Forces and National Security': [
    { name: 'Veterans of Foreign Wars', url: 'https://www.vfw.org/' },
    { name: 'RAND National Security', url: 'https://www.rand.org/topics/national-security.html' },
    { name: 'Blue Star Families', url: 'https://bluestarfam.org/' },
  ],
  'Labor and Employment': [
    { name: 'U.S. Department of Labor', url: 'https://www.dol.gov/' },
    { name: 'National Employment Law Project', url: 'https://www.nelp.org/' },
    { name: 'Society for Human Resource Management', url: 'https://www.shrm.org/' },
  ],
  'Science, Technology, Communications': [
    { name: 'Electronic Frontier Foundation', url: 'https://www.eff.org/' },
    { name: 'Information Technology and Innovation Foundation', url: 'https://itif.org/' },
    { name: 'Center for Democracy and Technology', url: 'https://cdt.org/' },
  ],
  'Housing and Community Development': [
    { name: 'National Low Income Housing Coalition', url: 'https://nlihc.org/' },
    { name: 'Habitat for Humanity', url: 'https://www.habitat.org/' },
    { name: 'Urban Institute — Housing', url: 'https://www.urban.org/policy-centers/housing-finance-policy-center' },
  ],
  'Social Welfare': [
    { name: 'AARP', url: 'https://www.aarp.org/' },
    { name: 'Center on Budget and Policy Priorities', url: 'https://www.cbpp.org/' },
    { name: 'National Academy of Social Insurance', url: 'https://www.nasi.org/' },
  ],
  'Families': [
    { name: 'National Partnership for Women & Families', url: 'https://nationalpartnership.org/' },
    { name: 'Child Welfare League of America', url: 'https://www.cwla.org/' },
    { name: 'Zero to Three', url: 'https://www.zerotothree.org/' },
  ],
};

// Topic context: keyed by specific issue label first, then category as fallback
interface TopicInfo {
  summary: string;
  currentEvents: string[];
  commonAsks: { label: string; ask: string }[];
  perspectives: { label: string; points: string[] }[];
}

// Subtopic-level context (specific issues like "DACA", "Border Security", "Gun Violence")
const SUBTOPIC_CONTEXT: Record<string, TopicInfo> = {
  // Immigration subtopics
  'DACA': {
    summary: 'DACA (Deferred Action for Childhood Arrivals) protects hundreds of thousands of people brought to the U.S. as children from deportation and allows them to work legally.',
    currentEvents: [
      'Federal courts have blocked new DACA applications while allowing renewals',
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
      { label: 'Protect Dreamers', points: ['They were brought as children and had no choice', 'They contribute significantly to the economy as workers and taxpayers', 'Most have no ties to their birth country'] },
      { label: 'Rule of law', points: ['Executive action bypassed Congress', 'Legal immigration should be the path', 'Amnesty incentivizes future illegal crossings'] },
    ],
  },
  'Border Security': {
    summary: 'Border security policy covers physical barriers, technology, staffing at ports of entry, and enforcement strategies along U.S. borders.',
    currentEvents: [
      'Border encounters remain elevated at the southern border',
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
      { label: 'Stronger enforcement', points: ['Secure borders are a national security priority', 'Physical barriers deter crossings', 'Sovereignty requires border control'] },
      { label: 'Smart border policy', points: ['Walls are expensive and ineffective in many areas', 'Technology is more cost-effective', 'Legal pathways reduce illegal crossings'] },
    ],
  },
  'Asylum': {
    summary: 'Asylum policy determines how the U.S. processes people fleeing persecution. Applicants must prove a credible fear of harm based on protected grounds.',
    currentEvents: [
      'Asylum case backlog exceeds 3 million pending cases',
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
      { label: 'Protect seekers', points: ['Asylum is a legal right under U.S. and international law', 'People flee genuine persecution', 'Detention costs more than community alternatives'] },
      { label: 'Reform system', points: ['Many claims are not legitimate asylum cases', 'The backlog encourages abuse', 'Other countries should share responsibility'] },
    ],
  },
  'Visas': {
    summary: 'Visa policy covers work visas (H-1B, H-2A), family visas, student visas, and the green card backlog that can take decades.',
    currentEvents: [
      'H-1B visa lottery system and tech industry demand for skilled workers',
      'Agricultural H-2A visa shortages during harvest seasons',
      'Green card backlogs of 10-20+ years for some countries',
    ],
    commonAsks: [
      { label: 'Reform H-1B', ask: 'Reform the H-1B visa program to prioritize highest-skilled workers and prevent abuse' },
      { label: 'Clear the backlog', ask: 'Clear the green card backlog so legal immigrants don\'t wait decades' },
      { label: 'Protect American workers', ask: 'Ensure visa programs don\'t displace or undercut American workers\' wages' },
      { label: 'Expand work visas', ask: 'Expand legal work visa programs to meet labor market needs' },
    ],
    perspectives: [
      { label: 'Expand legal paths', points: ['Legal immigration fills critical labor gaps', 'Backlogs punish people who follow the rules', 'Skilled immigrants drive innovation'] },
      { label: 'Protect workers', points: ['H-1B can depress wages for Americans', 'Companies should invest in training Americans', 'Immigration levels should match economic needs'] },
    ],
  },
  'Refugee Policy': {
    summary: 'Refugee policy sets the annual cap for refugees admitted to the U.S. and determines which populations are prioritized for resettlement.',
    currentEvents: [
      'Annual refugee admissions cap debates (historically 70-125K, currently lower)',
      'Resettlement of Afghan and Ukrainian refugees',
      'Global refugee crisis with 100+ million displaced people worldwide',
    ],
    commonAsks: [
      { label: 'Raise the cap', ask: 'Raise the annual refugee admissions cap to meet the global need' },
      { label: 'Lower admissions', ask: 'Reduce refugee admissions to focus resources on Americans in need' },
      { label: 'Prioritize allies', ask: 'Prioritize refugee admissions for those who helped U.S. military and diplomatic missions' },
      { label: 'Fund resettlement', ask: 'Fully fund refugee resettlement programs to help refugees integrate successfully' },
    ],
    perspectives: [
      { label: 'Welcome refugees', points: ['The U.S. has a moral obligation as a world leader', 'Refugees contribute economically within 5 years', 'Vetting is already extremely thorough'] },
      { label: 'Limit admissions', points: ['Resources should prioritize citizens first', 'Security vetting needs strengthening', 'Communities need time to absorb newcomers'] },
    ],
  },
  // Health subtopics
  'Medicare': {
    summary: 'Medicare provides health insurance for 65+ million Americans over age 65 and those with disabilities. It covers hospital care, doctor visits, and prescriptions.',
    currentEvents: [
      'Medicare trust fund projected to face shortfall by 2031',
      'Drug price negotiation for Medicare under the Inflation Reduction Act',
      'Debates over expanding Medicare eligibility age or benefits',
    ],
    commonAsks: [
      { label: 'No benefit cuts', ask: 'Oppose any cuts to Medicare benefits for current and future seniors' },
      { label: 'Lower drug costs', ask: 'Expand Medicare\'s ability to negotiate prescription drug prices' },
      { label: 'Shore up funding', ask: 'Ensure the Medicare trust fund remains solvent for future generations' },
      { label: 'Expand coverage', ask: 'Expand Medicare to cover dental, vision, and hearing' },
    ],
    perspectives: [
      { label: 'Expand coverage', points: ['Seniors earned their benefits through a lifetime of payroll taxes', 'Expanding benefits improves quality of life', 'Medicare is more efficient than private insurance'] },
      { label: 'Ensure solvency', points: ['Without reform, the trust fund will run out', 'Means-testing could focus resources on those most in need', 'Competition from private plans can improve choices'] },
    ],
  },
  'Medicaid': {
    summary: 'Medicaid provides health coverage for 90+ million low-income Americans, including children, pregnant women, elderly, and disabled individuals.',
    currentEvents: [
      'States that haven\'t expanded Medicaid under the ACA (10 states remain)',
      'Post-pandemic eligibility redeterminations removed millions from coverage',
      'Debates over work requirements for Medicaid eligibility',
    ],
    commonAsks: [
      { label: 'Expand Medicaid', ask: 'Support Medicaid expansion in all states to cover the coverage gap' },
      { label: 'Protect funding', ask: 'Oppose block grants or per-capita caps that would cut Medicaid funding' },
      { label: 'Add work requirements', ask: 'Support work requirements for able-bodied Medicaid recipients' },
      { label: 'Simplify enrollment', ask: 'Streamline Medicaid enrollment to prevent eligible people from losing coverage' },
    ],
    perspectives: [
      { label: 'Expand access', points: ['Expansion states see better health outcomes', 'The coverage gap leaves working people uninsured', 'Rural hospitals depend on Medicaid'] },
      { label: 'Reform program', points: ['States need flexibility to manage their programs', 'Work requirements encourage self-sufficiency', 'Costs are growing unsustainably'] },
    ],
  },
  'Prescription Drug Costs': {
    summary: 'Americans pay the highest drug prices in the world. Policy debates focus on Medicare negotiation, generic competition, and importation.',
    currentEvents: [
      'Medicare now negotiating prices on first 10 high-cost drugs (expanding annually)',
      'Insulin price cap of $35/month for Medicare patients',
      'Patent "thickets" that delay generic competition',
    ],
    commonAsks: [
      { label: 'Expand negotiation', ask: 'Expand Medicare drug price negotiation to cover more drugs faster' },
      { label: 'Cap out-of-pocket costs', ask: 'Cap out-of-pocket prescription drug costs for all Americans, not just Medicare' },
      { label: 'Allow importation', ask: 'Allow safe importation of cheaper drugs from Canada and other countries' },
      { label: 'Protect innovation', ask: 'Ensure drug pricing reforms don\'t stifle pharmaceutical research and development' },
    ],
    perspectives: [
      { label: 'Lower prices', points: ['Americans shouldn\'t pay 2-3x what other countries pay', 'Drug companies have record profits', 'High prices force people to ration medications'] },
      { label: 'Protect innovation', points: ['Price controls could reduce investment in new cures', 'The U.S. leads the world in drug development', 'Insurance reforms are better than price caps'] },
    ],
  },
  'Mental Health': {
    summary: 'Mental health policy covers access to treatment, parity with physical health coverage, crisis services, and school counseling.',
    currentEvents: [
      '988 Suicide & Crisis Lifeline launched nationally',
      'Youth mental health crisis declared a national emergency',
      'Mental health parity enforcement — insurers still limit coverage',
    ],
    commonAsks: [
      { label: 'Fund mental health', ask: 'Increase federal funding for mental health services and workforce development' },
      { label: 'Enforce parity', ask: 'Enforce mental health parity laws so insurance covers mental health equally to physical health' },
      { label: 'School counselors', ask: 'Fund school-based mental health counselors to support youth mental health' },
      { label: 'Crisis services', ask: 'Expand crisis intervention services including mobile crisis teams' },
    ],
    perspectives: [
      { label: 'Invest in care', points: ['1 in 5 Americans has a mental health condition', 'Treatment saves money by reducing ER visits and incarceration', 'Provider shortages leave people waiting months'] },
      { label: 'Community-based', points: ['Local solutions work better than federal mandates', 'Faith-based and community organizations play a vital role', 'Focus on prevention and resilience'] },
    ],
  },
  'Reproductive Health': {
    summary: 'Reproductive health policy covers abortion access, contraception, maternal health, and fertility treatments after the Dobbs decision returned regulation to states.',
    currentEvents: [
      'Post-Dobbs: 14+ states have enacted near-total abortion bans',
      'Ballot measures on abortion rights winning in red and blue states',
      'Debates over medication abortion access and interstate travel',
    ],
    commonAsks: [
      { label: 'Codify Roe', ask: 'Pass federal legislation to codify the right to abortion access nationwide' },
      { label: 'Protect life', ask: 'Support protections for unborn life and oppose taxpayer funding of abortion' },
      { label: 'Protect contraception', ask: 'Pass the Right to Contraception Act to guarantee access to birth control' },
      { label: 'Maternal health', ask: 'Invest in maternal health to reduce the U.S. maternal mortality rate' },
    ],
    perspectives: [
      { label: 'Pro-choice', points: ['Reproductive decisions belong to individuals, not government', 'Bans don\'t stop abortions, they make them unsafe', 'Access to contraception prevents abortions'] },
      { label: 'Pro-life', points: ['Life begins at conception and deserves protection', 'States should set their own policies', 'Alternatives like adoption should be supported'] },
    ],
  },
  'ACA/Obamacare': {
    summary: 'The Affordable Care Act provides insurance marketplace subsidies, Medicaid expansion, pre-existing condition protections, and young adult coverage to age 26.',
    currentEvents: [
      'Enhanced ACA subsidies set to expire (currently reduce premiums by $800+/year)',
      'Record enrollment of 21+ million through the marketplace',
      'Ongoing debates over repeal, reform, or expansion',
    ],
    commonAsks: [
      { label: 'Extend subsidies', ask: 'Make the enhanced ACA premium subsidies permanent so millions don\'t lose affordable coverage' },
      { label: 'Protect pre-existing', ask: 'Protect the pre-existing condition coverage guarantee under the ACA' },
      { label: 'Replace with better', ask: 'Replace the ACA with a system that lowers costs and increases choice' },
      { label: 'Fix the gaps', ask: 'Close the Medicaid coverage gap in states that haven\'t expanded' },
    ],
    perspectives: [
      { label: 'Keep and strengthen', points: ['Millions rely on marketplace coverage', 'Pre-existing condition protections are widely popular', 'Subsidies keep coverage affordable for many'] },
      { label: 'Reform the system', points: ['Premiums and deductibles are still too high for many', 'Competition should drive down costs', 'One-size-fits-all doesn\'t work for every situation'] },
    ],
  },
  // Crime subtopics
  'Gun Violence': {
    summary: 'Gun policy debates center on background checks, assault weapons, red flag laws, Second Amendment rights, and community violence intervention.',
    currentEvents: [
      'Bipartisan Safer Communities Act passed in 2022 (first gun law in 30 years)',
      'State-level red flag laws expanding, with mixed implementation',
      'Mass shootings continue while everyday gun violence affects communities',
    ],
    commonAsks: [
      { label: 'Universal background checks', ask: 'Pass universal background checks for all gun sales including private and online sales' },
      { label: 'Assault weapons ban', ask: 'Reinstate the federal assault weapons ban' },
      { label: 'Red flag laws', ask: 'Support federal incentives for state red flag laws that temporarily remove guns from people in crisis' },
      { label: 'Protect 2nd Amendment', ask: 'Oppose new gun restrictions that infringe on law-abiding citizens\' Second Amendment rights' },
    ],
    perspectives: [
      { label: 'More regulation', points: ['Background checks are supported by a large majority of Americans', 'Other democracies have far fewer gun deaths', 'Red flag laws have helped prevent some mass shootings'] },
      { label: 'Protect rights', points: ['The Second Amendment is a fundamental right', 'New laws won\'t stop criminals who ignore existing ones', 'Focus on mental health and enforcement, not restrictions'] },
    ],
  },
  'Police Reform': {
    summary: 'Police reform policy covers use of force standards, accountability, qualified immunity, training, and community policing models.',
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
    ],
    perspectives: [
      { label: 'Accountability focus', points: ['Accountability builds public trust', 'De-escalation training saves lives on both sides', 'Mental health calls may need different responders'] },
      { label: 'Support officers', points: ['Officers face dangerous situations daily', 'Communities are safer with well-supported police', 'Better pay and training attract better officers'] },
    ],
  },
  'Criminal Justice Reform': {
    summary: 'Criminal justice reform covers sentencing, incarceration, private prisons, re-entry programs, and racial disparities in the system.',
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
    ],
    perspectives: [
      { label: 'Reform system', points: ['The U.S. incarcerates more people than any country', 'Rehabilitation reduces reoffending', 'Racial disparities in sentencing need addressing'] },
      { label: 'Public safety', points: ['Violent offenders should serve full sentences', 'Victims deserve justice', 'Reform shouldn\'t come at the cost of safety'] },
    ],
  },
  'Drug Policy': {
    summary: 'Drug policy covers marijuana legalization, opioid crisis response, drug scheduling, harm reduction, and treatment vs. enforcement approaches.',
    currentEvents: [
      'Marijuana legalized in 24+ states but remains federally illegal (Schedule I)',
      'Opioid crisis: 100,000+ overdose deaths annually, fentanyl driving increase',
      'Harm reduction programs (naloxone access, safe injection sites) expanding',
    ],
    commonAsks: [
      { label: 'Legalize marijuana', ask: 'Deschedule marijuana at the federal level and allow states to regulate it' },
      { label: 'Fight opioid crisis', ask: 'Increase funding for opioid treatment, naloxone distribution, and fentanyl interdiction' },
      { label: 'Treatment over jail', ask: 'Redirect drug enforcement funding toward treatment and harm reduction programs' },
      { label: 'Keep enforcement', ask: 'Maintain strong drug enforcement to keep dangerous substances off the streets' },
    ],
    perspectives: [
      { label: 'Treatment approach', points: ['Addiction is a health issue, not a criminal one', 'Treatment is cheaper and more effective than incarceration', 'Harm reduction saves lives without enabling use'] },
      { label: 'Enforcement approach', points: ['Drug trafficking fuels violence', 'Legalization sends wrong message to youth', 'Fentanyl requires aggressive interdiction'] },
    ],
  },
  // Education subtopics
  'Student Loans': {
    summary: 'Americans owe $1.7+ trillion in student loan debt. Policy debates focus on forgiveness, income-driven repayment, and the cost of college itself.',
    currentEvents: [
      'Supreme Court blocked broad forgiveness; targeted relief programs continue',
      'SAVE Plan (income-driven repayment) enrolled millions, faces legal challenges',
      'Total student debt continues to grow as college costs rise',
    ],
    commonAsks: [
      { label: 'Forgive student debt', ask: 'Support broad student loan forgiveness to relieve the burden on borrowers' },
      { label: 'Fix income-driven repayment', ask: 'Protect and expand income-driven repayment plans so payments are affordable' },
      { label: 'No forgiveness', ask: 'Oppose blanket student loan forgiveness that\'s unfair to those who already paid' },
      { label: 'Lower college costs', ask: 'Address the root cause by making college more affordable in the first place' },
    ],
    perspectives: [
      { label: 'Forgive debt', points: ['Debt blocks homebuying, starting families, and economic growth', 'Many were misled about the value of their degrees', 'The government profited billions from student loans'] },
      { label: 'Personal responsibility', points: ['People chose to borrow and should repay', 'Forgiveness doesn\'t fix the cost problem', 'It\'s unfair to non-college workers and those who already repaid'] },
    ],
  },
  'K-12 Education': {
    summary: 'K-12 policy covers school funding, teacher pay, curriculum standards, school safety, and the achievement gap between affluent and low-income districts.',
    currentEvents: [
      'Pandemic learning loss recovery and its long-term effects',
      'Teacher shortages reaching crisis levels in many states',
      'Book bans and curriculum restrictions in multiple states',
    ],
    commonAsks: [
      { label: 'Fund public schools', ask: 'Increase Title I funding for schools in low-income areas' },
      { label: 'Raise teacher pay', ask: 'Support federal incentives to raise teacher salaries and reduce shortages' },
      { label: 'School choice', ask: 'Support school choice options including charter schools and vouchers for parents' },
      { label: 'School safety', ask: 'Invest in school safety measures including counselors, not just hardening' },
    ],
    perspectives: [
      { label: 'Invest in public ed', points: ['Funding gaps create inequality of opportunity', 'Teachers are the #1 factor in student success', 'Public schools serve every child'] },
      { label: 'Choice & innovation', points: ['Parents know best what works for their child', 'Competition drives improvement', 'One approach doesn\'t fit all learners'] },
    ],
  },
  'School Choice': {
    summary: 'School choice includes vouchers, education savings accounts, charter schools, and open enrollment policies that let families choose alternatives to assigned public schools.',
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
      { label: 'Support choice', points: ['Every family deserves the right to choose', 'Competition improves all schools', 'Low-income families deserve the options wealthy families already have'] },
      { label: 'Protect public schools', points: ['Vouchers drain funding from schools that serve most kids', 'Private schools can reject students; public schools can\'t', 'Public oversight ensures accountability'] },
    ],
  },
  // Environment subtopics
  'Climate Change': {
    summary: 'Climate change policy covers emissions reduction targets, clean energy transition, carbon pricing, and adaptation to extreme weather events.',
    currentEvents: [
      'Inflation Reduction Act investing $370B+ in clean energy',
      'Record heat waves, wildfires, and hurricanes worldwide',
      'Debates over phasing out fossil fuels vs. "all of the above" energy',
    ],
    commonAsks: [
      { label: 'Aggressive climate action', ask: 'Set binding emissions reduction targets and accelerate the clean energy transition' },
      { label: 'Protect energy jobs', ask: 'Ensure the clean energy transition doesn\'t leave fossil fuel workers behind' },
      { label: 'Carbon pricing', ask: 'Support a carbon tax or cap-and-trade system to make polluters pay' },
      { label: 'No new regulations', ask: 'Oppose costly climate regulations that hurt the economy and raise energy prices' },
    ],
    perspectives: [
      { label: 'Aggressive action', points: ['The science is clear and the window is closing', 'Clean energy is now cheaper than fossil fuels', 'Climate disasters already cost billions annually'] },
      { label: 'Gradual transition', points: ['Rapid transition threatens energy reliability', 'The U.S. can\'t solve climate change alone', 'Innovation, not regulation, is the answer'] },
    ],
  },
  'Renewable Energy': {
    summary: 'Renewable energy policy covers solar, wind, and battery storage incentives, grid modernization, and the transition from fossil fuels.',
    currentEvents: [
      'Solar and wind are now the cheapest new electricity sources in most of the U.S.',
      'IRA tax credits driving massive clean energy manufacturing investment',
      'Grid capacity and transmission lines are bottlenecks for new renewables',
    ],
    commonAsks: [
      { label: 'Extend tax credits', ask: 'Extend clean energy tax credits to accelerate solar, wind, and battery deployment' },
      { label: 'Modernize the grid', ask: 'Invest in grid modernization and transmission to handle more renewable energy' },
      { label: 'All-of-the-above energy', ask: 'Support all energy sources including fossil fuels to ensure affordable, reliable power' },
      { label: 'Energy independence', ask: 'Invest in domestic clean energy manufacturing to reduce dependence on foreign supply chains' },
    ],
    perspectives: [
      { label: 'Go renewable', points: ['Renewables create more jobs per dollar than fossil fuels', 'Energy independence through domestic solar and wind', 'Clean air and lower electricity costs'] },
      { label: 'Reliable energy', points: ['Wind and solar are intermittent', 'Fossil fuels provide baseload reliability', 'Transition needs to be gradual to avoid grid failures'] },
    ],
  },
  // Housing subtopics
  'Affordable Housing': {
    summary: 'Over 50% of renters are "cost-burdened," spending 30%+ of income on housing. The U.S. is short 7+ million affordable homes.',
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
    ],
    perspectives: [
      { label: 'Public investment', points: ['The market alone won\'t solve the affordability crisis', 'Vouchers and subsidies prevent homelessness', 'Zoning reform is needed at every level'] },
      { label: 'Supply-side reform', points: ['Over-regulation drives up building costs', 'Rent control discourages new construction', 'More supply naturally lowers prices'] },
    ],
  },
  'Homelessness': {
    summary: 'Over 650,000 Americans are homeless on any given night. Causes include housing costs, mental illness, addiction, and domestic violence.',
    currentEvents: [
      'Supreme Court ruling allowing cities to enforce camping bans',
      'Housing First programs showing success in reducing chronic homelessness',
      'Veteran homelessness declining but overall numbers rising',
    ],
    commonAsks: [
      { label: 'Housing First', ask: 'Fund Housing First programs that provide stable housing before requiring treatment' },
      { label: 'Mental health services', ask: 'Expand mental health and addiction treatment services for homeless individuals' },
      { label: 'Clear encampments', ask: 'Support clearing homeless encampments and directing people to shelter and services' },
      { label: 'Prevention', ask: 'Invest in homelessness prevention — eviction diversion and emergency rental assistance' },
    ],
    perspectives: [
      { label: 'Housing First', points: ['You can\'t treat mental illness or addiction without stable housing', 'Housing First research shows it can reduce chronic homelessness and cost less than long-term shelter use', 'Criminalizing homelessness doesn\'t solve it'] },
      { label: 'Accountability', points: ['Encampments are unsafe for residents and homeless individuals', 'Treatment should be a requirement, not optional', 'Enabling without accountability doesn\'t help'] },
    ],
  },
  // Taxation subtopics
  'Income Tax': {
    summary: 'Federal income tax brackets range from 10% to 37%. Debates center on rates, deductions, credits, and whether the wealthy pay enough.',
    currentEvents: [
      '2017 Tax Cuts and Jobs Act individual provisions expire after 2025',
      'If not extended, taxes will increase for most Americans',
      'Debates over extending all cuts vs. only for lower/middle income',
    ],
    commonAsks: [
      { label: 'Extend all cuts', ask: 'Extend the 2017 tax cuts for all income levels to prevent tax increases' },
      { label: 'Only extend for middle class', ask: 'Extend tax cuts only for those making under $400,000 and let top rates rise' },
      { label: 'Simplify the code', ask: 'Simplify the tax code to reduce complexity and close loopholes' },
      { label: 'Billionaire minimum tax', ask: 'Enact a minimum tax on billionaires\' unrealized gains' },
    ],
    perspectives: [
      { label: 'Lower taxes', points: ['Tax cuts boost the economy and job creation', 'People should keep more of their earnings', 'High taxes drive investment offshore'] },
      { label: 'Fair share', points: ['The wealthy pay a lower effective rate than workers', 'Revenue is needed for essential services', 'The deficit exploded after the 2017 cuts'] },
    ],
  },
  'Corporate Tax': {
    summary: 'The U.S. corporate tax rate was cut from 35% to 21% in 2017. Some corporations pay an effective rate far below 21% through deductions and offshoring.',
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
    ],
    perspectives: [
      { label: 'Raise & close loopholes', points: ['Corporations should pay their fair share', 'Revenue can fund infrastructure and education', 'The 2017 cut primarily benefited shareholders'] },
      { label: 'Stay competitive', points: ['High rates drive businesses overseas', 'Corporate taxes are passed to workers and consumers', 'Investment creates jobs'] },
    ],
  },
  // Economy subtopics
  'Inflation': {
    summary: 'Inflation measures how fast prices rise. After hitting 40-year highs in 2022, it has moderated but grocery, housing, and insurance costs remain elevated.',
    currentEvents: [
      'Inflation has come down from 9% to around 3% but prices haven\'t dropped',
      'Housing and car insurance costs driving remaining inflation',
      'Federal Reserve interest rate decisions affecting mortgages and loans',
    ],
    commonAsks: [
      { label: 'Lower grocery costs', ask: 'Take action to address food price gouging and bring down grocery costs' },
      { label: 'Cut spending', ask: 'Reduce federal spending to stop fueling inflation' },
      { label: 'Anti-price-gouging', ask: 'Pass anti-price-gouging legislation to prevent corporations from exploiting consumers' },
      { label: 'Energy costs', ask: 'Increase domestic energy production to bring down gas and heating costs' },
    ],
    perspectives: [
      { label: 'Structural issues', points: ['Corporate profit margins are at record highs', 'Supply chain investments prevent future spikes', 'Workers need wages that keep up with prices'] },
      { label: 'Fiscal discipline', points: ['Government spending fuels demand-side inflation', 'The Fed needs to stay the course', 'Regulations add costs that get passed to consumers'] },
    ],
  },
  // Social welfare subtopics
  'Social Security': {
    summary: 'Social Security provides retirement, disability, and survivor benefits to 67+ million Americans. The trust fund faces a projected shortfall by 2033.',
    currentEvents: [
      'Trust fund projected to be depleted by 2033 — benefits would be cut 23% if Congress doesn\'t act',
      'Debates over raising the payroll tax cap, retirement age, or benefit formula',
      'Cost-of-living adjustments (COLA) not keeping up with seniors\' actual costs',
    ],
    commonAsks: [
      { label: 'No cuts to benefits', ask: 'Protect Social Security benefits — oppose any cuts or privatization' },
      { label: 'Raise the cap', ask: 'Lift the payroll tax cap so high earners pay Social Security tax on all their income' },
      { label: 'Reform to sustain', ask: 'Support bipartisan reforms to keep Social Security solvent for future generations' },
      { label: 'Increase COLA', ask: 'Use a more accurate cost-of-living formula that reflects seniors\' actual expenses' },
    ],
    perspectives: [
      { label: 'Protect benefits', points: ['Workers paid into the system their whole lives', 'Lifting the cap solves most of the shortfall', 'Social Security keeps 22 million out of poverty'] },
      { label: 'Structural reform', points: ['The math doesn\'t work with an aging population', 'Raising the retirement age reflects longer lifespans', 'Means-testing focuses benefits on those who need them'] },
    ],
  },
  // Labor subtopics
  'Minimum Wage': {
    summary: 'The federal minimum wage has been $7.25/hour since 2009. About 30 states have set higher minimums, but millions of workers still earn below $15/hour.',
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
    ],
    perspectives: [
      { label: 'Raise the wage', points: ['$7.25/hour hasn\'t changed since 2009', 'Higher wages can reduce turnover and increase productivity', 'Many states that raised their minimum saw continued job growth'] },
      { label: 'Local flexibility', points: ['One size doesn\'t fit all — $15 in NYC differs from rural areas', 'Mandated increases can reduce hours for some low-wage workers', 'Small businesses operate on thin margins'] },
    ],
  },
  // Civil rights subtopics
  'Voting Rights': {
    summary: 'Voting rights policy covers voter access, voter ID laws, mail-in voting, gerrymandering, and protections against discrimination at the polls.',
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
    ],
    perspectives: [
      { label: 'Expand access', points: ['Voting should be easy for every eligible citizen', 'Restrictions disproportionately affect minority and low-income voters', 'Higher turnout strengthens democracy'] },
      { label: 'Election integrity', points: ['ID requirements are common sense and widely supported', 'Secure elections build public confidence', 'States should manage their own elections'] },
    ],
  },
  'LGBTQ+ Rights': {
    summary: 'LGBTQ+ rights policy covers anti-discrimination protections, marriage equality enforcement, transgender rights, and conversion therapy bans.',
    currentEvents: [
      'State-level bills targeting transgender youth (sports, healthcare, bathrooms)',
      'Equality Act (federal non-discrimination) has not passed the Senate',
      'Same-sex marriage federally protected by the Respect for Marriage Act',
    ],
    commonAsks: [
      { label: 'Pass Equality Act', ask: 'Pass the Equality Act to ban discrimination based on sexual orientation and gender identity' },
      { label: 'Protect trans youth', ask: 'Oppose legislation that restricts healthcare and participation for transgender youth' },
      { label: 'Parental rights', ask: 'Support parents\' rights to make decisions about their children without government interference' },
      { label: 'Religious liberty', ask: 'Protect religious organizations\' right to operate according to their beliefs' },
    ],
    perspectives: [
      { label: 'Equal protection', points: ['LGBTQ+ people face discrimination in housing, employment, and healthcare', 'Trans youth have alarming rates of depression and suicide', 'Federal protections ensure equal treatment nationwide'] },
      { label: 'Traditional values', points: ['Parents should guide decisions about their children', 'Religious institutions need protections too', 'States should decide on age-appropriate policies'] },
    ],
  },
  // Tech subtopics
  'AI': {
    summary: 'AI policy covers safety, regulation, deepfakes, job displacement, algorithmic bias, and whether existing laws can govern rapidly advancing AI technology.',
    currentEvents: [
      'Executive orders and proposed legislation on AI safety and transparency',
      'Deepfakes and AI-generated misinformation in elections',
      'AI displacing jobs in writing, coding, customer service, and more',
    ],
    commonAsks: [
      { label: 'Regulate AI', ask: 'Pass legislation requiring transparency and safety testing for AI systems' },
      { label: 'Ban deepfakes', ask: 'Ban AI-generated deepfakes in elections and non-consensual intimate images' },
      { label: 'Protect innovation', ask: 'Avoid over-regulating AI to keep the U.S. competitive with China' },
      { label: 'Worker protections', ask: 'Require companies to provide retraining when AI displaces workers' },
    ],
    perspectives: [
      { label: 'Regulate proactively', points: ['AI is moving faster than laws can keep up', 'Bias in AI systems can perpetuate discrimination', 'Deepfakes pose risks to elections and individuals'] },
      { label: 'Let innovation lead', points: ['Over-regulation pushes development overseas', 'AI will create more jobs than it displaces', 'Industry can self-regulate faster than government'] },
    ],
  },
  'Data Privacy': {
    summary: 'The U.S. has no comprehensive federal privacy law. Companies collect vast amounts of personal data with few restrictions on how it\'s used or sold.',
    currentEvents: [
      'States passing their own privacy laws (California, Virginia, Colorado, etc.)',
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
      { label: 'Strong protections', points: ['Americans deserve to know what data is collected and how it\'s used', 'The EU\'s GDPR shows federal regulation is possible', 'Without rules, companies will maximize data collection'] },
      { label: 'Balanced approach', points: ['Over-regulation could harm small businesses', 'Free services depend on ad-supported data models', 'Patchwork state laws create compliance burden'] },
    ],
  },
  'Social Media Regulation': {
    summary: 'Social media regulation debates cover Section 230 liability, content moderation, algorithms, youth safety, and platform monopoly power.',
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
    ],
    perspectives: [
      { label: 'Regulate platforms', points: ['Algorithms designed to addict are harming youth', 'Platforms profit from outrage and misinformation', 'Transparency is the bare minimum'] },
      { label: 'Protect speech', points: ['Government regulation of content is a slippery slope', 'Parents, not government, should monitor kids\' use', 'Section 230 is what makes the internet work'] },
    ],
  },
  // Energy subtopics
  'Oil and Gas': {
    summary: 'Oil and gas policy covers drilling leases, pipeline approvals, fracking regulations, fossil fuel subsidies, and energy independence.',
    currentEvents: [
      'U.S. is the world\'s top oil and gas producer (record production)',
      'Debates over new drilling leases on federal lands and offshore',
      '$20B+ in annual fossil fuel subsidies debated',
    ],
    commonAsks: [
      { label: 'End fossil fuel subsidies', ask: 'End federal subsidies for fossil fuel companies that are highly profitable' },
      { label: 'Expand drilling', ask: 'Expand domestic oil and gas production to lower energy costs and ensure energy independence' },
      { label: 'No new leases', ask: 'Stop approving new fossil fuel leases on federal lands to meet climate goals' },
      { label: 'Transition support', ask: 'Support fossil fuel workers with job training and economic development during the energy transition' },
    ],
    perspectives: [
      { label: 'Transition away', points: ['Fossil fuels are the primary driver of climate change', 'Subsidies go to highly profitable companies', 'Clean energy is already cheaper in many areas'] },
      { label: 'Continue production', points: ['Oil and gas ensure energy reliability today', 'U.S. production reduces reliance on hostile nations', 'Transition should be gradual, not forced'] },
    ],
  },
  // Trade subtopics
  'Tariffs': {
    summary: 'Tariffs are taxes on imported goods. They raise revenue and protect domestic industries but can increase consumer prices and spark trade wars.',
    currentEvents: [
      'Tariffs on Chinese goods ranging from 25-100% across categories',
      'Debates over tariff impacts on consumer prices vs. protecting manufacturing',
      'Trade tensions with allies over steel, aluminum, and auto tariffs',
    ],
    commonAsks: [
      { label: 'More tariffs', ask: 'Support tariffs to protect American manufacturing and bring jobs back' },
      { label: 'Reduce tariffs', ask: 'Reduce tariffs that are raising prices for American consumers and businesses' },
      { label: 'Targeted tariffs', ask: 'Use targeted tariffs on strategic industries (chips, clean energy) not broad ones that raise costs' },
      { label: 'Negotiate trade deals', ask: 'Negotiate fair trade agreements rather than relying on unilateral tariffs' },
    ],
    perspectives: [
      { label: 'Protect industry', points: ['Tariffs bring manufacturing jobs back', 'China doesn\'t play by fair trade rules', 'National security requires domestic production'] },
      { label: 'Free trade', points: ['Tariffs are a tax on consumers', 'Trade wars hurt farmers and exporters', 'Allies should work together, not against each other'] },
    ],
  },
  // International subtopics
  'Ukraine': {
    summary: 'U.S. policy on Ukraine covers military and economic aid, sanctions on Russia, NATO alliance management, and diplomatic efforts to end the war.',
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
      { label: 'Support Ukraine', points: ['Defending Ukraine deters future aggression', 'Abandoning allies emboldens autocrats', 'U.S. aid is mostly spent on American-made weapons'] },
      { label: 'Focus at home', points: ['Billions should go to American needs first', 'There\'s no clear endgame or exit strategy', 'Risk of escalation with a nuclear power'] },
    ],
  },
  'Foreign Aid': {
    summary: 'Foreign aid is less than 1% of the federal budget but funds global health, disaster relief, development, and diplomatic influence in 100+ countries.',
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
    ],
    perspectives: [
      { label: 'Invest abroad', points: ['Foreign aid prevents conflicts that cost far more', 'Global health programs prevent pandemics from reaching the U.S.', 'Aid builds goodwill and counters Chinese influence'] },
      { label: 'Domestic focus', points: ['Charity begins at home', 'Much aid is wasted or goes to corrupt governments', 'Less than 1% of the budget but every dollar counts'] },
    ],
  },
  // Families subtopics
  'Child Care': {
    summary: 'Child care policy covers affordability, availability, provider quality, and how working parents access care. Average costs vary widely by state.',
    currentEvents: [
      'Pandemic-era childcare funding has expired, stressing providers',
      'Child care deserts — many areas lack enough licensed providers',
      'Debates over universal pre-K and expanding the child tax credit',
    ],
    commonAsks: [
      { label: 'Expand child tax credit', ask: 'Expand and make permanent the child tax credit to help families with child care costs' },
      { label: 'Fund universal pre-K', ask: 'Fund universal pre-kindergarten so every child has access to early education' },
      { label: 'Support providers', ask: 'Increase pay and funding for child care workers to reduce provider shortages' },
      { label: 'Tax incentives for employers', ask: 'Create tax incentives for employers who offer child care benefits to workers' },
    ],
    perspectives: [
      { label: 'Public investment', points: ['Affordable child care lets parents work and strengthens the economy', 'Early childhood education improves long-term outcomes', 'Provider pay is too low to attract enough workers'] },
      { label: 'Family choice', points: ['Parents should choose the care arrangement that works for their family', 'Government programs can crowd out private and faith-based options', 'Tax credits give flexibility without growing bureaucracy'] },
    ],
  },
  'Paid Family Leave': {
    summary: 'The U.S. has no federal paid family leave law. The FMLA guarantees 12 weeks of unpaid leave, but many workers can\'t afford to take it.',
    currentEvents: [
      'Several states have implemented their own paid leave programs',
      'Federal paid leave proposals have stalled in Congress',
      'Debates over employer mandates vs. tax-credit approaches',
    ],
    commonAsks: [
      { label: 'Federal paid leave', ask: 'Pass a federal paid family and medical leave program' },
      { label: 'Tax credits approach', ask: 'Offer tax credits to employers who voluntarily provide paid leave' },
      { label: 'Expand FMLA', ask: 'Expand FMLA to cover more workers and smaller employers' },
      { label: 'State-level solutions', ask: 'Let states design their own paid leave programs with federal support' },
    ],
    perspectives: [
      { label: 'Worker support', points: ['No one should have to choose between a paycheck and caring for family', 'Paid leave improves worker retention and productivity', 'Most industrialized nations already guarantee paid leave'] },
      { label: 'Business concerns', points: ['Mandates are especially hard on small businesses', 'Voluntary employer programs are growing without mandates', 'One-size-fits-all doesn\'t work for every industry'] },
    ],
  },
  // Economy subtopics (missing)
  'Cost of Living': {
    summary: 'Cost of living encompasses housing, food, healthcare, transportation, and childcare — the everyday expenses that determine whether families can make ends meet.',
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
    ],
    perspectives: [
      { label: 'Structural solutions', points: ['Wages haven\'t kept up with costs for decades', 'Housing supply and healthcare reform address root causes', 'Working families need direct relief now'] },
      { label: 'Market solutions', points: ['Government spending contributes to higher prices', 'Reducing regulations lowers costs for everyone', 'A growing economy is the best path to affordability'] },
    ],
  },
  'Federal Budget': {
    summary: 'The federal budget sets annual spending priorities across defense, healthcare, education, infrastructure, and more. Congress must pass appropriations bills or face shutdowns.',
    currentEvents: [
      'Government shutdown threats during budget negotiations',
      'Debates over discretionary spending levels and continuing resolutions',
      'Mandatory spending (Social Security, Medicare) grows automatically each year',
    ],
    commonAsks: [
      { label: 'Increase domestic spending', ask: 'Increase funding for education, infrastructure, and social programs' },
      { label: 'Cut spending', ask: 'Reduce federal spending to bring the budget closer to balance' },
      { label: 'Reform the process', ask: 'Reform the budget process to prevent shutdowns and last-minute continuing resolutions' },
      { label: 'Prioritize defense', ask: 'Prioritize defense spending to maintain national security' },
    ],
    perspectives: [
      { label: 'Invest in priorities', points: ['Public investment in infrastructure and education drives growth', 'Safety net programs reduce poverty and stabilize the economy', 'Revenue increases can fund priorities responsibly'] },
      { label: 'Fiscal restraint', points: ['Government spending must be sustainable', 'Waste and inefficiency should be addressed first', 'Future generations shouldn\'t bear the burden of today\'s spending'] },
    ],
  },
  'National Debt': {
    summary: 'The U.S. national debt exceeds $34 trillion. Interest payments on the debt are now one of the largest federal expenditures.',
    currentEvents: [
      'Debt ceiling negotiations create recurring political standoffs',
      'Interest payments on the debt are growing rapidly as rates rise',
      'CBO projects debt will continue growing under current policy',
    ],
    commonAsks: [
      { label: 'Balance the budget', ask: 'Work toward a balanced federal budget to stop adding to the debt' },
      { label: 'Raise revenue', ask: 'Increase tax revenue from high earners and corporations to reduce the deficit' },
      { label: 'Cut entitlements', ask: 'Reform entitlement programs to reduce long-term spending growth' },
      { label: 'Grow the economy', ask: 'Focus on economic growth to increase revenue without raising tax rates' },
    ],
    perspectives: [
      { label: 'Reduce the debt', points: ['Growing debt burdens future generations', 'Interest payments crowd out other spending', 'Fiscal discipline is essential for long-term stability'] },
      { label: 'Strategic investment', points: ['Not all debt is bad — borrowing for growth pays off', 'Austerity during downturns makes things worse', 'The U.S. can manage its debt as the world\'s reserve currency'] },
    ],
  },
  // Education subtopics (missing)
  'Higher Education': {
    summary: 'Higher education policy covers college affordability, the value of degrees, vocational alternatives, and how institutions are funded and regulated.',
    currentEvents: [
      'College tuition has risen faster than inflation for decades',
      'Growing interest in trade schools, apprenticeships, and alternative credentials',
      'Debates over the return on investment of a four-year degree',
    ],
    commonAsks: [
      { label: 'Free community college', ask: 'Make community college tuition-free to expand access to higher education' },
      { label: 'Expand Pell Grants', ask: 'Increase Pell Grant funding so low-income students can afford college' },
      { label: 'Fund vocational training', ask: 'Invest in vocational and trade school programs as alternatives to four-year degrees' },
      { label: 'Reduce costs', ask: 'Hold colleges accountable for rising costs and administrative bloat' },
    ],
    perspectives: [
      { label: 'Expand access', points: ['Education is the best path to upward mobility', 'Cost shouldn\'t determine who gets a degree', 'Public investment in education pays for itself'] },
      { label: 'Accountability first', points: ['Colleges need accountability for the outcomes they deliver', 'Not everyone needs a four-year degree', 'Trade skills are in high demand and lead to good-paying jobs'] },
    ],
  },
  // Environment subtopics (missing)
  'Clean Air': {
    summary: 'Clean air policy covers emissions standards for vehicles and industry, air quality monitoring, wildfire smoke, and environmental justice in overburdened communities.',
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
      { label: 'Stronger standards', points: ['Air pollution causes hundreds of thousands of premature deaths', 'Low-income communities bear disproportionate exposure', 'Clean air technology creates economic opportunity'] },
      { label: 'Practical approach', points: ['Regulations should consider economic impact on workers and industries', 'Technology transitions need realistic timelines', 'Local conditions should inform standards'] },
    ],
  },
  'Clean Water': {
    summary: 'Clean water policy covers drinking water safety, infrastructure upgrades, PFAS contamination, agricultural runoff, and wastewater treatment.',
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
    ],
    perspectives: [
      { label: 'Federal standards', points: ['Safe water is a basic right that requires strong standards', 'Local systems need federal help to replace aging infrastructure', 'PFAS contamination is a nationwide problem requiring a national response'] },
      { label: 'Local control', points: ['States and localities understand their water systems best', 'Federal mandates without funding shift costs to ratepayers', 'Regulations should be based on sound science and cost-benefit analysis'] },
    ],
  },
  // Housing subtopics (missing)
  'Rent': {
    summary: 'Rent policy covers affordability, tenant protections, eviction processes, and whether rent stabilization helps or hurts the housing market.',
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
    ],
    perspectives: [
      { label: 'Protect renters', points: ['Housing instability harms families, health, and children\'s education', 'Renters need protections against sudden, extreme increases', 'Eviction prevention saves money compared to homelessness services'] },
      { label: 'Market approach', points: ['Rent control discourages new construction and reduces supply', 'More housing supply is the most effective way to lower rents', 'Property owners need predictability to invest in maintenance'] },
    ],
  },
  'Mortgage Rates': {
    summary: 'Mortgage rates affect whether families can afford to buy homes. Rates are influenced by the Federal Reserve, inflation, and housing market conditions.',
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
      { label: 'Assist buyers', points: ['Homeownership is how most families build wealth', 'Current rates lock out an entire generation of buyers', 'Targeted assistance helps without distorting the market'] },
      { label: 'Let markets work', points: ['Government subsidies can inflate prices further', 'Supply-side solutions address the root problem', 'Artificially low rates contributed to past housing bubbles'] },
    ],
  },
  // Taxation subtopics (missing)
  'Tax Reform': {
    summary: 'Tax reform efforts aim to simplify the tax code, close loopholes, adjust rates, and make the system fairer — though what "fairer" means depends on your perspective.',
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
      { label: 'Simpler and lower', points: ['The current code is too complex and costly to comply with', 'Lower rates encourage investment and job creation', 'Fewer loopholes mean a broader, fairer base'] },
      { label: 'More equitable', points: ['The wealthy often pay lower effective rates than workers', 'Revenue from closing loopholes can fund essential services', 'The tax code should reduce inequality, not increase it'] },
    ],
  },
  // Social Welfare subtopics (missing)
  'Disability Benefits': {
    summary: 'Social Security Disability Insurance (SSDI) and Supplemental Security Income (SSI) provide income to Americans with disabilities. Application wait times can stretch over a year.',
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
    ],
    perspectives: [
      { label: 'Strengthen the safety net', points: ['People with disabilities deserve adequate support', 'The application process is inhumane — people die waiting', 'Benefits haven\'t kept up with the cost of living'] },
      { label: 'Reform for sustainability', points: ['The system needs better oversight to ensure it helps those truly in need', 'Work incentives help people regain independence', 'Long-term solvency requires smart reforms'] },
    ],
  },
  'Safety Net Programs': {
    summary: 'Federal safety net programs include SNAP (food assistance), TANF (cash assistance), WIC (nutrition for mothers and children), and housing assistance.',
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
    ],
    perspectives: [
      { label: 'Protect and expand', points: ['These programs keep millions out of poverty', 'Most recipients are working families, children, elderly, or disabled', 'Hunger and poverty cost more in healthcare and lost productivity'] },
      { label: 'Reform and accountability', points: ['Programs should encourage self-sufficiency', 'States know their populations best and need flexibility', 'Spending must be sustainable long-term'] },
    ],
  },
  // Armed Forces subtopics (missing)
  'Veterans': {
    summary: 'Over 18 million Americans are veterans. Key issues include healthcare access through the VA, disability benefits, mental health, homelessness, and the transition to civilian life.',
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
    ],
    perspectives: [
      { label: 'Strengthen the VA', points: ['Veterans earned their care through service', 'The VA understands veteran-specific needs better than private providers', 'Funding the VA properly solves most access problems'] },
      { label: 'More options', points: ['Veterans deserve the freedom to choose their healthcare provider', 'Competition improves quality for veterans', 'Not every veteran lives near a VA facility'] },
    ],
  },
  'Military Funding': {
    summary: 'The U.S. military budget is the largest in the world. Debates focus on whether spending levels are adequate, how funds are allocated, and what threats to prioritize.',
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
      { label: 'Strong defense', points: ['Peace through strength deters conflict', 'Threats from China, Russia, and others are growing', 'Underfunding the military risks national security'] },
      { label: 'Smarter spending', points: ['The Pentagon has never passed a full audit', 'Spending more doesn\'t always mean better outcomes', 'Domestic investments also strengthen national security'] },
    ],
  },
  'Defense Spending': {
    summary: 'Defense spending policy covers weapons procurement, military pay, base operations, research and development, and allied burden-sharing.',
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
      { label: 'Maintain superiority', points: ['Technological superiority is the cornerstone of national defense', 'Adversaries are investing heavily — we must keep pace', 'Defense jobs support communities across the country'] },
      { label: 'Efficient spending', points: ['Throwing money at defense doesn\'t guarantee security', 'The Pentagon needs accountability before more funding', 'Diplomacy and alliances can be more cost-effective'] },
    ],
  },
  // Civil Rights subtopics (missing)
  'Discrimination': {
    summary: 'Anti-discrimination policy covers protections in employment, housing, education, and public services based on race, gender, religion, disability, and other characteristics.',
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
    ],
    perspectives: [
      { label: 'Active remedies', points: ['Historical discrimination created barriers that persist today', 'Diverse institutions perform better and serve more people', 'Enforcement is essential because discrimination still occurs'] },
      { label: 'Equal treatment', points: ['The law should treat everyone the same regardless of identity', 'Merit-based systems are the fairest approach', 'Government mandates can have unintended consequences'] },
    ],
  },
  'Free Speech': {
    summary: 'Free speech policy covers First Amendment protections, campus speech, protest rights, government censorship, and the line between free expression and harmful speech.',
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
      { label: 'Broad protections', points: ['Free speech is the foundation of democracy', 'Unpopular speech is exactly what the First Amendment protects', 'Government should never be the arbiter of acceptable ideas'] },
      { label: 'Responsible limits', points: ['Free speech doesn\'t mean freedom from consequences', 'Some speech causes real harm to vulnerable communities', 'Platforms and institutions can set standards without violating the First Amendment'] },
    ],
  },
  // Labor subtopics (missing)
  'Worker Rights': {
    summary: 'Worker rights policy covers workplace safety, overtime protections, gig worker classification, anti-retaliation, and the balance between employer flexibility and employee protections.',
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
    ],
    perspectives: [
      { label: 'Stronger protections', points: ['Workers are the backbone of the economy and deserve fair treatment', 'Misclassification denies workers benefits they\'ve earned', 'Safety regulations save lives'] },
      { label: 'Flexibility and choice', points: ['Many workers prefer independent contractor flexibility', 'Over-regulation increases costs and reduces opportunities', 'Businesses need flexibility to compete and create jobs'] },
    ],
  },
  'Unions': {
    summary: 'Union policy covers the right to organize, collective bargaining, right-to-work laws, and whether labor law should be reformed to make organizing easier or harder.',
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
      { label: 'Support organizing', points: ['Unions helped build the middle class', 'Collective bargaining gives workers a fair voice', 'Union workers earn higher wages and better benefits on average'] },
      { label: 'Worker freedom', points: ['Workers should choose whether to join a union without pressure', 'Unions can make businesses less competitive', 'Right-to-work protects individual choice'] },
    ],
  },
  // Additional Food Assistance subtopic
  'Food Assistance': {
    summary: 'SNAP (formerly food stamps) serves roughly 40 million Americans. Policy debates focus on benefit levels, eligibility, work requirements, and nutrition standards.',
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
    ],
    perspectives: [
      { label: 'Protect the program', points: ['SNAP is the front line against hunger in America', 'Most recipients are children, elderly, or working adults', 'Hunger reduces productivity and increases healthcare costs'] },
      { label: 'Reform the program', points: ['Work requirements encourage self-sufficiency', 'The program should focus on those who truly need it', 'Better nutrition standards improve outcomes'] },
    ],
  },
  // Nuclear Energy subtopic
  'Nuclear Energy': {
    summary: 'Nuclear energy provides about 20% of U.S. electricity with near-zero carbon emissions. Policy debates focus on safety, waste, costs, and the role of nuclear in the energy mix.',
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
      { label: 'Pro-nuclear', points: ['Nuclear is the largest source of carbon-free electricity', 'New designs are safer and produce less waste', 'Nuclear provides reliable baseload power unlike wind and solar'] },
      { label: 'Nuclear skepticism', points: ['Nuclear waste remains dangerous for thousands of years', 'New plants are extremely expensive and slow to build', 'Renewables and storage can fill the same role more cheaply'] },
    ],
  },
  'VA Healthcare': {
    summary: 'The VA healthcare system serves over 9 million enrolled veterans. Issues include wait times, quality of care, mental health services, and the balance between VA and private care.',
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
    ],
    perspectives: [
      { label: 'Invest in the VA', points: ['The VA understands veteran-specific conditions like no other system', 'Properly funded, the VA delivers excellent care', 'Privatization fragments care and loses institutional knowledge'] },
      { label: 'Veteran choice', points: ['Veterans should choose where they get care', 'Private options reduce wait times', 'Competition improves quality for everyone'] },
    ],
  },
};

// Category-level fallback context (used when no subtopic match exists)
const CATEGORY_CONTEXT: Record<string, TopicInfo> = {
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
function getTopicContext(issue: string, category: string): TopicInfo | null {
  return SUBTOPIC_CONTEXT[issue] || CATEGORY_CONTEXT[category] || null;
}

function TopicInfoPanel({ issueCategory, issue, onSelectAsk }: {
  issueCategory: string;
  issue: string;
  onSelectAsk: (ask: string) => void;
}) {
  const context = getTopicContext(issue, issueCategory);

  // Randomize perspective order so neither side consistently appears first
  const [perspectiveOrder] = useState(() =>
    context ? (Math.random() < 0.5 ? [...context.perspectives] : [...context.perspectives].reverse()) : []
  );

  if (!context) return null;

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-4">
      {/* Summary */}
      <p className="text-sm text-blue-800 dark:text-blue-200">{context.summary}</p>

      {/* Current events */}
      <div>
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">What&apos;s happening now:</p>
        <ul className="space-y-1">
          {context.currentEvents.map((event, i) => (
            <li key={i} className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
              <span className="text-blue-400 mt-0.5">&#8226;</span>
              {event}
            </li>
          ))}
        </ul>
      </div>

      {/* Common asks - clickable to fill the ask field */}
      <div>
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">Common requests (tap to use):</p>
        <div className="flex flex-wrap gap-1.5">
          {context.commonAsks.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectAsk(item.ask)}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Different perspectives */}
      <div>
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">Different perspectives:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {perspectiveOrder.map((perspective) => (
            <div key={perspective.label} className="bg-white/60 dark:bg-gray-700/50 rounded-lg p-2.5">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">{perspective.label}</p>
              <ul className="space-y-0.5">
                {perspective.points.map((point, i) => (
                  <li key={i} className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-1">
                    <span className="text-blue-300 mt-0.5">&#8226;</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Parse markdown into React elements (bold + links)
function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, j) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={j}>{part.replace(/\*\*/g, '')}</strong>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={j}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 dark:text-purple-400 underline hover:text-purple-800 dark:hover:text-purple-200"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={j}>{part}</span>;
  });
}

interface ParsedLine {
  type: 'header' | 'bullet' | 'text';
  text: string;
  isLegislation: boolean;
}

function parseResearchContent(content: string): ParsedLine[] {
  const lines: ParsedLine[] = [];
  let currentSection = '';

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
      currentSection = trimmed.replace(/\*\*/g, '').toLowerCase();
      lines.push({ type: 'header', text: trimmed.replace(/\*\*/g, ''), isLegislation: false });
    } else if (trimmed.startsWith('- ')) {
      lines.push({ type: 'bullet', text: trimmed.slice(2), isLegislation: currentSection.includes('legislation') });
    } else {
      lines.push({ type: 'text', text: trimmed, isLegislation: false });
    }
  }
  return lines;
}

function ResearchResults({
  content,
  dispatch,
  ask,
  personalWhy,
}: {
  content: string;
  dispatch: React.Dispatch<ContactAction>;
  ask: string;
  personalWhy: string;
}) {
  const parsed = useMemo(() => parseResearchContent(content), [content]);

  return (
    <div className="space-y-1.5">
      {parsed.map((line, i) => {
        if (line.type === 'header') {
          return (
            <p key={i} className="font-semibold text-purple-800 dark:text-purple-200 pt-1">
              {line.text}
            </p>
          );
        }

        if (line.type === 'bullet') {
          const handleUse = () => {
            if (line.isLegislation) {
              const billMatch = line.text.match(/^([A-Z]+\s+\d+):\s*(.+?)(?:\s*\(Latest:|$)/);
              const insertText = billMatch
                ? `I urge you to support ${billMatch[1]} - ${billMatch[2].trim()}`
                : line.text.replace(/\[.*?\]\(.*?\)/g, '').trim();

              if (ask.trim()) {
                dispatch({ type: 'SET_ASK', payload: ask + '\n\n' + insertText });
              } else {
                dispatch({ type: 'SET_ASK', payload: insertText });
              }
            } else {
              const cleanText = line.text
                .replace(/\*\*/g, '')
                .replace(/\[.*?\]\(.*?\)/g, '')
                .trim();

              if (personalWhy.trim()) {
                dispatch({ type: 'SET_PERSONAL_WHY', payload: personalWhy + '\n\n' + cleanText });
              } else {
                dispatch({ type: 'SET_PERSONAL_WHY', payload: cleanText });
              }
            }
          };

          return (
            <div key={i} className="flex gap-1.5 pl-1 group">
              <span className="text-purple-500 shrink-0">&bull;</span>
              <span className="flex-1">{renderMarkdown(line.text)}</span>
              <button
                type="button"
                onClick={handleUse}
                title={line.isLegislation ? 'Add to your ask' : 'Add to your story'}
                className="shrink-0 px-1.5 py-0.5 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 rounded hover:bg-purple-200 dark:hover:bg-purple-800/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                +
              </button>
            </div>
          );
        }

        return <p key={i}>{renderMarkdown(line.text)}</p>;
      })}
    </div>
  );
}

export function TopicStep({ state, dispatch, onBack }: TopicStepProps) {
  const { selectedReps, userName, issue, ask, personalWhy, contactMethod } = state;
  const [showStoryHelp, setShowStoryHelp] = useState(false);
  const [showTopicInfo, setShowTopicInfo] = useState(false);
  const [researchContent, setResearchContent] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState('');
  const researchAbortRef = useRef<AbortController | null>(null);

  const handleResearch = async () => {
    if (researchAbortRef.current) {
      researchAbortRef.current.abort();
    }

    setResearchContent('');
    setResearchError('');
    setResearchLoading(true);

    const abortController = new AbortController();
    researchAbortRef.current = abortController;

    try {
      const res = await fetch('/api/research-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue, issueCategory: state.issueCategory, ask }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResearchContent(text);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setResearchError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setResearchLoading(false);
    }
  };

  const handleContinue = () => {
    if (!userName.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter your name' });
      return;
    }
    if (!issue.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please describe the issue' });
      return;
    }
    if (!ask.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please describe what you want' });
      return;
    }
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'GO_TO_STEP', payload: 'message' });
  };

  return (
    <div className="p-6 sm:p-8">
      {/* Contact method toggle */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Choose how you want to reach out:</p>
      <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_CONTACT_METHOD', payload: 'email' })}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
            contactMethod === 'email'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_CONTACT_METHOD', payload: 'phone' })}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
            contactMethod === 'phone'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Phone
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {contactMethod === 'phone' ? 'Describe Your Call' : 'Write Your Message'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {contactMethod === 'phone'
            ? 'AI will write a personalized phone script for each official'
            : 'AI will write a personalized letter for each official'}
          {' '}
          <a href="/about/ai-tailoring" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">
            How does this work?
          </a>
        </p>
      </div>

      {state.error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
        </div>
      )}

      {/* Header showing selected reps */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Writing to ({selectedReps.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {selectedReps.map(rep => (
            <OfficialBadge key={rep.id} official={rep} />
          ))}
        </div>
      </div>

      {/* Your Name */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => dispatch({ type: 'SET_USER_NAME', payload: e.target.value })}
          placeholder="Your full name"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Your Email */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Email{' '}
          <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          type="email"
          value={state.userEmail}
          onChange={(e) => dispatch({ type: 'SET_USER_EMAIL', payload: e.target.value })}
          placeholder="you@example.com"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          So legislators can reply to you. Never shared or sold.
        </p>
      </div>

      {/* What issue? */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What issue? <span className="text-red-500">*</span>
        </label>
        <IssuePicker
          value={issue}
          category={state.issueCategory}
          onChange={(issue, category) => {
            dispatch({ type: 'SET_ISSUE', payload: { issue, category } });
            setShowTopicInfo(false);
          }}
        />

        {/* Learn More button - shown when an issue is selected */}
        {issue && state.issueCategory && state.issueCategory !== 'Other' && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowTopicInfo(!showTopicInfo)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showTopicInfo ? 'Hide topic info' : 'Learn more about this topic'}
            </button>
            {showTopicInfo && (
              <div className="mt-2">
                <TopicInfoPanel
                  issueCategory={state.issueCategory}
                  issue={issue}
                  onSelectAsk={(selectedAsk) => {
                    dispatch({ type: 'SET_ASK', payload: selectedAsk });
                    setShowTopicInfo(false);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* What action do you want them to take? */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What action do you want them to take? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={ask}
          onChange={(e) => dispatch({ type: 'SET_ASK', payload: e.target.value })}
          placeholder='e.g., "Vote yes on the infrastructure bill", "Fix the roads in my district"'
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Your personal why */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Your personal why{' '}
            <span className="text-gray-400 dark:text-gray-500 font-normal">(optional but powerful)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowStoryHelp(!showStoryHelp)}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            {showStoryHelp ? 'Hide tips' : 'Help me write this'}
          </button>
        </div>

        {showStoryHelp && (
          <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl space-y-3">
            <p className="text-xs font-medium text-purple-800 dark:text-purple-200">
              Congressional staff say that personal stories stand out — messages that share a real experience are much more likely to get attention.
            </p>

            {/* Story starter prompts */}
            <div>
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1.5">Try starting with:</p>
              <div className="flex flex-wrap gap-1.5">
                {(STORY_PROMPTS[state.issueCategory] || DEFAULT_STORY_PROMPTS).map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (!personalWhy.trim()) {
                        dispatch({ type: 'SET_PERSONAL_WHY', payload: prompt });
                      }
                    }}
                    className="px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-600 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Story structure tip */}
            <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
              <p className="font-medium">Strong stories have:</p>
              <ul className="list-disc list-inside space-y-0.5 text-purple-600 dark:text-purple-400">
                <li>A specific detail (numbers, names, dates)</li>
                <li>How it affects your daily life</li>
                <li>What you&apos;ve tried or what you&apos;re facing</li>
              </ul>
            </div>

            {/* AI Research assistant */}
            <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1.5">Research to strengthen your message:</p>
              <button
                type="button"
                onClick={handleResearch}
                disabled={!state.issueCategory || !issue || researchLoading}
                className="px-3 py-2 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {researchLoading ? 'Researching...' : 'Find talking points & legislation'}
              </button>

              {researchError && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400">{researchError}</p>
                  <button
                    type="button"
                    onClick={handleResearch}
                    className="mt-1 text-xs text-red-700 dark:text-red-300 underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {researchContent && (
                <div className="mt-2">
                  <div className="p-3 bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-600 rounded-lg text-xs text-gray-800 dark:text-gray-200">
                    <ResearchResults
                      content={researchContent}
                      dispatch={dispatch}
                      ask={ask}
                      personalWhy={personalWhy}
                    />
                  </div>
                  <p className="mt-1 text-xs text-purple-500 dark:text-purple-500">
                    Hover over a bullet and click + to add it to your message.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setResearchContent(''); setResearchError(''); }}
                    className="mt-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Advocacy organizations */}
            {state.issueCategory && ADVOCACY_ORGS[state.issueCategory] && (
              <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Learn more or get involved:</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {ADVOCACY_ORGS[state.issueCategory].map((org) => (
                    <a
                      key={org.url}
                      href={org.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      {org.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <textarea
          value={personalWhy}
          onChange={(e) => dispatch({ type: 'SET_PERSONAL_WHY', payload: e.target.value })}
          placeholder='e.g., "This affects my daily commute and my kids&#39; school bus route"'
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Personal stories drive policy. Congressional staff track constituent concerns and often share compelling stories directly with legislators.
          {' '}<a href="/guides/tell-your-story" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Read the full guide</a>.
        </p>
      </div>

      {/* AI note */}
      <div className="mb-6 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
        <p className="text-xs text-purple-700 dark:text-purple-300">
          {contactMethod === 'phone'
            ? 'AI will write a separate phone script for each official, tailored to their party and likely stance.'
            : 'AI will write a separate letter for each official, tailored to their party and likely stance.'}
          {' '}
          <a href="/about/ai-tailoring" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-900 dark:hover:text-purple-100">
            How does this work?
          </a>
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          {contactMethod === 'phone' ? 'Generate Script' : 'Generate Message'}
        </Button>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
        Your message will be saved to your history.{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300">
          See our Privacy Policy
        </a>{' '}for details.
      </p>
    </div>
  );
}
