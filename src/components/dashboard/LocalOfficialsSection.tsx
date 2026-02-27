'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { LocalOfficial, RepNewsArticle } from '@/lib/types';

function getPartyColor(party: string) {
  const p = party.toLowerCase();
  if (p.includes('democrat')) return { bg: 'bg-blue-600', text: 'text-white' };
  if (p.includes('republican')) return { bg: 'bg-red-600', text: 'text-white' };
  return { bg: 'bg-gray-500', text: 'text-white' };
}

function getPartyBadgeClass(party: string) {
  const p = party.toLowerCase();
  if (p.includes('democrat')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  if (p.includes('republican')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

function getJurisdictionLabel(level: string): string {
  switch (level) {
    case 'county': return 'County';
    case 'city': return 'City';
    case 'school_district': return 'School District';
    case 'special_district': return 'Special District';
    default: return 'Other';
  }
}

function NewsPanel({ name, jurisdiction }: { name: string; jurisdiction: string }) {
  const [articles, setArticles] = useState<RepNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ name, city: jurisdiction });
    fetch(`/api/local-officials/news?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data) => setArticles(data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [name, jurisdiction]);

  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">No recent news found.</p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {articles.slice(0, 5).map((article, i) => (
        <a
          key={i}
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2">{article.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {article.source}
            {article.pubDate && ` · ${new Date(article.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </p>
        </a>
      ))}
    </div>
  );
}

function LocalOfficialCard({ official }: { official: LocalOfficial }) {
  const [showNews, setShowNews] = useState(false);
  const partyColor = getPartyColor(official.party);
  const initials = official.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col">
      <div className="flex items-start gap-3 mb-2">
        {official.photoUrl ? (
          <img
            src={official.photoUrl}
            alt={official.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${partyColor.bg} ${partyColor.text} font-semibold text-sm ${official.photoUrl ? 'hidden' : ''}`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {official.name}
          </h4>
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-0.5 ${getPartyBadgeClass(official.party)}`}>
            {official.party}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">{official.officeName}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {official.jurisdiction}
        <span className="mx-1">&middot;</span>
        <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          {getJurisdictionLabel(official.jurisdictionLevel)}
        </span>
      </p>

      {/* Contact links */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        {official.phone && (
          <a
            href={`tel:${official.phone}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {official.phone}
          </a>
        )}
        {official.email && (
          <a
            href={`mailto:${official.email}`}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </a>
        )}
        {official.website && (
          <a
            href={official.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Website
          </a>
        )}
      </div>

      {/* News toggle */}
      <button
        onClick={() => setShowNews(!showNews)}
        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium mb-3 text-left"
      >
        {showNews ? 'Hide News' : 'News'}
      </button>
      {showNews && <NewsPanel name={official.name} jurisdiction={official.jurisdiction} />}

      {/* Send message */}
      <div className="mt-auto pt-2">
        <Link
          href={`/contact?repId=${official.id}`}
          className="block w-full text-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Send a Message
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
      <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

interface Props {
  cachedLocalOfficials: LocalOfficial[] | null;
  hasAddress: boolean;
}

export function LocalOfficialsSection({ cachedLocalOfficials, hasAddress }: Props) {
  const [officials, setOfficials] = useState<LocalOfficial[] | null>(cachedLocalOfficials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for address changes from MyRepresentativesSection
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (profile?.local_officials) {
          setOfficials(profile.local_officials);
        } else {
          setOfficials(null);
        }
      })
      .catch(() => setError('Unable to load local officials.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener('local-officials-updated', handleRefresh);
    return () => window.removeEventListener('local-officials-updated', handleRefresh);
  }, [handleRefresh]);

  // Auto-fetch if address exists but no cached data
  useEffect(() => {
    if (hasAddress && !cachedLocalOfficials && !officials) {
      setLoading(true);
      fetch('/api/profile/representatives', { method: 'POST' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.localOfficials?.length) {
            setOfficials(data.localOfficials);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [hasAddress, cachedLocalOfficials, officials]);

  // No address — parent section handles the "Add Address" prompt
  if (!hasAddress) return null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (officials && officials.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {officials.map((official) => (
          <LocalOfficialCard key={official.id} official={official} />
        ))}
      </div>
    );
  }

  // Address exists but no data
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
      <p className="text-gray-600 dark:text-gray-400">
        Local official data isn&apos;t available for your area yet. Check your city or county website for local representatives.
      </p>
    </div>
  );
}
