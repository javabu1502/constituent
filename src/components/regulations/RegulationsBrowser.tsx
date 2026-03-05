'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useTurnstile } from '@/components/ui/Turnstile';

interface Regulation {
  id: string;
  title: string;
  abstract: string | null;
  agency: string;
  agencySlug: string;
  type: string;
  publishedDate: string;
  commentDeadline: string | null;
  commentUrl: string | null;
  federalRegisterUrl: string;
  docketId: string | null;
  isOpen: boolean;
  daysLeft: number | null;
}

type Mode = 'open' | 'recent' | 'executive_orders';

const POPULAR_AGENCIES = [
  { slug: 'environmental-protection-agency', name: 'EPA' },
  { slug: 'education-department', name: 'Education' },
  { slug: 'health-and-human-services-department', name: 'HHS' },
  { slug: 'labor-department', name: 'Labor' },
  { slug: 'federal-communications-commission', name: 'FCC' },
  { slug: 'homeland-security-department', name: 'DHS' },
  { slug: 'housing-and-urban-development-department', name: 'HUD' },
  { slug: 'treasury-department', name: 'Treasury' },
  { slug: 'agriculture-department', name: 'USDA' },
  { slug: 'securities-and-exchange-commission', name: 'SEC' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function DeadlineBadge({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft === null) return null;

  let color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  if (daysLeft <= 7) color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  else if (daysLeft <= 30) color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>
      {daysLeft === 0 ? 'Closes today' : daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
    </span>
  );
}

export function RegulationsBrowser() {
  const [mode, setMode] = useState<Mode>('open');
  const [agency, setAgency] = useState('');
  const [topic, setTopic] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [commentTarget, setCommentTarget] = useState<Regulation | null>(null);

  const fetchData = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ mode, page: String(pageNum) });
      if (agency) params.set('agency', agency);
      if (topic) params.set('topic', topic);

      const res = await fetch(`/api/regulations?${params}`);
      const data = await res.json();

      if (res.ok) {
        setRegulations(data.regulations);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
        setPage(pageNum);
      }
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [mode, agency, topic]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTopic(searchInput.trim());
  };

  const modes: { key: Mode; label: string; description: string }[] = [
    { key: 'open', label: 'Open for Comment', description: 'Proposed rules accepting public comments right now' },
    { key: 'recent', label: 'Recent Rules', description: 'Recently proposed and finalized federal rules' },
    { key: 'executive_orders', label: 'Executive Orders', description: 'Executive orders are directives from the President that carry the force of law without needing a vote in Congress. They cannot be publicly commented on, but you can contact your representatives if you want Congress to respond.' },
  ];

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              mode === m.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {modes.find((m) => m.key === mode)?.description}
      </p>

      {/* Search & Filters */}
      {mode !== 'executive_orders' && (
        <div className="space-y-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by keyword (e.g., clean water, student loans)..."
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Search
            </button>
          </form>

          {/* Agency chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setAgency(''); setPage(1); }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                !agency
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              All Agencies
            </button>
            {POPULAR_AGENCIES.map((a) => (
              <button
                key={a.slug}
                onClick={() => { setAgency(a.slug); setPage(1); }}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  agency === a.slug
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {totalCount} {mode === 'executive_orders' ? 'executive order' : 'regulation'}{totalCount !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && regulations.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No {mode === 'executive_orders' ? 'executive orders' : 'regulations'} found matching your criteria.
          </p>
        </div>
      )}

      {!loading && regulations.length > 0 && (
        <div className="space-y-3">
          {regulations.map((reg) => (
            <div
              key={reg.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      {reg.agency}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(reg.publishedDate)}
                    </span>
                    {reg.isOpen && <DeadlineBadge daysLeft={reg.daysLeft} />}
                  </div>

                  <a
                    href={reg.federalRegisterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 line-clamp-2 block"
                  >
                    {reg.title}
                  </a>

                  {reg.abstract && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {reg.abstract}
                    </p>
                  )}

                  {reg.commentDeadline && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Comment deadline: {formatDate(reg.commentDeadline)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {reg.isOpen && (
                    <button
                      onClick={() => setCommentTarget(reg)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors text-center"
                    >
                      Write Comment
                    </button>
                  )}
                  {reg.isOpen && reg.commentUrl && (
                    <a
                      href={reg.commentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-center whitespace-nowrap"
                    >
                      Submit Directly
                    </a>
                  )}
                  <Link
                    href={`/contact?issue=${encodeURIComponent(reg.title.slice(0, 80))}&issueCategory=Government Operations and Politics`}
                    className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-center whitespace-nowrap"
                  >
                    Contact Your Rep
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => fetchData(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchData(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Comment Writer Modal */}
      {commentTarget && (
        <CommentWriter
          regulation={commentTarget}
          onClose={() => setCommentTarget(null)}
        />
      )}

      {/* Attribution */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4 text-center">
        Data from the{' '}
        <a href="https://www.federalregister.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-600 dark:hover:text-purple-400">
          Federal Register
        </a>
        {' '}and{' '}
        <a href="https://www.regulations.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-600 dark:hover:text-purple-400">
          Regulations.gov
        </a>
      </p>
    </div>
  );
}

/* ── AI Comment Writer ──────────────────────────────────────────────── */

function CommentWriter({
  regulation,
  onClose,
}: {
  regulation: Regulation;
  onClose: () => void;
}) {
  const [position, setPosition] = useState<'support' | 'oppose' | 'concerns'>('concerns');
  const [personalStory, setPersonalStory] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [senderName, setSenderName] = useState('');
  const [generatedComment, setGeneratedComment] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { getToken, TurnstileWidget } = useTurnstile();

  const handleGenerate = async () => {
    if (!senderName.trim()) return;
    setGenerating(true);
    try {
      const turnstileToken = await getToken();
      const res = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regulationTitle: regulation.title,
          agency: regulation.agency,
          abstract: regulation.abstract,
          position,
          personalStory: personalStory.trim(),
          keyPoints: keyPoints.trim(),
          senderName: senderName.trim(),
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = await res.json();
      if (data.comment) {
        setGeneratedComment(data.comment);
      }
    } catch {
      // Silently handle
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedComment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Draft a Public Comment
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
              {regulation.agency}: {regulation.title}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!generatedComment ? (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Position
              </label>
              <div className="flex gap-2">
                {(['support', 'oppose', 'concerns'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosition(p)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      position === p
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {p === 'support' ? 'Support' : p === 'oppose' ? 'Oppose' : 'Concerns'}
                  </button>
                ))}
              </div>
            </div>

            {/* Key points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key Points <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="What specific aspects of this rule concern you? Any facts or arguments?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Personal story */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Personal Experience <span className="text-gray-400 font-normal">(optional but powerful)</span>
              </label>
              <textarea
                value={personalStory}
                onChange={(e) => setPersonalStory(e.target.value)}
                placeholder="How does this issue affect you personally? Agencies value real-world stories."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !senderName.trim()}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Drafting your comment...
                </>
              ) : (
                'Generate Comment with AI'
              )}
            </button>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              AI will draft a comment based on your inputs. Always review and edit before submitting.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* How it works */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1.5">How to submit your comment</p>
              <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>Review and edit your draft below</li>
                <li>Click &quot;Copy &amp; Open Regulations.gov&quot; to copy your comment and open the official form</li>
                <li>Paste your comment into the Regulations.gov form and submit it there</li>
              </ol>
              <p className="text-[10px] text-blue-600 dark:text-blue-500 mt-1.5">
                Federal law requires public comments be submitted through Regulations.gov. We cannot submit on your behalf, but we make it easy to get your comment ready.
              </p>
            </div>

            {/* Generated comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Draft Comment
              </label>
              <textarea
                value={generatedComment}
                onChange={(e) => setGeneratedComment(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex flex-col gap-2">
              {regulation.commentUrl && (
                <a
                  href={regulation.commentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedComment);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors text-sm text-center"
                >
                  {copied ? 'Copied! Opening Regulations.gov...' : 'Copy & Open Regulations.gov'}
                </a>
              )}
              <button
                onClick={handleCopy}
                className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors text-sm"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard Only'}
              </button>
            </div>

            <button
              onClick={() => setGeneratedComment('')}
              className="w-full text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
      <TurnstileWidget />
    </div>
  );
}
