'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { LobbyingResponse } from '@/lib/types';

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function WriteAboutLobbyingButton({ repId, client, issue }: { repId: string; client: string; issue: string }) {
  const params = new URLSearchParams();
  params.set('repId', repId);
  params.set('issue', `Lobbying: ${issue}`);
  params.set('ask', `I'm concerned about lobbying from ${client} on ${issue} directed at your committee. I'd like to know your position on this issue and how lobbying activity influences your decision-making.`);
  return (
    <Link
      href={`/contact?${params.toString()}`}
      className="inline-block px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
    >
      Write About This
    </Link>
  );
}

function SkeletonBlock() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LobbyingTab({ repId, repName, chamber }: { repId: string; repName: string; chamber: string }) {
  const [data, setData] = useState<LobbyingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/lobbying?repId=${encodeURIComponent(repId)}&chamber=${encodeURIComponent(chamber)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load lobbying data');
        return res.json();
      })
      .then((result: LobbyingResponse) => setData(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [repId, chamber]);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 px-1">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 px-1">No lobbying data available.</p>;
  }

  const hasData = data.issue_areas.length > 0 || data.top_clients.length > 0 || data.recent_filings.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-4">
        {data.committees.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong className="text-gray-600 dark:text-gray-300">Committee Assignments:</strong>{' '}
              {data.committees.join(', ')}
            </p>
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 px-1">
          No lobbying filings found matching {repName}&apos;s committee areas for the most recent quarters ({data.quarters_covered.join(', ')}).
        </p>
        <AttributionFooter />
      </div>
    );
  }

  const firstName = repName.split(' ').pop() ?? repName;

  return (
    <div className="space-y-4">
      {/* Data source header */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          Lobbying activity on <strong>{firstName}&apos;s committee jurisdictions</strong> for {data.quarters_covered.join(' & ')}. The LDA tracks lobbying at the chamber level, not per-member &mdash; these filings target the {chamber === 'senate' ? 'Senate' : 'House'} on issues under committees {firstName} serves on.
        </p>
      </div>

      {/* Committee assignments */}
      {data.committees.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong className="text-gray-600 dark:text-gray-300">Committee Assignments:</strong>{' '}
            {data.committees.join(' · ')}
          </p>
        </div>
      )}

      {/* Top Industries */}
      {data.issue_areas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Top Industries Lobbying {firstName}&apos;s Policy Areas
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Lobbying spending by issue area directed at the {chamber === 'senate' ? 'Senate' : 'House'}, filtered to {firstName}&apos;s committee jurisdictions.
          </p>
          <div className="space-y-2">
            {data.issue_areas.slice(0, 10).map((area) => {
              const maxIncome = data.issue_areas[0]?.total_income || 1;
              const pct = Math.round((area.total_income / maxIncome) * 100);
              return (
                <div key={area.issue_code}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{area.issue_name}</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(area.total_income)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    <span>{area.filing_count} filing{area.filing_count !== 1 ? 's' : ''}</span>
                    <WriteAboutLobbyingButton repId={repId} client="various organizations" issue={area.issue_name} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Lobbying Clients */}
      {data.top_clients.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Top Lobbying Clients
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Organizations that hired lobbyists to advocate on issues under {firstName}&apos;s committees.
          </p>
          <div className="max-h-[500px] overflow-y-auto">
            {data.top_clients.slice(0, 15).map((client, i) => (
              <div key={i} className="py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-5 shrink-0 text-right">{i + 1}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{client.name}</span>
                    </div>
                    <div className="ml-7 mt-0.5 flex flex-wrap gap-1">
                      {client.issue_areas.slice(0, 3).map((issue) => (
                        <span key={issue} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {issue}
                        </span>
                      ))}
                      {client.issue_areas.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{client.issue_areas.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(client.total_income)}</span>
                    <p className="text-[10px] text-gray-400">{client.filing_count} filing{client.filing_count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="ml-7 mt-1.5">
                  <WriteAboutLobbyingButton repId={repId} client={client.name} issue={client.issue_areas[0] ?? 'policy issues'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Lobbying Firms */}
      {data.top_firms.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Top Lobbying Firms
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Registered lobbying firms filing on issues under {firstName}&apos;s committee jurisdictions.
          </p>
          <div className="max-h-[400px] overflow-y-auto">
            {data.top_firms.slice(0, 10).map((firm, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-5 shrink-0 text-right">{i + 1}</span>
                    <span className="text-sm text-gray-900 dark:text-white truncate">{firm.name}</span>
                  </div>
                  {firm.top_clients.length > 0 && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-7 mt-0.5 truncate">
                      Clients: {firm.top_clients.slice(0, 3).join(', ')}{firm.top_clients.length > 3 ? '...' : ''}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(firm.total_income)}</span>
                  <p className="text-[10px] text-gray-400">{firm.filing_count} filing{firm.filing_count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Lobbying Activity */}
      {data.recent_filings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Recent Lobbying Activity
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Top lobbying filings by income targeting {firstName}&apos;s committee areas.
          </p>
          <div className="space-y-3">
            {data.recent_filings.map((filing, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{filing.client_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">via {filing.registrant_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(filing.income)}</span>
                    <p className="text-[10px] text-gray-400">{filing.filing_period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {filing.issue_area}
                  </span>
                </div>
                {filing.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{filing.description}</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  {filing.filing_url && (
                    <a
                      href={filing.filing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      View Filing
                    </a>
                  )}
                  <WriteAboutLobbyingButton repId={repId} client={filing.client_name} issue={filing.issue_area} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lobbying Connections (donate + lobby) */}
      {data.lobbying_connections.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Lobbying Connections
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Organizations that both donated to {repName} AND lobbied on issues under their committees.
          </p>
          <div className="space-y-2">
            {data.lobbying_connections.map((conn, i) => (
              <div key={i} className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 border border-red-200 dark:border-red-800/30">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{conn.organization}</p>
                <div className="flex flex-wrap gap-3 text-xs mb-1.5">
                  <span className="text-blue-600 dark:text-blue-400">
                    Donated: {formatCurrency(conn.donated)}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Lobbied: {formatCurrency(conn.lobbying_income)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {conn.lobbied_issues.slice(0, 3).map((issue) => (
                    <span key={issue} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {issue}
                    </span>
                  ))}
                </div>
                <WriteAboutLobbyingButton repId={repId} client={conn.organization} issue={conn.lobbied_issues[0] ?? 'policy issues'} />
              </div>
            ))}
          </div>
          <div className="mt-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Overlapping contributions and lobbying activity do not necessarily indicate undue influence. Campaign contributions reflect individual donors grouped by employer; lobbying reflects the organization&apos;s registered advocacy activities.
            </p>
          </div>
        </div>
      )}

      {/* Attribution */}
      <AttributionFooter />
    </div>
  );
}

function AttributionFooter() {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        Source:{' '}
        <a href="https://lda.senate.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">
          Senate Office of Public Records
        </a>{' '}
        (lda.senate.gov). Senate Office of Public Records cannot vouch for data or analyses derived from these data after retrieval. Lobbying data reflects quarterly LD-2 filings. Income figures represent the total reported by each lobbying registrant for the filing period.
      </p>
    </div>
  );
}
