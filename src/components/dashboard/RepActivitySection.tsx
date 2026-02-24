'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { RepFeedItem, RepFeedResponse, FeedBill, RepNewsArticle, RepSocialPost } from '@/lib/types';

type Tab = 'by-rep' | 'by-issue';
type SortMode = 'newest' | 'oldest' | 'federal' | 'state';
type RepSort = 'recent' | 'federal-first' | 'state-first';
type IssueSort = 'recent' | 'most-active';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  return formatDate(dateStr);
}

function getItemDate(item: RepFeedItem): string {
  return item.type === 'bill' ? item.date : item.pubDate;
}

function getItemRepId(item: RepFeedItem): string {
  return item.rep_id;
}

function getItemLevel(item: RepFeedItem): 'federal' | 'state' {
  return item.level;
}

// Chevron icon for collapsible sections
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function BillCard({ bill }: { bill: FeedBill }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">{bill.bill_number}</span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          bill.level === 'federal'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}>
          {bill.level === 'federal' ? 'Federal' : 'State'}
        </span>
        {bill.status && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            {bill.status}
          </span>
        )}
        {bill.policy_area && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
            {bill.policy_area}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">{bill.title}</p>
      {bill.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">{bill.description}</p>
      )}
      {bill.sponsors && bill.sponsors.length > 1 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span className="font-medium">Sponsors:</span> {bill.sponsors.join(', ')}
        </div>
      )}
      {bill.committee && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span className="font-medium">Committee:</span> {bill.committee}
        </div>
      )}
      {bill.last_action && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          <span className="font-medium">Last action</span>{bill.last_action_date ? ` (${formatDate(bill.last_action_date)})` : ''}: {bill.last_action}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{bill.sponsor_name} · {formatDate(bill.date)}</span>
        <div className="flex items-center gap-2 shrink-0">
          {bill.bill_url && (
            <a
              href={bill.bill_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium rounded-lg transition-colors"
            >
              View Bill
            </a>
          )}
          <Link
            href={`/contact?repId=${bill.rep_id}`}
            className="inline-block px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Write About This
          </Link>
        </div>
      </div>
    </div>
  );
}

function NewsCard({ article }: { article: RepNewsArticle }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">News</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{article.rep_name}</span>
      </div>
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-2 block mb-1"
      >
        {article.title}
      </a>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {article.source}{article.source && article.pubDate ? ' · ' : ''}{article.pubDate ? formatRelative(article.pubDate) : ''}
      </span>
    </div>
  );
}

function SocialCard({ post }: { post: RepSocialPost }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300">
          @{post.handle}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{post.rep_name}</span>
      </div>
      <a
        href={post.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-3 block mb-1"
      >
        {post.text}
      </a>
      <span className="text-xs text-gray-500 dark:text-gray-400">{post.pubDate ? formatRelative(post.pubDate) : ''}</span>
    </div>
  );
}

function FeedItemCard({ item }: { item: RepFeedItem }) {
  if (item.type === 'bill') return <BillCard bill={item} />;
  if (item.type === 'news') return <NewsCard article={item} />;
  if (item.type === 'social') return <SocialCard post={item} />;
  return null;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-14" />
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
    </div>
  );
}

function CollapsibleSection({ title, badge, children, defaultOpen = true }: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
          {badge && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{badge}</span>}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}

export function RepActivitySection() {
  const [items, setItems] = useState<RepFeedItem[]>([]);
  const [reps, setReps] = useState<RepFeedResponse['reps']>([]);
  const [userIssues, setUserIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('by-rep');
  const [globalSort, setGlobalSort] = useState<SortMode>('newest');
  const [repSort, setRepSort] = useState<RepSort>('recent');
  const [issueSort, setIssueSort] = useState<IssueSort>('recent');

  useEffect(() => {
    fetch('/api/feed/representatives')
      .then((res) => res.json())
      .then((data: RepFeedResponse) => {
        setItems(data.items ?? []);
        setReps(data.reps ?? []);
        setUserIssues(data.userIssues ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Apply global filters
  const filtered = useMemo(() => {
    let result = [...items];
    if (globalSort === 'federal') result = result.filter((i) => getItemLevel(i) === 'federal');
    if (globalSort === 'state') result = result.filter((i) => getItemLevel(i) === 'state');

    result.sort((a, b) => {
      const da = new Date(getItemDate(a)).getTime() || 0;
      const db = new Date(getItemDate(b)).getTime() || 0;
      return globalSort === 'oldest' ? da - db : db - da;
    });

    return result;
  }, [items, globalSort]);

  // Group by representative
  const byRep = useMemo(() => {
    const groups: Record<string, RepFeedItem[]> = {};
    for (const item of filtered) {
      const id = getItemRepId(item);
      if (!groups[id]) groups[id] = [];
      groups[id].push(item);
    }

    let sortedReps = [...reps];
    if (repSort === 'federal-first') sortedReps.sort((a, b) => (a.level === 'federal' ? -1 : 1) - (b.level === 'federal' ? -1 : 1));
    else if (repSort === 'state-first') sortedReps.sort((a, b) => (a.level === 'state' ? -1 : 1) - (b.level === 'state' ? -1 : 1));
    else {
      // Sort by most recent activity
      sortedReps.sort((a, b) => {
        const aDate = groups[a.id]?.[0] ? new Date(getItemDate(groups[a.id][0])).getTime() : 0;
        const bDate = groups[b.id]?.[0] ? new Date(getItemDate(groups[b.id][0])).getTime() : 0;
        return bDate - aDate;
      });
    }
    return { groups, sortedReps };
  }, [filtered, reps, repSort]);

  // Group by issue / policy area
  const byIssue = useMemo(() => {
    const groups: Record<string, RepFeedItem[]> = {};
    for (const item of filtered) {
      const area = item.type === 'bill' && item.policy_area ? item.policy_area : 'General';
      if (!groups[area]) groups[area] = [];
      groups[area].push(item);
    }

    let sortedAreas = Object.keys(groups);
    if (issueSort === 'most-active') sortedAreas.sort((a, b) => groups[b].length - groups[a].length);
    else sortedAreas.sort((a, b) => {
      const da = groups[a][0] ? new Date(getItemDate(groups[a][0])).getTime() : 0;
      const db = groups[b][0] ? new Date(getItemDate(groups[b][0])).getTime() : 0;
      return db - da;
    });

    // Split into user issues and discover
    const userAreas = sortedAreas.filter((a) => userIssues.some((ui) => a.toLowerCase().includes(ui.toLowerCase()) || ui.toLowerCase().includes(a.toLowerCase())));
    const discoverAreas = sortedAreas.filter((a) => !userAreas.includes(a));

    return { groups, userAreas, discoverAreas };
  }, [filtered, issueSort, userIssues]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No activity yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Add your address to see bills and news from your representatives.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => setTab('by-rep')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === 'by-rep' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            By Representative
          </button>
          <button
            onClick={() => setTab('by-issue')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === 'by-issue' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            By Issue
          </button>
        </div>

        {/* Global sort */}
        <select
          value={globalSort}
          onChange={(e) => setGlobalSort(e.target.value as SortMode)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="federal">Federal Only</option>
          <option value="state">State Only</option>
        </select>

        {/* Tab-specific sort */}
        {tab === 'by-rep' && (
          <select
            value={repSort}
            onChange={(e) => setRepSort(e.target.value as RepSort)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="recent">Most Recent Activity</option>
            <option value="federal-first">Federal First</option>
            <option value="state-first">State First</option>
          </select>
        )}
        {tab === 'by-issue' && (
          <select
            value={issueSort}
            onChange={(e) => setIssueSort(e.target.value as IssueSort)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="recent">Most Recent</option>
            <option value="most-active">Most Active</option>
          </select>
        )}
      </div>

      {/* By Representative tab */}
      {tab === 'by-rep' && (
        <div>
          {byRep.sortedReps.map((rep) => {
            const repItems = byRep.groups[rep.id] ?? [];
            if (repItems.length === 0 && globalSort !== 'newest') return null;
            const levelBadge = rep.level === 'federal'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';

            return (
              <CollapsibleSection
                key={rep.id}
                title={rep.name}
                badge={`${rep.level === 'federal' ? 'Federal' : 'State'} · ${repItems.length} items`}
                defaultOpen={false}
              >
                {rep.twitter && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-1">
                    <a href={`https://x.com/${rep.twitter}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">@{rep.twitter}</a>
                    {' · '}{rep.party}{' · '}{rep.title}
                  </div>
                )}
                {repItems.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 px-1">No recent activity</p>
                ) : (
                  repItems.map((item, i) => <FeedItemCard key={i} item={item} />)
                )}
              </CollapsibleSection>
            );
          })}
        </div>
      )}

      {/* By Issue tab */}
      {tab === 'by-issue' && (
        <div>
          {byIssue.userAreas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Issues You Care About</h3>
              {byIssue.userAreas.map((area) => (
                <CollapsibleSection
                  key={area}
                  title={area}
                  badge={`${byIssue.groups[area].length} items`}
                >
                  {byIssue.groups[area].map((item, i) => <FeedItemCard key={i} item={item} />)}
                </CollapsibleSection>
              ))}
            </div>
          )}
          {byIssue.discoverAreas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                {byIssue.userAreas.length > 0 ? 'Discover More Issues' : 'Active Issues'}
              </h3>
              {byIssue.discoverAreas.map((area) => (
                <CollapsibleSection
                  key={area}
                  title={area}
                  badge={`${byIssue.groups[area].length} items`}
                  defaultOpen={false}
                >
                  {byIssue.groups[area].map((item, i) => <FeedItemCard key={i} item={item} />)}
                </CollapsibleSection>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
