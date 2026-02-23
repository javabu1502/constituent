'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { searchIssues, type IssueOption } from '@/lib/policy-areas';

interface IssuePickerProps {
  value: string;
  category: string;
  onChange: (issue: string, category: string) => void;
}

export function IssuePicker({ value, category, onChange }: IssuePickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(category === 'Other');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = searchIssues(query);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll highlighted item into view
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
      setShowOtherInput(false);
      setHighlightIndex(-1);
    },
    [onChange]
  );

  const selectOther = useCallback(() => {
    setShowOtherInput(true);
    setIsOpen(false);
    setQuery('');
    setHighlightIndex(-1);
    onChange('', 'Other');
    // Focus the "other" text input after render
    setTimeout(() => {
      const otherInput = containerRef.current?.querySelector<HTMLInputElement>('[data-other-input]');
      otherInput?.focus();
    }, 0);
  }, [onChange]);

  const clearSelection = useCallback(() => {
    onChange('', '');
    setShowOtherInput(false);
    setQuery('');
    setHighlightIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const totalItems = results.length + 1; // +1 for "Other"

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

  // Show selected value as a pill
  if (value && category && category !== 'Other') {
    return (
      <div ref={containerRef}>
        <div className="flex items-center gap-2 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
          <span className="flex-1 text-sm text-gray-900 dark:text-white">
            <span className="font-medium">{value}</span>
            <span className="text-gray-400 dark:text-gray-500"> — {category}</span>
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

  // Show "Other" free-text input
  if (showOtherInput) {
    return (
      <div ref={containerRef}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            Other
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700"
          >
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

  // Show search input with dropdown
  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlightIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder='Search topics, e.g. "child care", "gun control", "student loans"'
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        autoComplete="off"
      />

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg"
        >
          {results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No matching topics
            </div>
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
              <span className="text-gray-400 dark:text-gray-500"> — {option.category}</span>
            </button>
          ))}

          {/* Other option */}
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
            Other — describe your own issue
          </button>
        </div>
      )}
    </div>
  );
}
