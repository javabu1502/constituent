'use client';

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

export function TopicStep({ state, dispatch, onBack }: TopicStepProps) {
  const { selectedReps, userName, issue, ask, personalWhy, contactMethod } = state;

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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your personal why{' '}
          <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={personalWhy}
          onChange={(e) => dispatch({ type: 'SET_PERSONAL_WHY', payload: e.target.value })}
          placeholder='e.g., "This affects my daily commute and my kids&#39; school bus route"'
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Personal stories drive policy. Congressional staff track constituent concerns and often share compelling stories directly with legislators.
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
