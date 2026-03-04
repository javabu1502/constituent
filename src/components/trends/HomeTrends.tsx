'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Issue {
  issue_area: string;
  count: number;
}

interface TopRep {
  legislatorId: string;
  name: string;
  party: string;
  chamber: string;
  count: number;
}

export function HomeTrends() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [topReps, setTopReps] = useState<TopRep[]>([]);

  useEffect(() => {
    fetch('/api/trends?period=all&level=all')
      .then((r) => r.json())
      .then((data) => {
        setIssues((data.issues || []).slice(0, 5));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    fetch('/api/trends/top-reps')
      .then((r) => r.json())
      .then((data) => {
        // Combine senate + house, sort by count, take top 5
        const all = [...(data.senate || []), ...(data.house || [])]
          .sort((a: TopRep, b: TopRep) => b.count - a.count)
          .slice(0, 5);
        setTopReps(all);
      })
      .catch(() => {});
  }, []);

  const maxCount = issues[0]?.count ?? 1;

  if (loaded && issues.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          What People Are Writing About
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-xl mx-auto">
          Top issues constituents are raising with their representatives
        </p>

        {!loaded ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue, i) => (
              <div
                key={issue.issue_area}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3"
              >
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-6 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {issue.issue_area}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                      {issue.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                      style={{ width: `${(issue.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Contacted Reps */}
        {topReps.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Top Contacted Representatives
            </h3>
            <div className="flex flex-wrap gap-2">
              {topReps.map((rep) => (
                <Link
                  key={rep.legislatorId}
                  href={`/rep/${rep.legislatorId}`}
                  className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    rep.party === 'Democratic' ? 'bg-blue-500' :
                    rep.party === 'Republican' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{rep.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {rep.chamber === 'Senate' ? 'Sen.' : 'Rep.'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            href="/trends"
            className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            See all trends
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
