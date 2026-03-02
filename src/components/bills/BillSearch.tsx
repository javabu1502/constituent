'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

interface Bill {
  id: string;
  identifier: string;
  title: string;
  session: string;
  subjects: string[];
  updatedAt: string;
  url: string;
  sponsor: string | null;
  latestAction: string | null;
  latestActionDate: string | null;
}

interface BillSearchProps {
  stateCode: string;
  stateName: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BillSearch({ stateCode, stateName }: BillSearchProps) {
  const [query, setQuery] = useState('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const search = useCallback(async (append = false) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        state: stateCode,
        query: query.trim(),
      });
      if (append && endCursor) {
        params.set('after', endCursor);
      }

      const res = await fetch(`/api/bills?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to search bills');
        return;
      }

      setBills((prev) => (append ? [...prev, ...data.bills] : data.bills));
      setTotalCount(data.totalCount);
      setHasNextPage(data.hasNextPage);
      setEndCursor(data.endCursor);
      setSearched(true);
    } catch {
      setError('Failed to search bills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, stateCode, endCursor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBills([]);
    setEndCursor(null);
    search(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${stateName} legislation...`}
          className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl mb-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {searched && !loading && bills.length === 0 && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No bills found for &quot;{query}&quot; in {stateName}.
        </p>
      )}

      {bills.length > 0 && (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {totalCount} bill{totalCount !== 1 ? 's' : ''} found
          </p>
          <div className="space-y-3">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                        {bill.identifier}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Session {bill.session}
                      </span>
                    </div>
                    <a
                      href={bill.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 line-clamp-2"
                    >
                      {bill.title}
                    </a>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {bill.sponsor && (
                        <span>Sponsor: {bill.sponsor}</span>
                      )}
                      {bill.latestAction && (
                        <span className="truncate max-w-[250px]">
                          {bill.latestAction}
                          {bill.latestActionDate && ` (${formatDate(bill.latestActionDate)})`}
                        </span>
                      )}
                    </div>
                    {bill.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bill.subjects.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/contact?issue=${encodeURIComponent(bill.identifier + ': ' + bill.title.slice(0, 80))}&issueCategory=Law`}
                    className="shrink-0 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 whitespace-nowrap"
                  >
                    Take Action
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {hasNextPage && (
            <button
              onClick={() => search(true)}
              disabled={loading}
              className="w-full mt-4 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Bills'}
            </button>
          )}
        </>
      )}

      {!searched && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search for bills by keyword, topic, or bill number.
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            {['education', 'housing', 'healthcare', 'taxes', 'environment'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  setBills([]);
                  setEndCursor(null);
                  // Trigger search after state update
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    form?.requestSubmit();
                  }, 0);
                }}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 text-center">
        Data from{' '}
        <a href="https://openstates.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-600 dark:hover:text-purple-400">
          Open States
        </a>
      </p>
    </div>
  );
}
