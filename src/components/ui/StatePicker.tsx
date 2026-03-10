'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { US_STATES } from '@/lib/constants';

const POPULAR_STATES = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL'] as const;

function stateSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export function StatePicker() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query.trim()
    ? US_STATES.filter((s) => {
        const q = query.trim().toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
      })
    : [];

  const showDropdown = open && query.trim().length > 0;

  const selectState = useCallback((name: string) => {
    setQuery('');
    setOpen(false);
    router.push(`/states/${stateSlug(name)}`);
  }, [router]);

  // Outside click to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          selectState(filtered[activeIndex].name);
        } else if (filtered.length === 1) {
          selectState(filtered[0].name);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  }

  const listboxId = 'state-picker-listbox';

  return (
    <div ref={containerRef} className="w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `state-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          placeholder="Search for your state..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {showDropdown && filtered.length > 0 && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filtered.map((s, i) => (
              <li
                key={s.code}
                id={`state-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => selectState(s.name)}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between ${
                  i === activeIndex
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{s.code}</span>
              </li>
            ))}
          </ul>
        )}

        {showDropdown && query.trim().length > 0 && filtered.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">No states match &ldquo;{query.trim()}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Popular state quick-links */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">Popular:</span>
        {POPULAR_STATES.map((code) => {
          const state = US_STATES.find((s) => s.code === code)!;
          return (
            <button
              key={code}
              onClick={() => selectState(state.name)}
              className="px-2.5 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-400 transition-colors"
            >
              {state.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
