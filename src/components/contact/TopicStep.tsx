'use client';

import { useState, useMemo, useRef } from 'react';
import type { ContactState, ContactAction } from './ContactFlow';
import type { Official } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { IssuePicker } from '@/components/ui/IssuePicker';
import { useTurnstile } from '@/components/ui/Turnstile';
import { getTopicContext } from '@/data/topic-content';
import { ADVOCACY_ORGS, SUBTOPIC_ORGS } from '@/data/advocacy-orgs';
import { STORY_PROMPTS, DEFAULT_STORY_PROMPTS } from '@/data/story-prompts';

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
        <span aria-label={official.party} className={`px-2 py-0.5 text-xs font-medium rounded-full ${partyColors.bg} ${partyColors.text}`}>
          {official.party.charAt(0)}
        </span>
      </div>
      <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{official.name}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{official.title}</p>
    </div>
  );
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

  // Merge subtopic-specific + category-level orgs for "Learn more"
  const mergedOrgs = useMemo(() => {
    const subtopicOrgs = context?.orgs || SUBTOPIC_ORGS[issue] || [];
    const categoryOrgs = ADVOCACY_ORGS[issueCategory] || [];
    const seen = new Set<string>();
    const result: { name: string; url: string }[] = [];
    for (const org of [...subtopicOrgs, ...categoryOrgs]) {
      if (!seen.has(org.url)) {
        seen.add(org.url);
        result.push(org);
      }
    }
    return result;
  }, [context, issue, issueCategory]);

  if (!context) return null;

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-4">
      {/* Summary */}
      <p className="text-sm text-blue-800 dark:text-blue-200">{context.summary}</p>

      {/* Key Stats */}
      {context.keyStats && context.keyStats.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">Key numbers:</p>
          <div className="grid grid-cols-2 gap-2">
            {context.keyStats.map((stat, i) => (
              <div key={i} className="bg-white/70 dark:bg-gray-700/60 rounded-lg p-2.5">
                <p className="text-base font-bold text-blue-900 dark:text-blue-100">{stat.value}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-tight">{stat.label}</p>
                <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5">
                  {stat.sourceUrl ? (
                    <a href={stat.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{stat.source}</a>
                  ) : stat.source}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {perspective.counterpoint && (
                <p className="text-xs text-blue-500 dark:text-blue-400 italic mt-1.5 pl-2 border-l-2 border-blue-300 dark:border-blue-600">
                  Critics say: {perspective.counterpoint}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sources & Learn More */}
      {(context.sources?.length || mergedOrgs.length > 0) && (
        <details className="group">
          <summary className="text-xs font-semibold text-blue-700 dark:text-blue-300 cursor-pointer select-none flex items-center gap-1">
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Sources &amp; learn more
          </summary>
          <div className="mt-2 space-y-2">
            {context.sources && context.sources.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-blue-500 dark:text-blue-400 font-semibold mb-1">Authoritative sources</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {context.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                        source.type === 'government' ? 'bg-green-500' :
                        source.type === 'nonpartisan' ? 'bg-blue-500' : 'bg-purple-500'
                      }`} />
                      {source.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {mergedOrgs.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-blue-500 dark:text-blue-400 font-semibold mb-1">Organizations</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {mergedOrgs.map((org) => (
                    <a
                      key={org.url}
                      href={org.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {org.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
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
  const { selectedReps, userName, issue, ask, personalWhy, contactMethod, tone } = state;
  const [showStoryHelp, setShowStoryHelp] = useState(false);
  const [showTopicInfo, setShowTopicInfo] = useState(false);
  const [researchContent, setResearchContent] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState('');
  const researchAbortRef = useRef<AbortController | null>(null);
  const { getToken, TurnstileWidget } = useTurnstile();

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
      const turnstileToken = await getToken();
      const res = await fetch('/api/research-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue, issueCategory: state.issueCategory, ask, turnstileToken: turnstileToken || undefined }),
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

      {/* Tone selector */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Choose a tone:</p>
      <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 mb-1">
        {(['professional', 'personal', 'passionate'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => dispatch({ type: 'SET_TONE', payload: t })}
            className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-md transition-colors capitalize ${
              tone === t
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
        {tone === 'professional' && 'Formal and data-driven'}
        {tone === 'personal' && 'Lead with your story'}
        {tone === 'passionate' && 'Urgent and bold'}
      </p>

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
                      if (personalWhy.trim()) {
                        dispatch({ type: 'SET_PERSONAL_WHY', payload: prompt + '\n\n' + personalWhy });
                      } else {
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
      <TurnstileWidget />
    </div>
  );
}
