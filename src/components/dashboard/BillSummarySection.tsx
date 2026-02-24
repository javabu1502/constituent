'use client';

import { useState } from 'react';
import type { FeedBill, BillSummary } from '@/lib/types';

export function BillSummarySection({ bill, userIssues }: { bill: FeedBill; userIssues?: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);

    // If already loaded, just expand
    if (summary) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/feed/bill-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_number: bill.bill_number,
          title: bill.title,
          description: bill.description || undefined,
          sponsors: bill.sponsors || [],
          status: bill.status || undefined,
          last_action: bill.last_action || undefined,
          policy_area: bill.policy_area || undefined,
          committee: bill.committee || undefined,
          level: bill.level,
          userIssues: userIssues && userIssues.length > 0 ? userIssues : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate summary');

      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 mb-2">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {expanded ? 'Hide summary' : 'Understand this bill'}
        <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-3 space-y-3">
          {loading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-amber-200 dark:bg-amber-800/50 rounded w-full" />
              <div className="h-3 bg-amber-200 dark:bg-amber-800/50 rounded w-5/6" />
              <div className="h-3 bg-amber-200 dark:bg-amber-800/50 rounded w-4/6" />
              <div className="mt-3 h-3 bg-green-200 dark:bg-green-800/50 rounded w-full" />
              <div className="h-3 bg-green-200 dark:bg-green-800/50 rounded w-3/4" />
              <div className="mt-3 h-3 bg-red-200 dark:bg-red-800/50 rounded w-full" />
              <div className="h-3 bg-red-200 dark:bg-red-800/50 rounded w-3/4" />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {summary && (
            <>
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Summary</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{summary.summary}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Arguments For</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{summary.arguments_for}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Arguments Against</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{summary.arguments_against}</p>
              </div>

              {summary.personal_relevance && (
                <div>
                  <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">What This Means for You</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{summary.personal_relevance}</p>
                </div>
              )}

              <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                AI-generated summary. Read full bill text for authoritative information.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
