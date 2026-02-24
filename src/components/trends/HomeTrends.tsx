'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Issue {
  issue_area: string;
  count: number;
}

interface Stats {
  totalMessages: number;
  statesRepresented: number;
}

export function HomeTrends() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/trends?period=all&level=all')
      .then((r) => r.json())
      .then((data) => {
        setIssues((data.issues || []).slice(0, 5));
        setStats(data.stats || null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const maxCount = issues[0]?.count ?? 1;

  if (loaded && issues.length === 0 && !stats) return null;

  return (
    <section className="py-16 sm:py-20 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        {/* Social proof stats */}
        {stats && stats.totalMessages > 0 && (
          <div className="flex items-center justify-center gap-8 sm:gap-12 mb-10">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalMessages.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Actions Taken</div>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
                {stats.statesRepresented}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">States</div>
            </div>
          </div>
        )}

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
