'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface ArticleTopic {
  issue: string;
  issueCategory: string;
}

type SourceLean = 'left' | 'left-center' | 'center' | 'right-center' | 'right';

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  topic?: ArticleTopic | null;
  lean?: SourceLean | null;
  blindspot?: 'left' | 'right' | null;
  bill?: { label: string; url: string } | null;
  campaign?: { slug: string; headline: string } | null;
}

interface NewsContext {
  state: string | null;
  stateName: string | null;
  repNames: string[];
}

const LEAN_LABELS: Record<SourceLean, { label: string; color: string; dotColor: string }> = {
  'left': { label: 'Left', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dotColor: 'bg-blue-500' },
  'left-center': { label: 'Left-Center', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', dotColor: 'bg-blue-400' },
  'center': { label: 'Center', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', dotColor: 'bg-gray-400' },
  'right-center': { label: 'Right-Center', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', dotColor: 'bg-red-400' },
  'right': { label: 'Right', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dotColor: 'bg-red-500' },
};

function LeanBadge({ lean }: { lean: SourceLean }) {
  const { label, color } = LEAN_LABELS[lean];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none ${color}`}
      title={`Source bias rating: ${label} (based on AllSides / Ad Fontes Media)`}
    >
      {label}
    </span>
  );
}

function BlindspotBadge({ side }: { side: 'left' | 'right' }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      title={`Blindspot: this story got little to no coverage from ${side}-leaning sources`}
    >
      ⚠ {side === 'left' ? 'Left' : 'Right'} blindspot
    </span>
  );
}

function BiasLegend() {
  const leans: SourceLean[] = ['left', 'left-center', 'center', 'right-center', 'right'];
  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Understanding Source Bias Labels</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Each article shows a colored label indicating the source&apos;s editorial lean. This helps you read
        across the political spectrum and identify potential bias. Ratings are based on{' '}
        <a href="https://www.allsides.com/media-bias/ratings" target="_blank" rel="noopener noreferrer" className="underline text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">AllSides</a>{' '}
        and{' '}
        <a href="https://adfontesmedia.com/" target="_blank" rel="noopener noreferrer" className="underline text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">Ad Fontes Media</a>.
        A <span className="font-medium text-amber-600 dark:text-amber-400">blindspot</span> tag means a story multiple
        outlets covered got little to no coverage from one side of the spectrum.
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {leans.map((lean) => {
          const { label, dotColor } = LEAN_LABELS[lean];
          return (
            <span key={lean} className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
              <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function actionUrl(topic: ArticleTopic): string {
  const params = new URLSearchParams({ issue: topic.issue, issueCategory: topic.issueCategory });
  return `/contact?${params.toString()}`;
}

/** Build word-boundary regexes for the user's reps (full names + distinctive last names). */
function buildRepMatchers(repNames: string[]): RegExp[] {
  const patterns = new Set<string>();
  for (const name of repNames) {
    const clean = name.trim();
    if (!clean) continue;
    patterns.add(clean);
    const last = clean.split(/\s+/).pop() || '';
    if (last.length >= 4) patterns.add(last);
  }
  return [...patterns].map(
    (p) => new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  );
}

function mentionsRep(article: NewsArticle, matchers: RegExp[]): boolean {
  if (matchers.length === 0) return false;
  return matchers.some((re) => re.test(article.title));
}

function NewsCard({ article, isMyRep, weeklyWrites }: { article: NewsArticle; isMyRep: boolean; weeklyWrites: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {article.topic && (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded">
            {CATEGORY_SHORT[article.topic.issueCategory] || article.topic.issueCategory}
          </span>
        )}
        {isMyRep && (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded">
            🏛️ Your rep
          </span>
        )}
        {article.blindspot && <BlindspotBadge side={article.blindspot} />}
      </div>
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
          {article.title}
        </p>
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          {article.source && <span>{article.source}</span>}
          {article.lean && <LeanBadge lean={article.lean} />}
          {article.source && article.pubDate && <span>&middot;</span>}
          {article.pubDate && <span>{formatRelative(article.pubDate)}</span>}
        </div>
      </a>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {article.bill && (
          <a
            href={article.bill.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
            title="Read this bill on Congress.gov"
          >
            📜 {article.bill.label}
          </a>
        )}
        {article.campaign ? (
          <Link
            href={`/campaign/${article.campaign.slug}`}
            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
            title={article.campaign.headline}
          >
            Weigh in &rarr;
          </Link>
        ) : article.topic ? (
          <Link
            href={actionUrl(article.topic)}
            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Take Action &rarr;
          </Link>
        ) : null}
        {weeklyWrites > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {weeklyWrites} wrote about this this week
          </span>
        )}
      </div>
    </div>
  );
}

// Short labels for filter tabs
const CATEGORY_SHORT: Record<string, string> = {
  'Immigration': 'Immigration',
  'Health': 'Health',
  'Environmental Protection': 'Environment',
  'Crime and Law Enforcement': 'Crime',
  'Education': 'Education',
  'Taxation': 'Taxes',
  'Housing and Community Development': 'Housing',
  'Social Welfare': 'Social Security',
  'Armed Forces and National Security': 'Defense',
  'Government Operations and Politics': 'Elections',
  'Law': 'Courts',
  'Economics and Public Finance': 'Economy',
  'Transportation and Public Works': 'Infrastructure',
  'Families': 'Families',
  'Science, Technology, Communications': 'Tech',
  'International Affairs': 'Foreign Policy',
  'Labor and Employment': 'Labor',
};

const MY_REPS_FILTER = '__myreps__';

function TopicFilters({
  categories,
  selected,
  onSelect,
  showMyReps,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
  showMyReps: boolean;
}) {
  const chipClass = (active: boolean) =>
    `px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
      active
        ? 'bg-purple-600 text-white shadow-sm'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
    }`;
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Filter by Topic</h3>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin">
        <button onClick={() => onSelect(null)} className={chipClass(selected === null)}>
          All Topics
        </button>
        {showMyReps && (
          <button onClick={() => onSelect(MY_REPS_FILTER)} className={chipClass(selected === MY_REPS_FILTER)}>
            🏛️ My Reps
          </button>
        )}
        {categories.map((cat) => (
          <button key={cat} onClick={() => onSelect(cat)} className={chipClass(selected === cat)}>
            {CATEGORY_SHORT[cat] || cat}
          </button>
        ))}
      </div>
    </div>
  );
}

interface CivicNewsProps {
  limit?: number;
  compact?: boolean;
  showLegend?: boolean;
  showFilters?: boolean;
}

export function CivicNews({ limit, compact = false, showLegend = false, showFilters = false }: CivicNewsProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [stateArticles, setStateArticles] = useState<NewsArticle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [stateLoading, setStateLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [scope, setScope] = useState<'national' | 'state'>('national');
  const [context, setContext] = useState<NewsContext>({ state: null, stateName: null, repNames: [] });
  const [issueWrites, setIssueWrites] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/news/civic')
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data) => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Signed-in personalization: state + rep names (anonymous users get nulls).
  useEffect(() => {
    fetch('/api/me/news-context')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setContext({ state: data.state ?? null, stateName: data.stateName ?? null, repNames: data.repNames ?? [] });
      })
      .catch(() => {});
  }, []);

  // Advocacy context: how many people wrote to officials per issue this week.
  useEffect(() => {
    if (!showFilters) return;
    fetch('/api/trends?period=week')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.issueTrends) return;
        const writes: Record<string, number> = {};
        for (const [issue, t] of Object.entries(data.issueTrends as Record<string, { recent: number }>)) {
          if (t.recent > 0) writes[issue] = t.recent;
        }
        setIssueWrites(writes);
      })
      .catch(() => {});
  }, [showFilters]);

  // Lazy-load the state feed the first time the user switches to it.
  useEffect(() => {
    if (scope !== 'state' || !context.state || stateArticles !== null) return;
    setStateLoading(true);
    fetch(`/api/news/civic?state=${context.state}`)
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data) => setStateArticles(data.articles || []))
      .catch(() => setStateArticles([]))
      .finally(() => setStateLoading(false));
  }, [scope, context.state, stateArticles]);

  const repMatchers = useMemo(() => buildRepMatchers(context.repNames), [context.repNames]);

  const activeArticles = useMemo(
    () => (scope === 'state' ? stateArticles ?? [] : articles),
    [scope, stateArticles, articles]
  );

  const repMatchedLinks = useMemo(() => {
    const set = new Set<string>();
    for (const a of activeArticles) {
      if (mentionsRep(a, repMatchers)) set.add(a.link);
    }
    return set;
  }, [activeArticles, repMatchers]);

  // Extract unique categories sorted by article count
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of activeArticles) {
      if (a.topic?.issueCategory) {
        counts.set(a.topic.issueCategory, (counts.get(a.topic.issueCategory) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
  }, [activeArticles]);

  // Filter by selected topic (or the special My Reps filter)
  const filtered =
    selectedTopic === MY_REPS_FILTER
      ? activeArticles.filter((a) => repMatchedLinks.has(a.link))
      : selectedTopic
        ? activeArticles.filter((a) => a.topic?.issueCategory === selectedTopic)
        : activeArticles;
  const displayed = limit ? filtered.slice(0, limit) : filtered;

  const selectedIssue =
    selectedTopic && selectedTopic !== MY_REPS_FILTER
      ? activeArticles.find((a) => a.topic?.issueCategory === selectedTopic)?.topic?.issue ?? null
      : null;
  const selectedIssueWrites = selectedIssue ? issueWrites[selectedIssue] ?? 0 : 0;

  if (loading) {
    return (
      <div className={compact ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}>
        {Array.from({ length: limit || 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) return null;

  if (compact) {
    return (
      <div className="space-y-2">
        {displayed.map((article, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 shrink-0" />
            <div className="min-w-0">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{article.title}</p>
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {article.source}{article.lean && <>{' '}<LeanBadge lean={article.lean} /></>}{article.source && article.pubDate ? ' · ' : ''}{article.pubDate ? formatRelative(article.pubDate) : ''}
                {article.campaign ? (
                  <>
                    {' · '}
                    <Link href={`/campaign/${article.campaign.slug}`} className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                      Weigh in &rarr;
                    </Link>
                  </>
                ) : article.topic ? (
                  <>
                    {' · '}
                    <Link href={actionUrl(article.topic)} className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                      Take Action &rarr;
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {showLegend && <BiasLegend />}

      {/* National / My State scope toggle (signed-in users with a saved state) */}
      {showFilters && context.state && (
        <div className="mb-4 flex gap-1">
          {([
            ['national', 'National'],
            ['state', `My State (${context.state})`],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => {
                setScope(val);
                setSelectedTopic(null);
              }}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors ${
                scope === val
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {showFilters && categories.length > 1 && (
        <TopicFilters
          categories={categories}
          selected={selectedTopic}
          onSelect={setSelectedTopic}
          showMyReps={repMatchedLinks.size > 0}
        />
      )}

      {selectedTopic && selectedTopic !== MY_REPS_FILTER && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Showing <span className="font-medium text-gray-700 dark:text-gray-200">{displayed.length}</span> article{displayed.length !== 1 ? 's' : ''} about{' '}
          <span className="font-medium text-gray-700 dark:text-gray-200">{CATEGORY_SHORT[selectedTopic] || selectedTopic}</span>
          {selectedIssueWrites > 0 && (
            <>
              {' — '}
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                {selectedIssueWrites} {selectedIssueWrites === 1 ? 'person' : 'people'} wrote to officials about this in the last week
              </span>
            </>
          )}
        </p>
      )}
      {selectedTopic === MY_REPS_FILTER && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Showing <span className="font-medium text-gray-700 dark:text-gray-200">{displayed.length}</span> article{displayed.length !== 1 ? 's' : ''} mentioning{' '}
          <span className="font-medium text-gray-700 dark:text-gray-200">your representatives</span>
        </p>
      )}

      {stateLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
          {scope === 'state'
            ? `No ${context.stateName ?? 'state'} government news right now. Check back soon.`
            : 'No articles found for this topic right now. Try “All Topics” to see all news.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayed.map((article, i) => (
            <NewsCard
              key={i}
              article={article}
              isMyRep={repMatchedLinks.has(article.link)}
              weeklyWrites={article.topic ? issueWrites[article.topic.issue] ?? 0 : 0}
            />
          ))}
        </div>
      )}

      {showFilters && selectedTopic && selectedTopic !== MY_REPS_FILTER && selectedIssue && (
        <div className="mt-4 text-center">
          <Link
            href={`/contact?issue=${encodeURIComponent(selectedIssue)}&issueCategory=${encodeURIComponent(selectedTopic)}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Write to your officials about {CATEGORY_SHORT[selectedTopic] || selectedTopic}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      )}
    </>
  );
}
