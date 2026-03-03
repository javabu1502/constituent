'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Campaign {
  id: string;
  slug: string;
  headline: string;
  description: string;
  issue_area: string;
  action_count: number;
  created_at: string;
}

export function CampaignFilters({ campaigns }: { campaigns: Campaign[] }) {
  const [activeIssue, setActiveIssue] = useState<string | null>(null);
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');

  // Extract unique issue areas
  const issueAreas = Array.from(new Set(campaigns.map((c) => c.issue_area))).sort();

  // Filter
  const filtered = activeIssue
    ? campaigns.filter((c) => c.issue_area === activeIssue)
    : campaigns;

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'popular') return (b.action_count ?? 0) - (a.action_count ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2 flex-1">
          <button
            onClick={() => setActiveIssue(null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              !activeIssue
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {issueAreas.map((area) => (
            <button
              key={area}
              onClick={() => setActiveIssue(area === activeIssue ? null : area)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                activeIssue === area
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm shrink-0">
          <span className="text-gray-400 dark:text-gray-500 mr-1">Sort:</span>
          <button
            onClick={() => setSort('recent')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              sort === 'recent' ? 'bg-gray-200 dark:bg-gray-700 font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSort('popular')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              sort === 'popular' ? 'bg-gray-200 dark:bg-gray-700 font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Popular
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {sorted.length} campaign{sorted.length !== 1 ? 's' : ''}
        {activeIssue ? ` in ${activeIssue}` : ''}
      </p>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No campaigns match this filter.</p>
          <button
            onClick={() => setActiveIssue(null)}
            className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaign/${campaign.slug}`}
              className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  {campaign.issue_area}
                </span>
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-bold">{campaign.action_count ?? 0}</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {campaign.headline}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {campaign.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
