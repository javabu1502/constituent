'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ContactCountData {
  count: number;
  topIssues: string[];
}

interface BioData {
  bioNarrative?: string;
}

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-14" />
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
    </div>
  );
}

function parseRssItems(xml: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && articles.length < 5) {
    const itemXml = match[1];
    const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1') ?? '';
    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '';
    const source = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1') ?? '';
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? '';
    if (title && link) {
      articles.push({ title, link, source, pubDate });
    }
  }
  return articles;
}

export default function ProfileClient({
  bioguideId,
  name,
}: {
  bioguideId: string;
  name: string;
}) {
  const [contactData, setContactData] = useState<ContactCountData | null>(null);
  const [bioData, setBioData] = useState<BioData | null>(null);
  const [news, setNews] = useState<NewsArticle[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const results = await Promise.allSettled([
        fetch(`/api/legislators/contact-count?repId=${bioguideId}`).then((r) => r.json()),
        fetch(`/api/legislators/bio?repId=${bioguideId}&level=federal`).then((r) => r.json()),
        fetch(
          `https://news.google.com/rss/search?q=${encodeURIComponent(`"${name}" when:7d`)}&num=5&hl=en-US&gl=US&ceid=US:en`,
          {
            signal: AbortSignal.timeout(8000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyDemocracy/1.0)' },
          }
        ).then((r) => r.text()),
      ]);

      if (cancelled) return;

      if (results[0].status === 'fulfilled') {
        setContactData(results[0].value);
      }
      if (results[1].status === 'fulfilled') {
        setBioData(results[1].value);
      }
      if (results[2].status === 'fulfilled') {
        setNews(parseRssItems(results[2].value));
      } else {
        setNews([]);
      }

      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [bioguideId, name]);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Count Badge */}
      {contactData && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
          {contactData.count > 0 ? (
            <>
              <p className="text-purple-800 dark:text-purple-300 font-medium">
                {contactData.count.toLocaleString()} constituent{contactData.count !== 1 ? 's have' : ' has'} contacted {name.split(' ').pop()} through My Democracy
              </p>
              {contactData.topIssues.length > 0 && (
                <p className="text-purple-700 dark:text-purple-400 text-sm mt-1">
                  Most common topics: {contactData.topIssues.join(', ')}
                </p>
              )}
            </>
          ) : (
            <p className="text-purple-800 dark:text-purple-300 font-medium">
              Be the first to contact {name.split(' ').pop()} through My Democracy
            </p>
          )}
          <Link
            href={`/contact?repId=${bioguideId}`}
            className="inline-block mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send a Message
          </Link>
        </div>
      )}

      {/* AI Bio Narrative */}
      {bioData?.bioNarrative && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {bioData.bioNarrative}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              Summary based on public records
            </p>
          </div>
        </section>
      )}

      {/* Recent News */}
      {news && news.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Recent News</h2>
          <div className="space-y-3">
            {news.map((article, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                    News
                  </span>
                </div>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-2 block mb-1"
                >
                  {article.title}
                </a>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {article.source}
                    {article.source && article.pubDate ? ' · ' : ''}
                    {article.pubDate ? formatRelative(article.pubDate) : ''}
                  </span>
                  <Link
                    href={`/contact?repId=${bioguideId}&issue=${encodeURIComponent(article.title)}`}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                  >
                    Write About This
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dashboard + Congress.gov links */}
      <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
        <Link
          href="/login"
          className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          Sign in for your personalized dashboard
        </Link>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <a
          href={`https://www.congress.gov/member/${name.toLowerCase().replace(/\s+/g, '-')}/${bioguideId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
        >
          View on Congress.gov
        </a>
      </div>
    </div>
  );
}
