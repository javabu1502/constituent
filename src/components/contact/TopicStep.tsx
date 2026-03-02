'use client';

import { useState } from 'react';
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

export function TopicStep({ state, dispatch, onBack }: TopicStepProps) {
  const { selectedReps, userName, issue, ask, personalWhy, contactMethod } = state;
  const [showStoryHelp, setShowStoryHelp] = useState(false);

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
          onChange={(issue, category) =>
            dispatch({ type: 'SET_ISSUE', payload: { issue, category } })
          }
        />
      </div>

      {/* What do you want? */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What do you want? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={ask}
          onChange={(e) => dispatch({ type: 'SET_ASK', payload: e.target.value })}
          placeholder='e.g., "Fix the roads in my district", "Review current policy"'
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
                    className="px-2.5 py-1 text-xs bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-600 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors text-left"
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
