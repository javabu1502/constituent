'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ArticleTopic {
  issue: string;
  issueCategory: string;
}

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  topic?: ArticleTopic | null;
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
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
          {article.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {article.source && <span>{article.source}</span>}
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

interface CivicNewsProps {
  limit?: number;
  compact?: boolean;
}

export function CivicNews({ limit, compact = false }: CivicNewsProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news/civic')
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data) => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = limit ? articles.slice(0, limit) : articles;

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

  if (displayed.length === 0) return null;

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
                {article.source}{article.source && article.pubDate ? ' · ' : ''}{article.pubDate ? formatRelative(article.pubDate) : ''}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {displayed.map((article, i) => (
        <NewsCard key={i} article={article} />
      ))}
    </div>
  );
}
