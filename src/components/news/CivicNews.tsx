'use client';

import { useState, useEffect } from 'react';
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

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
      {article.topic && (
        <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded">
          {CATEGORY_SHORT[article.topic.issueCategory] || article.topic.issueCategory}
        </span>
      )}
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
      {article.topic && (
        <Link
          href={actionUrl(article.topic)}
          className="inline-block mt-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
        >
          Take Action &rarr;
        </Link>
      )}
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

function TopicFilters({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Filter by Topic</h3>
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin">
        <button
          onClick={() => onSelect(null)}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
            selected === null
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All Topics
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              selected === cat
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
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
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/news/civic')
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data) => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Extract unique categories sorted by article count
  const categories = (() => {
    const counts = new Map<string, number>();
    for (const a of articles) {
      if (a.topic?.issueCategory) {
        counts.set(a.topic.issueCategory, (counts.get(a.topic.issueCategory) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
  })();

  // Filter by selected topic
  const filtered = selectedTopic
    ? articles.filter((a) => a.topic?.issueCategory === selectedTopic)
    : articles;
  const displayed = limit ? filtered.slice(0, limit) : filtered;

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
                {article.topic && (
                  <>
                    {' · '}
                    <Link href={actionUrl(article.topic)} className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                      Take Action &rarr;
                    </Link>
                  </>
                )}
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
      {showFilters && categories.length > 1 && (
        <TopicFilters
          categories={categories}
          selected={selectedTopic}
          onSelect={setSelectedTopic}
        />
      )}
      {selectedTopic && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Showing <span className="font-medium text-gray-700 dark:text-gray-200">{displayed.length}</span> article{displayed.length !== 1 ? 's' : ''} about{' '}
          <span className="font-medium text-gray-700 dark:text-gray-200">{CATEGORY_SHORT[selectedTopic] || selectedTopic}</span>
        </p>
      )}
      {displayed.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
          No articles found for this topic right now. Try &ldquo;All Topics&rdquo; to see all news.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayed.map((article, i) => (
            <NewsCard key={i} article={article} />
          ))}
        </div>
      )}
      {showFilters && selectedTopic && (
        <div className="mt-4 text-center">
          <Link
            href={`/contact?issue=${encodeURIComponent(articles.find(a => a.topic?.issueCategory === selectedTopic)?.topic?.issue ?? selectedTopic)}&issueCategory=${encodeURIComponent(selectedTopic)}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Contact your reps about {CATEGORY_SHORT[selectedTopic] || selectedTopic}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      )}
    </>
  );
}
