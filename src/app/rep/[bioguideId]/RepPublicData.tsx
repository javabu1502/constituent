'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { RepVote, VotingSummary, RepFinance, LobbyingResponse } from '@/lib/types';

type Tab = 'votes' | 'funding' | 'lobbying';

interface VotesData {
  votes: RepVote[];
  summary: VotingSummary;
  total_available: number;
  data_source?: string;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function PositionBadge({ position }: { position: string }) {
  const colors: Record<string, string> = {
    Yea: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Nay: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'Not Voting': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    Present: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[position] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
      {position || 'Unknown'}
    </span>
  );
}

export default function RepPublicData({
  bioguideId,
  name,
}: {
  bioguideId: string;
  name: string;
}) {
  const [tab, setTab] = useState<Tab>('votes');
  const [votesData, setVotesData] = useState<VotesData | null>(null);
  const [financeData, setFinanceData] = useState<RepFinance | null>(null);
  const [lobbyingData, setLobbyingData] = useState<LobbyingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const lastName = name.split(' ').pop() || name;

  useEffect(() => {
    Promise.allSettled([
      fetch(`/api/rep/${bioguideId}/votes`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/rep/${bioguideId}/finance`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/rep/${bioguideId}/lobbying`).then((r) => (r.ok ? r.json() : null)),
    ]).then((results) => {
      if (results[0].status === 'fulfilled' && results[0].value) {
        setVotesData(results[0].value);
      }
      if (results[1].status === 'fulfilled' && results[1].value?.finance) {
        setFinanceData(results[1].value.finance);
      }
      if (results[2].status === 'fulfilled' && results[2].value) {
        setLobbyingData(results[2].value);
      }
      setLoading(false);
    });
  }, [bioguideId]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'votes', label: 'Votes' },
    { key: 'funding', label: 'Funding' },
    { key: 'lobbying', label: 'Lobbying' },
  ];

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
        Public Record
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Official voting history, campaign fundraising, and lobbying activity from public records.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              tab === t.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        {loading ? (
          <SkeletonBlock />
        ) : tab === 'votes' ? (
          votesData ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Roll call votes are how Congress officially records each member&apos;s position on legislation. Yea = voted yes, Nay = voted no. Participation rate shows how often this member voted (Congress average is ~96%).
              </p>
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Votes" value={votesData.summary.total_votes.toLocaleString()} />
                <StatCard label="Voted Yes" value={votesData.summary.yea_votes.toLocaleString()} />
                <StatCard label="Voted No" value={votesData.summary.nay_votes.toLocaleString()} />
                <StatCard label="Participation" value={`${votesData.summary.participation_rate}%`} />
              </div>

              {/* Recent votes */}
              {votesData.votes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Recent Votes
                  </h3>
                  {votesData.votes.map((v) => (
                    <div
                      key={`${v.chamber}-${v.roll_number}`}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {v.question}
                        </span>
                        <PositionBadge position={v.rep_position} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Roll #{v.roll_number}</span>
                        {v.date && <span>{new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        {v.result && <span>{v.result}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href={`/contact?repId=${bioguideId}&issue=${encodeURIComponent('voting record')}`}
                className="inline-block text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                Contact {lastName} about their voting record
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              Voting data not available yet.
            </p>
          )
        ) : tab === 'funding' ? (
          financeData ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Campaign finance data from the Federal Election Commission (FEC). &quot;Individual&quot; means donations from people. &quot;PAC&quot; (Political Action Committee) means donations from organizations like unions, corporations, or interest groups. &quot;Cash on Hand&quot; is money remaining in the campaign account.
              </p>
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Raised" value={formatMoney(financeData.total_raised)} />
                <StatCard label="From Individuals" value={formatMoney(financeData.individual_contributions)} />
                <StatCard label="From PACs" value={formatMoney(financeData.pac_contributions)} />
                <StatCard label="Cash on Hand" value={formatMoney(financeData.cash_on_hand)} />
              </div>

              {/* Top contributors */}
              {financeData.top_contributors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Top Contributors (by employer)
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                    These are individual donations grouped by where donors work. Corporations cannot donate directly to campaigns.
                  </p>
                  <div className="space-y-1">
                    {financeData.top_contributors.slice(0, 10).map((c, i) => (
                      <div
                        key={c.name}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white truncate">
                            {c.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 ml-2">
                          {formatMoney(c.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FEC link */}
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={financeData.fec_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                >
                  View on FEC.gov
                </a>
                <Link
                  href={`/contact?repId=${bioguideId}&issue=${encodeURIComponent('campaign finance')}`}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                >
                  Contact {lastName} about campaign finance
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              Campaign finance data not available yet.
            </p>
          )
        ) : tab === 'lobbying' ? (
          lobbyingData && (lobbyingData.issue_areas.length > 0 || lobbyingData.top_clients.length > 0) ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lobbying means hiring professionals to advocate to lawmakers on specific issues. Companies, unions, and nonprofits are required by law to report this activity. The data below shows which industries and organizations are actively lobbying on issues this member oversees.
              </p>
              {/* Top issue areas */}
              {lobbyingData.issue_areas.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Top Lobbying Issue Areas
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                    Dollar amounts are total fees paid to lobbying firms for each issue area.
                  </p>
                  <div className="space-y-1">
                    {lobbyingData.issue_areas.slice(0, 5).map((area) => {
                      const maxIncome = lobbyingData.issue_areas[0]?.total_income ?? 1;
                      return (
                        <div key={area.issue_code} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {area.issue_name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                              {formatMoney(area.total_income)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                              style={{ width: `${(area.total_income / maxIncome) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top clients */}
              {lobbyingData.top_clients.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Top Lobbying Clients
                  </h3>
                  <div className="space-y-1">
                    {lobbyingData.top_clients.slice(0, 5).map((client, i) => (
                      <div
                        key={client.name}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white truncate">
                            {client.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 ml-2">
                          {formatMoney(client.total_income)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lobbying connections */}
              {lobbyingData.lobbying_connections.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Donor-Lobbying Connections
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                    Organizations that both donated to this member&apos;s campaign and lobbied on issues they oversee. Overlap does not imply impropriety.
                  </p>
                  <div className="space-y-1">
                    {lobbyingData.lobbying_connections.slice(0, 5).map((conn) => (
                      <div
                        key={conn.organization}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {conn.organization}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Donated {formatMoney(conn.donated)} · Lobbied on: {conn.lobbied_issues.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/contact?repId=${bioguideId}&issue=${encodeURIComponent('lobbying')}`}
                className="inline-block text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                Contact {lastName} about lobbying
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              Lobbying data not available yet.
            </p>
          )
        ) : null}
      </div>
    </section>
  );
}
