'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { RepFeedItem, RepFeedResponse, FeedBill, RepNewsArticle, RepVote, IssueFeedItem, IssueFeedResponse, RepFinance, RepFinanceResponse, VotingRecordResponse } from '@/lib/types';
import { US_STATES } from '@/lib/constants';

type Tab = 'by-rep' | 'by-issue';
type RepSort = 'recent' | 'federal-first' | 'state-first';
type RepInnerTab = 'legislation' | 'votes' | 'news' | 'fundraising';
type PositionFilter = 'all' | 'Yea' | 'Nay' | 'Not Voting';
type TimePeriod = '30d' | '6mo' | '1yr' | 'all';

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
  if (item.type === 'bill') return item.date;
  if (item.type === 'news') return item.pubDate;
  if (item.type === 'vote') return item.date;
  return '';
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function WriteAboutButton({ repId, issue, ask }: { repId?: string; issue?: string; ask?: string }) {
  const params = new URLSearchParams();
  if (repId) params.set('repId', repId);
  if (issue) params.set('issue', issue);
  if (ask) params.set('ask', ask);
  return (
    <Link
      href={`/contact?${params.toString()}`}
      className="inline-block px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
    >
      Write About This
    </Link>
  );
}

function BillCard({ bill, showWriteAbout = true }: { bill: FeedBill; showWriteAbout?: boolean }) {
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
        {bill.sponsorship_type && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            bill.sponsorship_type === 'sponsored'
              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
              : 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300'
          }`}>
            {bill.sponsorship_type === 'sponsored' ? 'Sponsored' : 'Cosponsored'}
          </span>
        )}
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
          {showWriteAbout && (
            <WriteAboutButton repId={bill.rep_id} issue={bill.policy_area || bill.title} ask={`Regarding ${bill.bill_number}: ${bill.title}`} />
          )}
        </div>
      </div>
    </div>
  );
}

function VoteCard({ vote }: { vote: RepVote }) {
  const positionColor = (() => {
    switch (vote.rep_position) {
      case 'Yea': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Nay': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Not Voting': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      case 'Present': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return vote.rep_position ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : '';
    }
  })();

  const voteTally = (() => {
    const parts: string[] = [];
    if (vote.yea_count !== undefined) parts.push(`${vote.yea_count} Yea`);
    if (vote.nay_count !== undefined) parts.push(`${vote.nay_count} Nay`);
    if (vote.not_voting_count !== undefined && vote.not_voting_count > 0) parts.push(`${vote.not_voting_count} Not Voting`);
    if (vote.present_count !== undefined && vote.present_count > 0) parts.push(`${vote.present_count} Present`);
    return parts.length > 0 ? parts.join(' \u2013 ') : null;
  })();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {vote.roll_number && <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">Roll #{vote.roll_number}</span>}
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          {vote.chamber}
        </span>
        {vote.rep_position && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${positionColor}`}>
            {vote.rep_position}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">{vote.question}</p>
      {vote.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">{vote.description}</p>
      )}
      {vote.bill_number && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span className="font-medium">Bill:</span> {vote.bill_number}{vote.bill_title ? ` \u2014 ${vote.bill_title}` : ''}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
        <span>Result: <span className="font-medium">{vote.result || 'Pending'}</span></span>
        {voteTally && (
          <>
            <span>&middot;</span>
            <span>{voteTally}</span>
          </>
        )}
        <span>&middot;</span>
        <span>{formatDate(vote.date)}</span>
      </div>
      <div className="flex items-center justify-end gap-2">
        {vote.vote_url && (
          <a
            href={vote.vote_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium rounded-lg transition-colors"
          >
            View Vote
          </a>
        )}
        <WriteAboutButton repId={vote.rep_id} issue={vote.question} ask={`Regarding vote #${vote.roll_number}: ${vote.question}`} />
      </div>
    </div>
  );
}

function VotingRecordTab({ repId, repLevel, repState }: { repId: string; repLevel: 'federal' | 'state'; repState?: string }) {
  const [data, setData] = useState<VotingRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('all');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/feed/votes?repId=${encodeURIComponent(repId)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load voting record');
        return res.json();
      })
      .then((result: VotingRecordResponse) => {
        setData(result);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [repId]);

  const filteredVotes = useMemo(() => {
    if (!data) return [];
    let votes = data.votes;

    if (positionFilter !== 'all') {
      votes = votes.filter(v => v.rep_position === positionFilter);
    }

    const now = Date.now();
    if (timePeriod !== 'all') {
      const cutoff = timePeriod === '30d' ? 30 * 86400000
        : timePeriod === '6mo' ? 180 * 86400000
        : 365 * 86400000;
      votes = votes.filter(v => v.date && now - new Date(v.date).getTime() < cutoff);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      votes = votes.filter(v =>
        v.question.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        (v.bill_number && v.bill_number.toLowerCase().includes(q)) ||
        (v.bill_title && v.bill_title.toLowerCase().includes(q))
      );
    }

    return votes;
  }, [data, positionFilter, timePeriod, searchQuery]);

  useEffect(() => {
    setVisibleCount(20);
  }, [positionFilter, timePeriod, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-1" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 px-1">{error}</p>;
  }

  if (!data || data.votes.length === 0) {
    if (repLevel === 'state' && repState) {
      const stateName = US_STATES.find(s => s.code === repState)?.name ?? repState;
      return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Vote data is not currently available for {stateName} state legislators. Not all state legislatures publish roll call vote data through Open States or LegiScan.
          </p>
        </div>
      );
    }
    return <p className="text-sm text-gray-500 dark:text-gray-400 px-1">No voting record available for this representative.</p>;
  }

  const summary = data.summary;
  const visibleVotes = filteredVotes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVotes.length;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Voting Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_votes}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Votes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.yea_votes}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Yea ({summary.total_votes > 0 ? Math.round(summary.yea_votes / summary.total_votes * 100) : 0}%)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.nay_votes}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Nay ({summary.total_votes > 0 ? Math.round(summary.nay_votes / summary.total_votes * 100) : 0}%)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{summary.not_voting}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Missed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.participation_rate}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Participation</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
          {(['all', 'Yea', 'Nay', 'Not Voting'] as PositionFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setPositionFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                positionFilter === f
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="30d">Last 30 Days</option>
          <option value="6mo">Last 6 Months</option>
          <option value="1yr">Last Year</option>
          <option value="all">All Time</option>
        </select>

        <input
          type="text"
          placeholder="Search votes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing {Math.min(visibleCount, filteredVotes.length)} of {filteredVotes.length} votes
        {filteredVotes.length !== data.votes.length && ` (filtered from ${data.votes.length} total)`}
      </p>

      {/* Vote cards */}
      <div className="space-y-3">
        {visibleVotes.length > 0
          ? visibleVotes.map((vote, i) => <VoteCard key={`vote-${vote.roll_number}-${i}`} vote={vote} />)
          : <p className="text-sm text-gray-500 dark:text-gray-400 px-1">No votes match your filters.</p>
        }
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => prev + 20)}
          className="w-full py-2.5 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
        >
          Load More ({filteredVotes.length - visibleCount} remaining)
        </button>
      )}

      {/* Data source note */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {data.data_source === 'legiscan'
            ? <>Data provided by <a href="https://legiscan.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-gray-700 dark:hover:text-gray-300">LegiScan</a>. Coverage may vary by state legislature session.</>
            : repLevel === 'federal'
              ? 'Voting data from Congress.gov for the 119th Congress. Detailed vote tallies and positions are shown for recent votes where data is available.'
              : 'Voting data from Open States. Coverage may vary by state legislature session.'}
        </p>
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
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {article.source}{article.source && article.pubDate ? ' · ' : ''}{article.pubDate ? formatRelative(article.pubDate) : ''}
        </span>
        <WriteAboutButton repId={article.rep_id} issue={article.title} />
      </div>
    </div>
  );
}

function IssueFeedCard({ item }: { item: IssueFeedItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          item.type === 'issue-bill'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
        }`}>
          {item.type === 'issue-bill' ? 'Bill' : 'News'}
        </span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          item.level === 'federal'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}>
          {item.level === 'federal' ? 'Federal' : 'State'}
        </span>
        {item.bill_number && (
          <span className="font-bold text-purple-600 dark:text-purple-400 text-xs">{item.bill_number}</span>
        )}
        {item.related_rep_names && item.related_rep_names.length > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300">
            Your Rep: {item.related_rep_names.join(', ')}
          </span>
        )}
      </div>
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-2 block mb-1"
      >
        {item.title}
      </a>
      {item.status && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.status}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {item.source ? `${item.source} · ` : ''}{item.pubDate ? formatRelative(item.pubDate) : item.date ? formatDate(item.date) : ''}
        </span>
        <WriteAboutButton issue={item.policy_area} ask={item.type === 'issue-bill' ? `Regarding ${item.bill_number}: ${item.title}` : item.title} />
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function FundingTab({ finance, repId }: { finance: RepFinance | null; repId: string }) {
  if (!finance) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 px-1">No campaign finance data available for this representative.</p>;
  }

  const individualPct = finance.total_raised > 0 ? Math.round((finance.individual_contributions / finance.total_raised) * 100) : 0;
  const pacPct = finance.total_raised > 0 ? Math.round((finance.pac_contributions / finance.total_raised) * 100) : 0;
  const otherPct = Math.max(0, 100 - individualPct - pacPct);
  const cycleStart = finance.cycle - 1;
  const cycleLabel = `${cycleStart}\u2013${finance.cycle}`;
  const contributorCount = finance.top_contributors.length;

  return (
    <div className="space-y-4">
      {/* Data source header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          This data comes from filings submitted to the <strong>Federal Election Commission (FEC)</strong> for the <strong>{cycleLabel} election cycle</strong>. All federal candidates are required by law to disclose their campaign finances. Figures reflect the candidate&apos;s <strong>principal campaign committee</strong> only and may not include outside spending by PACs or Super PACs on their behalf.{' '}
          <a href={finance.fec_url} target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-600 dark:hover:text-blue-200">Verify on FEC.gov</a>
        </p>
      </div>

      {/* Totals overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Campaign Financial Summary
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Total receipts and expenditures reported to the FEC for the {cycleLabel} cycle.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">Total Receipts</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(finance.total_raised)}</p>
            <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-0.5">All money received</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">Total Disbursements</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{formatCurrency(finance.total_disbursements)}</p>
            <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-0.5">All money spent</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Cash on Hand</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(finance.cash_on_hand)}</p>
            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">End of reporting period</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Debt</p>
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{formatCurrency(finance.debt)}</p>
            <p className="text-[10px] text-yellow-600/70 dark:text-yellow-400/70 mt-0.5">Owed by committee</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <WriteAboutButton
            repId={repId}
            issue="Campaign Finance"
            ask={`I noticed your campaign has raised ${formatCurrency(finance.total_raised)} during the ${cycleLabel} election cycle and I wanted to discuss campaign finance transparency.`}
          />
        </div>
      </div>

      {/* Contribution breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Where the Money Comes From</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Breakdown of the {formatCurrency(finance.total_raised)} in total receipts by source type. &quot;Individual contributions&quot; are donations from private citizens. &quot;PAC contributions&quot; are from political action committees representing corporations, unions, or interest groups.
        </p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Individual Contributions</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(finance.individual_contributions)} ({individualPct}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${individualPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">PAC Contributions</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(finance.pac_contributions)} ({pacPct}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-orange-500 h-2.5 rounded-full transition-all" style={{ width: `${pacPct}%` }} />
            </div>
          </div>
          {otherPct > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Other Sources</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(finance.total_raised - finance.individual_contributions - finance.pac_contributions)} ({otherPct}%)</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-gray-400 h-2.5 rounded-full transition-all" style={{ width: `${otherPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Includes transfers from other committees, candidate self-funding, party contributions, and other receipts.</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <WriteAboutButton
            repId={repId}
            issue="Campaign Finance"
            ask={`I noticed that ${pacPct}% of your campaign funding comes from PAC contributions and wanted to share my perspective on the role of PAC money in politics.`}
          />
        </div>
      </div>

      {/* Top contributors */}
      {finance.top_contributors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Top {contributorCount} Contributors by Employer/Organization</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Individual donors grouped by their self-reported employer. This shows where donors work, not direct corporate contributions (which are illegal for federal candidates). Common entries like &quot;Not Employed,&quot; &quot;Retired,&quot; and &quot;Self-Employed&quot; reflect individual small-dollar donors.
          </p>
          <div className="max-h-[600px] overflow-y-auto">
            {finance.top_contributors.map((contributor, i) => {
              const pctOfTotal = finance.total_raised > 0 ? (contributor.total / finance.total_raised) * 100 : 0;
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-6 shrink-0 text-right">{i + 1}</span>
                    <span className="text-sm text-gray-900 dark:text-white truncate">{contributor.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(contributor.total)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                      {pctOfTotal >= 0.1 ? `${pctOfTotal < 1 ? pctOfTotal.toFixed(1) : Math.round(pctOfTotal)}%` : '<0.1%'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <WriteAboutButton
              repId={repId}
              issue="Campaign Finance"
              ask={`I noticed your campaign received significant contributions from employees of ${finance.top_contributors[0]?.name ?? 'various organizations'} and wanted to share my perspective on how this may relate to policy decisions.`}
            />
          </div>
        </div>
      )}

      {/* FEC Disclaimer */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          <strong className="text-gray-600 dark:text-gray-300">About this data:</strong> All figures are from reports filed with the Federal Election Commission (<a href="https://www.fec.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">fec.gov</a>) for the {cycleLabel} election cycle. Contributor data is grouped by self-reported employer name — it represents where individual donors work, not direct contributions from those organizations. Campaign contributions do not necessarily indicate influence over policy positions. Data may lag current filings by several weeks.
        </p>
      </div>
    </div>
  );
}

function RepInnerTabs({ repId, items, repLevel, repState, finance }: {
  repId: string;
  items: RepFeedItem[];
  repLevel: 'federal' | 'state';
  repState?: string;
  finance: RepFinance | null;
}) {
  const [innerTab, setInnerTab] = useState<RepInnerTab>('legislation');
  const isFederal = repLevel === 'federal';

  const billItems = useMemo(() => items.filter((i): i is FeedBill => i.type === 'bill'), [items]);
  const newsItems = useMemo(() => items.filter((i): i is RepNewsArticle => i.type === 'news'), [items]);

  const tabs: RepInnerTab[] = isFederal ? ['legislation', 'votes', 'news', 'fundraising'] : ['legislation', 'votes', 'news'];

  return (
    <div>
      <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5 mb-3">
        {tabs.map((t) => {
          const count = t === 'legislation' ? billItems.length
            : t === 'news' ? newsItems.length
            : undefined; // votes and fundraising load separately
          return (
            <button
              key={t}
              onClick={() => setInnerTab(t)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                innerTab === t
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} {count !== undefined && count > 0 && <span className="text-gray-400 dark:text-gray-500">({count})</span>}
            </button>
          );
        })}
      </div>

      {innerTab === 'legislation' && (
        <div className="space-y-3">
          {billItems.length > 0
            ? billItems.map((bill, i) => <BillCard key={`bill-${i}`} bill={bill} />)
            : <p className="text-sm text-gray-500 dark:text-gray-400 px-1">No recent legislation</p>
          }
        </div>
      )}

      {innerTab === 'votes' && (
        <VotingRecordTab repId={repId} repLevel={repLevel} repState={repState} />
      )}

      {innerTab === 'news' && (
        <div className="space-y-3">
          {newsItems.length > 0
            ? newsItems.map((article, i) => <NewsCard key={`news-${i}`} article={article} />)
            : <p className="text-sm text-gray-500 dark:text-gray-400 px-1">No recent news</p>
          }
        </div>
      )}

      {innerTab === 'fundraising' && isFederal && (
        <FundingTab finance={finance} repId={repId} />
      )}
    </div>
  );
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
  const [issueData, setIssueData] = useState<IssueFeedResponse | null>(null);
  const [financeData, setFinanceData] = useState<Record<string, RepFinance>>({});
  const [loading, setLoading] = useState(true);
  const [issueLoading, setIssueLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('by-rep');
  const [repSort, setRepSort] = useState<RepSort>('recent');

  // Fetch rep feed and issue feed in parallel
  useEffect(() => {
    const fetchRepFeed = fetch('/api/feed/representatives')
      .then((res) => res.json())
      .then((data: RepFeedResponse) => {
        setItems(data.items ?? []);
        setReps(data.reps ?? []);
        setUserIssues(data.userIssues ?? []);
      })
      .catch(() => {});

    const fetchIssueFeed = () => {
      setIssueLoading(true);
      return fetch('/api/feed/issues')
        .then((res) => res.json())
        .then((data: IssueFeedResponse) => {
          setIssueData(data);
        })
        .catch(() => {})
        .finally(() => setIssueLoading(false));
    };

    const fetchFinance = fetch('/api/feed/finance')
      .then((res) => res.json())
      .then((data: RepFinanceResponse) => {
        setFinanceData(data.finance ?? {});
      })
      .catch(() => {});

    Promise.all([fetchRepFeed, fetchIssueFeed(), fetchFinance])
      .finally(() => setLoading(false));
  }, []);

  // Group items by representative
  const byRep = useMemo(() => {
    const groups: Record<string, RepFeedItem[]> = {};
    for (const item of items) {
      const id = item.type === 'vote' ? item.rep_id : item.rep_id;
      if (!groups[id]) groups[id] = [];
      groups[id].push(item);
    }

    let sortedReps = [...reps];
    if (repSort === 'federal-first') sortedReps.sort((a, b) => (a.level === 'federal' ? -1 : 1) - (b.level === 'federal' ? -1 : 1));
    else if (repSort === 'state-first') sortedReps.sort((a, b) => (a.level === 'state' ? -1 : 1) - (b.level === 'state' ? -1 : 1));
    else {
      sortedReps.sort((a, b) => {
        const aDate = groups[a.id]?.[0] ? new Date(getItemDate(groups[a.id][0])).getTime() : 0;
        const bDate = groups[b.id]?.[0] ? new Date(getItemDate(groups[b.id][0])).getTime() : 0;
        return bDate - aDate;
      });
    }
    return { groups, sortedReps };
  }, [items, reps, repSort]);

  // Group issues
  const issueGroups = useMemo(() => {
    if (!issueData) return { userAreas: [], discoverAreas: [], groups: {} as Record<string, IssueFeedItem[]> };
    const groups = issueData.issues;
    const allAreas = Object.keys(groups);
    const uIssues = issueData.userIssues ?? userIssues;

    const userAreas = allAreas.filter((a) =>
      uIssues.some((ui) => a.toLowerCase().includes(ui.toLowerCase()) || ui.toLowerCase().includes(a.toLowerCase()))
    );
    const discoverAreas = allAreas.filter((a) => !userAreas.includes(a));

    return { groups, userAreas, discoverAreas };
  }, [issueData, userIssues]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (items.length === 0 && !issueData) {
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
      </div>

      {/* By Representative tab */}
      {tab === 'by-rep' && (
        <div>
          {byRep.sortedReps.map((rep, repIndex) => {
            const repItems = byRep.groups[rep.id] ?? [];

            return (
              <CollapsibleSection
                key={rep.id}
                title={rep.name}
                badge={`${rep.level === 'federal' ? 'Federal' : 'State'} · ${rep.party} · ${rep.title}`}
                defaultOpen={false}
              >
                <RepInnerTabs
                  repId={rep.id}
                  items={repItems}
                  repLevel={rep.level}
                  repState={rep.state}
                  finance={financeData[rep.id] ?? null}
                />
              </CollapsibleSection>
            );
          })}
        </div>
      )}

      {/* By Issue tab */}
      {tab === 'by-issue' && (
        <div>
          {issueLoading && (
            <div className="space-y-3 mb-4">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {!issueLoading && issueGroups.userAreas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Issues You Care About</h3>
              {issueGroups.userAreas.map((area) => (
                <CollapsibleSection
                  key={area}
                  title={area}
                  badge={`${issueGroups.groups[area]?.length ?? 0} items`}
                >
                  {(issueGroups.groups[area] ?? []).map((item, i) => <IssueFeedCard key={i} item={item} />)}
                </CollapsibleSection>
              ))}
            </div>
          )}
          {!issueLoading && issueGroups.discoverAreas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                {issueGroups.userAreas.length > 0 ? 'Discover More Issues' : 'Active Issues'}
              </h3>
              {issueGroups.discoverAreas.map((area) => (
                <CollapsibleSection
                  key={area}
                  title={area}
                  badge={`${issueGroups.groups[area]?.length ?? 0} items`}
                  defaultOpen={false}
                >
                  {(issueGroups.groups[area] ?? []).map((item, i) => <IssueFeedCard key={i} item={item} />)}
                </CollapsibleSection>
              ))}
            </div>
          )}
          {!issueLoading && issueGroups.userAreas.length === 0 && issueGroups.discoverAreas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No issue data available yet. Send messages to your representatives to see personalized issue tracking.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
