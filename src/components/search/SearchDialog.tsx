'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GUIDES } from '@/lib/guides';
import { US_STATES } from '@/lib/constants';
import { searchIssues } from '@/lib/policy-areas';

interface SearchResult {
  type: 'guide' | 'state' | 'issue' | 'legislator' | 'campaign' | 'link';
  title: string;
  subtitle?: string;
  href: string;
}

interface SearchDialogProps {
  onClose: () => void;
}

export function SearchDialog({ onClose }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [serverResults, setServerResults] = useState<{
    legislators: { id: string; name: string; title: string; party: string; state: string }[];
    campaigns: { slug: string; headline: string; issue_area: string }[];
  }>({ legislators: [], campaigns: [] });
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Client-side search (instant)
  const clientResults: SearchResult[] = [];
  const q = query.trim().toLowerCase();

  if (q.length >= 2) {
    // Guides
    const guideMatches = GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
    ).slice(0, 4);
    for (const g of guideMatches) {
      clientResults.push({ type: 'guide', title: g.title, subtitle: g.description, href: g.href });
    }

    // States
    const stateMatches = US_STATES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase() === q
    ).slice(0, 3);
    for (const s of stateMatches) {
      clientResults.push({
        type: 'state',
        title: s.name,
        subtitle: `State info, legislators, and voting rules`,
        href: `/states/${s.name.toLowerCase().replace(/\s+/g, '-')}`,
      });
    }

    // Issues
    const issueMatches = searchIssues(query).slice(0, 4);
    for (const iss of issueMatches) {
      clientResults.push({
        type: 'issue',
        title: iss.label,
        subtitle: iss.category,
        href: `/contact?issue=${encodeURIComponent(iss.label)}&issueCategory=${encodeURIComponent(iss.category)}`,
      });
    }
  }

  // Server-side search (debounced)
  const fetchServerResults = useCallback((searchQuery: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < 2) {
      setServerResults({ legislators: [], campaigns: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setServerResults(data);
        }
      } catch {
        // Silently fail
      }
      setIsSearching(false);
    }, 300);
  }, []);

  // Trigger server search on query change
  useEffect(() => {
    fetchServerResults(query);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchServerResults]);

  // Build server results
  const serverResultItems: SearchResult[] = [];
  for (const leg of serverResults.legislators) {
    serverResultItems.push({
      type: 'legislator',
      title: leg.name,
      subtitle: `${leg.title} (${leg.party}) — ${leg.state}`,
      href: `/rep/${leg.id}`,
    });
  }
  for (const camp of serverResults.campaigns) {
    serverResultItems.push({
      type: 'campaign',
      title: camp.headline,
      subtitle: camp.issue_area,
      href: `/campaign/${camp.slug}`,
    });
  }

  // All results flattened
  const allResults = [...clientResults, ...serverResultItems];

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[activeIndex]) {
      e.preventDefault();
      navigate(allResults[activeIndex].href);
    }
  }

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  // Type labels
  const typeLabels: Record<string, string> = {
    guide: 'Guide',
    state: 'State',
    issue: 'Issue',
    legislator: 'Representative',
    campaign: 'Campaign',
    link: 'Page',
  };

  const typeColors: Record<string, string> = {
    guide: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    state: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    issue: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    legislator: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    campaign: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    link: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg max-h-[65vh] flex flex-col overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search guides, states, representatives, issues..."
            aria-label="Search guides, states, representatives, issues"
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {q.length < 2 ? (
            /* Quick links when no query */
            <div className="p-4">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Quick Links
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Contact Your Reps', href: '/contact' },
                  { label: 'States', href: '/states' },
                  { label: 'News', href: '/news' },
                  { label: 'Trends', href: '/trends' },
                  { label: 'Vote', href: '/vote' },
                  { label: 'Guides', href: '/guides' },
                  { label: 'Regulations', href: '/regulations' },
                  { label: 'Campaigns', href: '/campaigns' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : allResults.length === 0 && !isSearching ? (
            /* No results */
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No results for &quot;{query}&quot;
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/news" onClick={onClose} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">Search News</Link>
                <Link href="/regulations" onClick={onClose} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">Search Regulations</Link>
                <Link href="/states" onClick={onClose} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">Browse States</Link>
              </div>
            </div>
          ) : (
            /* Results list */
            <div className="py-2">
              {allResults.map((result, index) => (
                <button
                  key={`${result.type}-${result.href}-${index}`}
                  onClick={() => navigate(result.href)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    index === activeIndex
                      ? 'bg-purple-50 dark:bg-purple-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${typeColors[result.type] || typeColors.link}`}>
                    {typeLabels[result.type] || 'Page'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
              <div role="status" aria-live="polite" className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
                {isSearching ? 'Searching...' : q.length >= 2 ? `${allResults.length} result${allResults.length !== 1 ? 's' : ''}` : ''}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">&uarr;</kbd>
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">&darr;</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">&crarr;</kbd>
              select
            </span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">&#8984;K</kbd> to search
          </span>
        </div>
      </div>
    </div>
  );
}
