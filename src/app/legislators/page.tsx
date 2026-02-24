'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { US_STATES } from '@/lib/constants';
import { PARTY_COLORS, DEFAULT_PARTY_COLOR } from '@/lib/constants';
import type { Official, FeedBill, RepVote, RepNewsArticle, BillAction } from '@/lib/types';

type ActivityTab = 'legislation' | 'votes' | 'news';

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

function BillCard({ bill }: { bill: FeedBill }) {
  const [showActions, setShowActions] = useState(false);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">{bill.bill_number}</span>
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          State
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
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">{bill.title}</p>
      {bill.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">{bill.description}</p>
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
      {bill.actions && bill.actions.length > 1 && (
        <div className="mb-2">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
          >
            {showActions ? 'Hide' : 'Show'} action timeline ({bill.actions.length} actions)
          </button>
          {showActions && (
            <div className="mt-2 border-l-2 border-purple-200 dark:border-purple-800 pl-3 space-y-2">
              {bill.actions.map((action: BillAction, i: number) => (
                <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(action.date)}</span>
                  {' — '}
                  {action.description}
                </div>
              ))}
            </div>
          )}
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
          <WriteAboutButton repId={bill.rep_id} issue={bill.title} ask={`Regarding ${bill.bill_number}: ${bill.title}`} />
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
      default: return vote.rep_position ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : '';
    }
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
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <span>Result: <span className="font-medium">{vote.result || 'Pending'}</span></span>
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

function LegislatorActivity({ personId, state, chamber, name, title }: { personId: string; state: string; chamber: string; name: string; title: string }) {
  const [data, setData] = useState<{ bills: FeedBill[]; votes: RepVote[]; news: RepNewsArticle[]; vote_data_source?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActivityTab>('legislation');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ personId, state, chamber, name, title });
    fetch(`/api/legislators/activity?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load activity');
        return res.json();
      })
      .then((result) => setData(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [personId, state, chamber, name, title]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 p-4">{error}</p>;
  }

  if (!data) return null;

  const billCount = data.bills.length;
  const voteCount = data.votes.length;
  const newsCount = data.news.length;

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5 mb-3">
        {(['legislation', 'votes', 'news'] as ActivityTab[]).map((t) => {
          const count = t === 'legislation' ? billCount : t === 'votes' ? voteCount : newsCount;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === t
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} {count > 0 && <span className="text-gray-400 dark:text-gray-500">({count})</span>}
            </button>
          );
        })}
      </div>

      {activeTab === 'legislation' && (
        <div className="space-y-3">
          {billCount > 0
            ? data.bills.map((bill, i) => <BillCard key={`bill-${i}`} bill={bill} />)
            : <p className="text-sm text-gray-500 dark:text-gray-400">No recent legislation</p>
          }
        </div>
      )}

      {activeTab === 'votes' && (
        <div className="space-y-3">
          {voteCount > 0
            ? (
              <>
                {data.votes.map((vote, i) => <VoteCard key={`vote-${i}`} vote={vote} />)}
                {data.vote_data_source === 'legiscan' && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Data provided by <a href="https://legiscan.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-gray-700 dark:hover:text-gray-300">LegiScan</a>. Coverage may vary by state legislature session.
                    </p>
                  </div>
                )}
                {data.vote_data_source === 'openstates' && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Voting data from Open States. Coverage may vary by state legislature session.
                    </p>
                  </div>
                )}
              </>
            )
            : (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vote data is not currently available for {US_STATES.find(s => s.code === state)?.name ?? state} state legislators. Not all state legislatures publish roll call vote data through Open States or LegiScan.
                </p>
              </div>
            )
          }
        </div>
      )}

      {activeTab === 'news' && (
        <div className="space-y-3">
          {newsCount > 0
            ? data.news.map((article, i) => <NewsCard key={`news-${i}`} article={article} />)
            : <p className="text-sm text-gray-500 dark:text-gray-400">No recent news</p>
          }
        </div>
      )}
    </div>
  );
}

function LegislatorCard({ legislator, state }: { legislator: Official; state: string }) {
  const [expanded, setExpanded] = useState(false);
  const partyColor = PARTY_COLORS[legislator.party] ?? DEFAULT_PARTY_COLOR;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        {legislator.photoUrl ? (
          <img
            src={legislator.photoUrl}
            alt={legislator.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0 ${legislator.photoUrl ? 'hidden' : ''}`}>
          <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            {legislator.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{legislator.name}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${partyColor.bg} ${partyColor.text}`}>
              {legislator.party}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{legislator.title}</p>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <LegislatorActivity
          personId={legislator.id}
          state={state}
          chamber={legislator.chamber}
          name={legislator.name}
          title={legislator.title}
        />
      )}
    </div>
  );
}

function LegislatorsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedState, setSelectedState] = useState(searchParams.get('state')?.toUpperCase() ?? '');
  const [legislators, setLegislators] = useState<Official[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedState) {
      setLegislators([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/legislators?state=${selectedState}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load legislators');
        return res.json();
      })
      .then((data) => setLegislators(data.legislators ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedState]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const url = state ? `/legislators?state=${state}` : '/legislators';
    router.push(url, { scroll: false });
  };

  const grouped = useMemo(() => {
    const upper = legislators.filter((l) => l.chamber === 'upper');
    const lower = legislators.filter((l) => l.chamber === 'lower');
    return { upper, lower };
  }, [legislators]);

  const stateName = US_STATES.find((s) => s.code === selectedState)?.name ?? '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">State Legislators</h1>
        <p className="text-gray-600 dark:text-gray-400">Browse state legislators and view their recent activity, including bills, votes, and news.</p>
      </div>

      {/* State selector */}
      <div className="mb-6">
        <label htmlFor="state-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select a State
        </label>
        <select
          id="state-select"
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          className="w-full sm:w-64 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="">Choose a state...</option>
          {US_STATES.filter((s) => s.code !== 'DC').map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-1" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && selectedState && legislators.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No legislator data available for {stateName}. Run <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">npm run refresh-states</code> to download state legislator data.
          </p>
        </div>
      )}

      {!loading && legislators.length > 0 && (
        <div>
          {grouped.upper.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                State Senate <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({grouped.upper.length})</span>
              </h2>
              <div className="space-y-2">
                {grouped.upper.map((leg) => (
                  <LegislatorCard key={leg.id} legislator={leg} state={selectedState} />
                ))}
              </div>
            </div>
          )}

          {grouped.lower.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                State House <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({grouped.lower.length})</span>
              </h2>
              <div className="space-y-2">
                {grouped.lower.map((leg) => (
                  <LegislatorCard key={leg.id} legislator={leg} state={selectedState} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedState && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a State</h3>
          <p className="text-gray-600 dark:text-gray-400">Choose a state from the dropdown above to browse its legislators.</p>
        </div>
      )}
    </div>
  );
}

export default function LegislatorsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-6 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
      </div>
    }>
      <LegislatorsContent />
    </Suspense>
  );
}
