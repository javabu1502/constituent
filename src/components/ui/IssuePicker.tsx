'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { searchIssues, type IssueOption } from '@/lib/policy-areas';

interface IssuePickerProps {
  value: string;
  category: string;
  onChange: (issue: string, category: string) => void;
}

// Popular topics shown as buttons - plain language, ordered by relevance
const POPULAR_TOPICS: { label: string; category: string; subtopics: { label: string; category: string }[] }[] = [
  {
    label: 'Healthcare',
    category: 'Health',
    subtopics: [
      { label: 'Medicare', category: 'Health' },
      { label: 'Medicaid', category: 'Health' },
      { label: 'Prescription Drug Costs', category: 'Health' },
      { label: 'Mental Health', category: 'Health' },
      { label: 'Reproductive Health', category: 'Health' },
      { label: 'ACA/Obamacare', category: 'Health' },
    ],
  },
  {
    label: 'Immigration',
    category: 'Immigration',
    subtopics: [
      { label: 'Border Security', category: 'Immigration' },
      { label: 'DACA', category: 'Immigration' },
      { label: 'Visas', category: 'Immigration' },
      { label: 'Asylum', category: 'Immigration' },
      { label: 'Refugee Policy', category: 'Immigration' },
    ],
  },
  {
    label: 'Economy',
    category: 'Economics and Public Finance',
    subtopics: [
      { label: 'Inflation', category: 'Economics and Public Finance' },
      { label: 'Cost of Living', category: 'Economics and Public Finance' },
      { label: 'Federal Budget', category: 'Economics and Public Finance' },
      { label: 'National Debt', category: 'Economics and Public Finance' },
    ],
  },
  {
    label: 'Education',
    category: 'Education',
    subtopics: [
      { label: 'K-12 Education', category: 'Education' },
      { label: 'Student Loans', category: 'Education' },
      { label: 'Higher Education', category: 'Education' },
      { label: 'School Choice', category: 'Education' },
    ],
  },
  {
    label: 'Crime & Justice',
    category: 'Crime and Law Enforcement',
    subtopics: [
      { label: 'Gun Violence', category: 'Crime and Law Enforcement' },
      { label: 'Criminal Justice Reform', category: 'Crime and Law Enforcement' },
      { label: 'Police Reform', category: 'Crime and Law Enforcement' },
      { label: 'Drug Policy', category: 'Crime and Law Enforcement' },
    ],
  },
  {
    label: 'Climate & Energy',
    category: 'Environmental Protection',
    subtopics: [
      { label: 'Climate Change', category: 'Environmental Protection' },
      { label: 'Renewable Energy', category: 'Energy' },
      { label: 'Oil and Gas', category: 'Energy' },
      { label: 'Nuclear Energy', category: 'Energy' },
      { label: 'Clean Air', category: 'Environmental Protection' },
      { label: 'Clean Water', category: 'Environmental Protection' },
    ],
  },
  {
    label: 'Housing',
    category: 'Housing and Community Development',
    subtopics: [
      { label: 'Affordable Housing', category: 'Housing and Community Development' },
      { label: 'Rent', category: 'Housing and Community Development' },
      { label: 'Homelessness', category: 'Housing and Community Development' },
      { label: 'Mortgage Rates', category: 'Housing and Community Development' },
    ],
  },
  {
    label: 'Taxes',
    category: 'Taxation',
    subtopics: [
      { label: 'Income Tax', category: 'Taxation' },
      { label: 'Corporate Tax', category: 'Taxation' },
      { label: 'Tax Reform', category: 'Taxation' },
      { label: 'Tariffs', category: 'Foreign Trade and International Finance' },
    ],
  },
  {
    label: 'Social Security & Safety Net',
    category: 'Social Welfare',
    subtopics: [
      { label: 'Social Security', category: 'Social Welfare' },
      { label: 'Disability Benefits', category: 'Social Welfare' },
      { label: 'Safety Net Programs', category: 'Social Welfare' },
      { label: 'Food Assistance', category: 'Social Welfare' },
    ],
  },
  {
    label: 'Veterans & Military',
    category: 'Armed Forces and National Security',
    subtopics: [
      { label: 'Veterans', category: 'Armed Forces and National Security' },
      { label: 'VA Healthcare', category: 'Armed Forces and National Security' },
      { label: 'Military Funding', category: 'Armed Forces and National Security' },
      { label: 'Defense Spending', category: 'Armed Forces and National Security' },
    ],
  },
  {
    label: 'Civil Rights',
    category: 'Civil Rights and Liberties, Minority Issues',
    subtopics: [
      { label: 'Voting Rights', category: 'Civil Rights and Liberties, Minority Issues' },
      { label: 'Discrimination', category: 'Civil Rights and Liberties, Minority Issues' },
      { label: 'LGBTQ+ Rights', category: 'Civil Rights and Liberties, Minority Issues' },
      { label: 'Free Speech', category: 'Civil Rights and Liberties, Minority Issues' },
    ],
  },
  {
    label: 'Jobs & Workers',
    category: 'Labor and Employment',
    subtopics: [
      { label: 'Minimum Wage', category: 'Labor and Employment' },
      { label: 'Worker Rights', category: 'Labor and Employment' },
      { label: 'Unions', category: 'Labor and Employment' },
    ],
  },
  {
    label: 'Families',
    category: 'Families',
    subtopics: [
      { label: 'Child Care', category: 'Families' },
      { label: 'Paid Family Leave', category: 'Families' },
    ],
  },
  {
    label: 'Technology',
    category: 'Science, Technology, Communications',
    subtopics: [
      { label: 'AI', category: 'Science, Technology, Communications' },
      { label: 'Data Privacy', category: 'Science, Technology, Communications' },
      { label: 'Social Media Regulation', category: 'Science, Technology, Communications' },
    ],
  },
  {
    label: 'Foreign Policy',
    category: 'International Affairs',
    subtopics: [
      { label: 'Ukraine', category: 'International Affairs' },
      { label: 'Foreign Aid', category: 'International Affairs' },
      { label: 'Tariffs', category: 'Foreign Trade and International Finance' },
    ],
  },
];

export function IssuePicker({ value, category, onChange }: IssuePickerProps) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(category === 'Other');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = searchIssues(query);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const selectOption = useCallback(
    (option: IssueOption) => {
      onChange(option.label, option.category);
      setQuery('');
      setIsOpen(false);
      setShowSearch(false);
      setShowOtherInput(false);
      setExpandedTopic(null);
      setHighlightIndex(-1);
    },
    [onChange]
  );

  const selectOther = useCallback(() => {
    setShowOtherInput(true);
    setIsOpen(false);
    setShowSearch(false);
    setQuery('');
    setExpandedTopic(null);
    setHighlightIndex(-1);
    onChange('', 'Other');
    setTimeout(() => {
      const otherInput = containerRef.current?.querySelector<HTMLInputElement>('[data-other-input]');
      otherInput?.focus();
    }, 0);
  }, [onChange]);

  const clearSelection = useCallback(() => {
    onChange('', '');
    setShowOtherInput(false);
    setShowSearch(false);
    setQuery('');
    setExpandedTopic(null);
    setHighlightIndex(-1);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }
    const totalItems = results.length + 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          selectOption(results[highlightIndex]);
        } else if (highlightIndex === results.length) {
          selectOther();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  // Selected state - show pill
  if (value && category && category !== 'Other') {
    return (
      <div ref={containerRef}>
        <div className="flex items-center gap-2 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
          <span className="flex-1 text-sm text-gray-900 dark:text-white">
            <span className="font-medium">{value}</span>
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
            aria-label="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Other free-text input
  if (showOtherInput) {
    return (
      <div ref={containerRef}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            Other
          </span>
          <button type="button" onClick={clearSelection} className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700">
            Change topic
          </button>
        </div>
        <input
          data-other-input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, 'Other')}
          placeholder="Describe your issue..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>
    );
  }

  // Search mode
  if (showSearch) {
    return (
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => { setShowSearch(false); setQuery(''); setIsOpen(false); }}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to topics
          </button>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setHighlightIndex(-1); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder='Search topics, e.g. "child care", "student loans"'
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          role="combobox"
          aria-controls="issue-picker-listbox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          autoComplete="off"
        />
        {isOpen && (
          <div ref={listRef} id="issue-picker-listbox" role="listbox" className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg">
            {results.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No matching topics</div>
            )}
            {results.map((option, i) => (
              <button
                key={`${option.category}-${option.label}`}
                data-option
                type="button"
                role="option"
                aria-selected={i === highlightIndex}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  i === highlightIndex
                    ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100'
                    : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
            <button
              data-option
              type="button"
              role="option"
              aria-selected={highlightIndex === results.length}
              onClick={selectOther}
              onMouseEnter={() => setHighlightIndex(results.length)}
              className={`w-full text-left px-4 py-2.5 text-sm border-t border-gray-200 dark:border-gray-700 transition-colors ${
                highlightIndex === results.length
                  ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Other - describe your own issue
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default: popular topic buttons
  return (
    <div ref={containerRef}>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Tap the topic you care about:
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {POPULAR_TOPICS.map((topic) => (
          <button
            key={topic.label}
            type="button"
            onClick={() => setExpandedTopic(expandedTopic === topic.label ? null : topic.label)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              expandedTopic === topic.label
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300'
            }`}
          >
            {topic.label}
          </button>
        ))}
      </div>

      {/* Subtopics for expanded category */}
      {expandedTopic && (
        <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
          <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">
            What specifically about {expandedTopic}?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_TOPICS.find((t) => t.label === expandedTopic)?.subtopics.map((sub) => (
              <button
                key={sub.label}
                type="button"
                onClick={() => selectOption(sub)}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              >
                {sub.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const topic = POPULAR_TOPICS.find((t) => t.label === expandedTopic);
                if (topic) selectOption({ label: topic.label, category: topic.category });
              }}
              className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Just &quot;{expandedTopic}&quot; in general
            </button>
          </div>
        </div>
      )}

      {/* Secondary actions */}
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => {
            setShowSearch(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search all topics
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          type="button"
          onClick={selectOther}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
        >
          Write my own
        </button>
      </div>
    </div>
  );
}
