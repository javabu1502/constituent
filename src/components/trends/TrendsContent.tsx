'use client';

import { useState, useEffect, useCallback } from 'react';

interface Subtopic {
  name: string;
  count: number;
}

interface IssueWithSubtopics {
  issue_area: string;
  count: number;
  subtopics: Subtopic[];
}

interface TrendsData {
  issues: IssueWithSubtopics[];
  stats: {
    totalMessages: number;
    messagesThisMonth: number;
    statesRepresented: number;
  };
  stateIssues?: IssueWithSubtopics[];
  userState?: string;
}

type Period = 'all' | 'month' | 'week';
type Level = 'all' | 'federal' | 'state';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IssueBar({
  issue,
  rank,
  maxCount,
  gradientFrom,
  gradientTo,
}: {
  issue: IssueWithSubtopics;
  rank: number;
  maxCount: number;
  gradientFrom: string;
  gradientTo: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSubtopics = issue.subtopics.length > 0;
  const maxSubCount = issue.subtopics[0]?.count ?? 1;

  return (
    <div>
      <button
        onClick={() => hasSubtopics && setExpanded(!expanded)}
        className={`w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3 text-left ${
          hasSubtopics ? 'cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 transition-colors' : 'cursor-default'
        }`}
      >
        <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-6 text-right shrink-0">
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {issue.issue_area}
            </span>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {issue.count.toLocaleString()}
              </span>
              {hasSubtopics && <ChevronIcon open={expanded} />}
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
              style={{ width: `${(issue.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      </button>
      {expanded && hasSubtopics && (
        <div className="ml-9 mt-1 mb-1 space-y-1">
          {issue.subtopics.map((sub) => (
            <div
              key={sub.name}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-700/50 px-3 py-2 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                    {sub.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">
                    {sub.count.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-70`}
                    style={{ width: `${(sub.count / maxSubCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrendsContent() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');
  const [level, setLevel] = useState<Level>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, level });
      const res = await fetch(`/api/trends?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }, [period, level]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxCount = data?.issues?.[0]?.count ?? 1;
  const maxStateCount = data?.stateIssues?.[0]?.count ?? 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advocacy Trends</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          See what issues people across the country are writing to their representatives about.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {data?.stats.totalMessages.toLocaleString() ?? '—'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Actions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {data?.stats.messagesThisMonth.toLocaleString() ?? '—'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">This Month</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {data?.stats.statesRepresented ?? '—'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">States Represented</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-6">
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
            Time Period
          </span>
          <div className="flex gap-1">
            {([['all', 'All Time'], ['month', 'This Month'], ['week', 'This Week']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPeriod(val)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  period === val
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
            Level
          </span>
          <div className="flex gap-1">
            {([['all', 'All'], ['federal', 'Federal'], ['state', 'State']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setLevel(val)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  level === val
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Issue Rankings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Issues</h2>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        ) : !data?.issues.length ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No messages found for the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.issues.map((issue, i) => (
              <IssueBar
                key={issue.issue_area}
                issue={issue}
                rank={i + 1}
                maxCount={maxCount}
                gradientFrom="from-purple-500"
                gradientTo="to-purple-600"
              />
            ))}
          </div>
        )}
      </div>

      {/* State Section */}
      {data?.userState && data.stateIssues && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Trending in {data.userState}
          </h2>
          {!data.stateIssues.length ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No messages from your state for the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.stateIssues.map((issue, i) => (
                <IssueBar
                  key={issue.issue_area}
                  issue={issue}
                  rank={i + 1}
                  maxCount={maxStateCount}
                  gradientFrom="from-purple-400"
                  gradientTo="to-purple-500"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
