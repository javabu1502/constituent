'use client';

import { useState, useEffect } from 'react';
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

// Advocacy org categories that match issue categories
const ADVOCACY_LINKS: Record<string, { progressive: string; conservative: string }> = {
  'Health': { progressive: 'https://familiesusa.org/', conservative: 'https://www.heritage.org/health-care-reform' },
  'Immigration': { progressive: 'https://www.aclu.org/issues/immigrants-rights', conservative: 'https://www.fairus.org/' },
  'Environmental Protection': { progressive: 'https://www.sierraclub.org/', conservative: 'https://www.acc.eco/' },
  'Education': { progressive: 'https://www.nea.org/', conservative: 'https://www.heritage.org/education' },
  'Crime and Law Enforcement': { progressive: 'https://www.everytown.org/', conservative: 'https://www.nraila.org/' },
  'Taxation': { progressive: 'https://americansfortaxfairness.org/', conservative: 'https://taxfoundation.org/' },
  'Economics and Public Finance': { progressive: 'https://www.epi.org/', conservative: 'https://www.aei.org/' },
  'Armed Forces and National Security': { progressive: 'https://winwithoutwar.org/', conservative: 'https://www.heritage.org/defense' },
  'Labor and Employment': { progressive: 'https://aflcio.org/', conservative: 'https://www.uschamber.com/' },
  'Science, Technology, Communications': { progressive: 'https://www.eff.org/', conservative: 'https://techfreedom.org/' },
};

// Topic context: what's happening, common asks, and different perspectives
const TOPIC_CONTEXT: Record<string, {
  summary: string;
  currentEvents: string[];
  commonAsks: { label: string; ask: string }[];
  perspectives: { label: string; points: string[] }[];
}> = {
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
    currentEvents: [
      'Student loan forgiveness programs and repayment reforms',
      'Debates over school choice and voucher programs',
      'Teacher shortages and compensation nationwide',
    ],
    commonAsks: [
      { label: 'Cancel student debt', ask: 'Support student loan forgiveness to reduce the burden on borrowers' },
      { label: 'Fund public schools', ask: 'Increase federal funding for public schools, especially in underserved areas' },
      { label: 'Support teachers', ask: 'Increase teacher pay and reduce class sizes' },
      { label: 'School safety', ask: 'Invest in school safety measures to protect students' },
    ],
    perspectives: [
      { label: 'Invest in public ed', points: ['Equitable funding improves outcomes', 'Public schools serve all communities', 'Teachers need better compensation'] },
      { label: 'Choice & accountability', points: ['Parents should choose their school', 'Competition improves quality', 'Focus on outcomes, not spending'] },
    ],
  },
  'Crime and Law Enforcement': {
    summary: 'Criminal justice policy includes policing, gun policy, sentencing, drug laws, and community safety programs.',
    currentEvents: [
      'Gun violence prevention legislation and Second Amendment debates',
      'Bipartisan criminal justice reform efforts',
      'Community policing and mental health crisis response',
    ],
    commonAsks: [
      { label: 'Universal background checks', ask: 'Support universal background checks for all gun purchases' },
      { label: 'Protect gun rights', ask: 'Oppose legislation that infringes on Second Amendment rights' },
      { label: 'Reform sentencing', ask: 'Support sentencing reform to reduce mass incarceration' },
      { label: 'Fund community safety', ask: 'Invest in community-based violence prevention programs' },
    ],
    perspectives: [
      { label: 'Prevention focus', points: ['Background checks save lives', 'Community programs reduce violence', 'Mental health and gun access are connected'] },
      { label: 'Rights focus', points: ['Law-abiding citizens have a right to self-defense', 'Enforce existing laws before adding new ones', 'Root causes need addressing, not restrictions'] },
    ],
  },
  'Environmental Protection': {
    summary: 'Environmental policy covers climate change, emissions standards, clean energy, pollution, and conservation.',
    currentEvents: [
      'Clean energy investments from the Inflation Reduction Act',
      'EPA emissions standards for vehicles and power plants',
      'Extreme weather events and disaster preparedness',
    ],
    commonAsks: [
      { label: 'Climate action', ask: 'Support aggressive action to reduce carbon emissions and combat climate change' },
      { label: 'Clean energy jobs', ask: 'Invest in clean energy to create jobs and reduce dependence on fossil fuels' },
      { label: 'Protect clean water', ask: 'Strengthen clean water protections and infrastructure' },
      { label: 'Balance economy', ask: 'Ensure environmental regulations don\'t harm jobs and energy affordability' },
    ],
    perspectives: [
      { label: 'Climate urgency', points: ['Scientific consensus demands action', 'Clean energy creates jobs', 'Extreme weather costs are rising'] },
      { label: 'Economic balance', points: ['Regulations must consider job impacts', 'Energy independence needs all sources', 'Gradual transitions protect workers'] },
    ],
  },
  'Taxation': {
    summary: 'Tax policy includes income tax rates, corporate taxes, deductions, credits, and how revenue funds government services.',
    currentEvents: [
      'Tax Cuts and Jobs Act provisions set to expire',
      'Debates over corporate tax rates and loopholes',
      'State and local tax (SALT) deduction cap debates',
    ],
    commonAsks: [
      { label: 'Tax the wealthy', ask: 'Support higher taxes on the wealthiest Americans to fund public services' },
      { label: 'Lower taxes', ask: 'Support lower tax rates to stimulate economic growth' },
      { label: 'Close loopholes', ask: 'Close corporate tax loopholes so all businesses pay their fair share' },
      { label: 'Expand child tax credit', ask: 'Expand the Child Tax Credit to help working families' },
    ],
    perspectives: [
      { label: 'Progressive', points: ['Wealthy should pay more', 'Revenue funds essential services', 'Tax credits help working families'] },
      { label: 'Lower taxes', points: ['Lower taxes spur growth', 'People spend their money better than government', 'Simplify the tax code'] },
    ],
  },
  'Economics and Public Finance': {
    summary: 'Economic policy covers the federal budget, national debt, inflation, and the cost of living.',
    currentEvents: [
      'Inflation impacts on grocery, housing, and energy costs',
      'Federal deficit and debt ceiling debates',
      'Interest rate policy and its effect on borrowing costs',
    ],
    commonAsks: [
      { label: 'Reduce inflation', ask: 'Take action to reduce inflation and lower the cost of living' },
      { label: 'Cut spending', ask: 'Reduce federal spending to address the national debt' },
      { label: 'Invest in growth', ask: 'Invest in infrastructure and programs that grow the economy for everyone' },
      { label: 'Raise minimum wage', ask: 'Raise the federal minimum wage to keep up with the cost of living' },
    ],
    perspectives: [
      { label: 'Invest to grow', points: ['Public investment creates jobs', 'Safety nets stabilize the economy', 'Deficit spending can be strategic'] },
      { label: 'Fiscal discipline', points: ['Debt burdens future generations', 'Government spending fuels inflation', 'Private sector drives growth'] },
    ],
  },
  'Housing and Community Development': {
    summary: 'Housing policy covers affordability, homelessness, zoning, rental protections, and mortgage access.',
    currentEvents: [
      'Housing affordability crisis affecting renters and buyers',
      'Homelessness increasing in major cities',
      'Zoning reform debates to allow more housing construction',
    ],
    commonAsks: [
      { label: 'Build more housing', ask: 'Support policies that increase housing supply to bring down costs' },
      { label: 'Rental assistance', ask: 'Expand rental assistance programs for low-income families' },
      { label: 'Address homelessness', ask: 'Fund comprehensive programs to address homelessness including housing-first approaches' },
      { label: 'First-time buyer help', ask: 'Support down payment assistance for first-time homebuyers' },
    ],
    perspectives: [
      { label: 'Build & subsidize', points: ['Housing is a right', 'Government subsidies help vulnerable populations', 'Zoning reform enables building'] },
      { label: 'Market solutions', points: ['Reduce regulations to lower building costs', 'Market-rate housing reduces prices over time', 'Property rights matter'] },
    ],
  },
  'Armed Forces and National Security': {
    summary: 'Defense and veteran policy covers military spending, troop deployments, veteran benefits, and national security.',
    currentEvents: [
      'Military budget negotiations and modernization priorities',
      'VA healthcare access and benefit improvements',
      'Global security challenges and troop deployment decisions',
    ],
    commonAsks: [
      { label: 'Support veterans', ask: 'Improve VA healthcare and expand benefits for veterans' },
      { label: 'Increase defense', ask: 'Maintain strong defense spending to protect national security' },
      { label: 'Reduce military spending', ask: 'Reduce unnecessary military spending and invest in diplomacy' },
      { label: 'Improve VA services', ask: 'Fix VA wait times and expand mental health services for veterans' },
    ],
    perspectives: [
      { label: 'Strong defense', points: ['Peace through strength', 'Modernization keeps us safe', 'Veterans earned their benefits'] },
      { label: 'Diplomatic focus', points: ['Diplomacy is cheaper than war', 'Overspending crowds out domestic needs', 'Veteran care should be the priority'] },
    ],
  },
  'Social Welfare': {
    summary: 'Social welfare policy covers Social Security, disability benefits, poverty programs, and the social safety net.',
    currentEvents: [
      'Social Security trust fund projected shortfall',
      'Debates over work requirements for benefit programs',
      'SNAP benefit levels and eligibility changes',
    ],
    commonAsks: [
      { label: 'Protect Social Security', ask: 'Oppose any cuts to Social Security benefits' },
      { label: 'Expand benefits', ask: 'Strengthen the social safety net for vulnerable Americans' },
      { label: 'Reform programs', ask: 'Reform social programs to encourage work while protecting those in need' },
      { label: 'Fix disability', ask: 'Reduce wait times and improve the disability benefits process' },
    ],
    perspectives: [
      { label: 'Protect & expand', points: ['Social Security is an earned benefit', 'Safety nets prevent poverty', 'Benefits should keep up with costs'] },
      { label: 'Reform & sustain', points: ['Programs need reform to stay solvent', 'Work incentives help people', 'Means-testing focuses help on those most in need'] },
    ],
  },
  'Labor and Employment': {
    summary: 'Labor policy covers wages, worker protections, unions, workplace safety, and employment programs.',
    currentEvents: [
      'Federal minimum wage has not been raised since 2009',
      'Gig worker classification and benefits debates',
      'Union organizing efforts across industries',
    ],
    commonAsks: [
      { label: 'Raise minimum wage', ask: 'Raise the federal minimum wage to a living wage' },
      { label: 'Protect workers', ask: 'Strengthen worker protections and workplace safety regulations' },
      { label: 'Support unions', ask: 'Protect the right to organize and support union workers' },
      { label: 'Paid family leave', ask: 'Pass federal paid family and medical leave legislation' },
    ],
    perspectives: [
      { label: 'Worker power', points: ['Workers deserve a living wage', 'Unions balance corporate power', 'Paid leave is standard in most countries'] },
      { label: 'Business flexibility', points: ['Mandates can reduce hiring', 'Flexible work arrangements benefit both sides', 'Small businesses need different rules'] },
    ],
  },
  'Civil Rights and Liberties, Minority Issues': {
    summary: 'Civil rights policy covers voting access, anti-discrimination protections, free speech, and equality under law.',
    currentEvents: [
      'Voting rights legislation and state-level voting law changes',
      'LGBTQ+ rights protections and legal challenges',
      'Affirmative action and anti-discrimination enforcement',
    ],
    commonAsks: [
      { label: 'Protect voting rights', ask: 'Support legislation to protect and expand voting access' },
      { label: 'Anti-discrimination', ask: 'Strengthen anti-discrimination protections in employment and housing' },
      { label: 'Protect free speech', ask: 'Protect First Amendment rights and free expression' },
      { label: 'LGBTQ+ protections', ask: 'Pass comprehensive non-discrimination protections for LGBTQ+ Americans' },
    ],
    perspectives: [
      { label: 'Expand protections', points: ['Equal rights strengthen democracy', 'Systemic barriers need active remedies', 'Voting should be easy for everyone'] },
      { label: 'Liberty focus', points: ['Government overreach threatens freedom', 'Individual rights must be balanced', 'States should decide many of these issues'] },
    ],
  },
};

function TopicInfoPanel({ issueCategory, issue, onSelectAsk }: {
  issueCategory: string;
  issue: string;
  onSelectAsk: (ask: string) => void;
}) {
  const context = TOPIC_CONTEXT[issueCategory];
  const [loading, setLoading] = useState(false);
  const [aiContext, setAiContext] = useState<string | null>(null);

  // Try to get AI-generated context for the specific issue
  useEffect(() => {
    if (!issue || !issueCategory || context) return;
    // Only fetch AI context for topics we don't have predefined context for
    setLoading(true);
    const params = new URLSearchParams({ issue, category: issueCategory });
    fetch(`/api/topic-context?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.summary) setAiContext(data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [issue, issueCategory, context]);

  if (!context && !aiContext && !loading) return null;

  if (loading) {
    return (
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl animate-pulse">
        <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-blue-200 dark:bg-blue-700 rounded w-1/2" />
      </div>
    );
  }

  if (!context && aiContext) {
    return (
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-xs text-blue-800 dark:text-blue-200">{aiContext}</p>
      </div>
    );
  }

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
          {context.perspectives.map((perspective) => (
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

export function TopicStep({ state, dispatch, onBack }: TopicStepProps) {
  const { selectedReps, userName, issue, ask, personalWhy, contactMethod } = state;
  const [showStoryHelp, setShowStoryHelp] = useState(false);
  const [showTopicInfo, setShowTopicInfo] = useState(false);

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
              Messages with personal stories are 6x more likely to be flagged for a legislator&apos;s attention.
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

            {/* Research resources */}
            {state.issueCategory && ADVOCACY_LINKS[state.issueCategory] && (
              <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Research to strengthen your message:</p>
                <div className="flex gap-2">
                  <a
                    href={ADVOCACY_LINKS[state.issueCategory].progressive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Progressive research
                  </a>
                  <span className="text-purple-400">|</span>
                  <a
                    href={ADVOCACY_LINKS[state.issueCategory].conservative}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Conservative research
                  </a>
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
