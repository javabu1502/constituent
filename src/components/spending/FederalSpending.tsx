'use client';

import { useState, useEffect } from 'react';

interface SpendingData {
  totalObligations: number;
  awardCount: number;
  byCategory: { name: string; amount: number; count: number }[];
  topRecipients: { name: string; amount: number; count: number }[];
  topAgencies: { name: string; amount: number; count: number }[];
  fiscalYear: number;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function FederalSpending({ stateCode, stateName }: { stateCode: string; stateName: string }) {
  const [data, setData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/spending?state=${stateCode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [stateCode]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  if (!data || data.totalObligations === 0) return null;

  const maxAgencyAmount = data.topAgencies[0]?.amount || 1;

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatMoney(data.totalObligations)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            FY{data.fiscalYear} Federal Spending
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {data.awardCount > 0 ? data.awardCount.toLocaleString() : '-'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awards</div>
        </div>
      </div>

      {/* Top Agencies */}
      {data.topAgencies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Top Federal Agencies in {stateName}
          </h3>
          <div className="space-y-2">
            {data.topAgencies.slice(0, 7).map((agency) => (
              <div key={agency.name} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-900 dark:text-white truncate pr-2">
                    {agency.name}
                  </span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                    {formatMoney(agency.amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                    style={{ width: `${(agency.amount / maxAgencyAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Recipients */}
      {data.topRecipients.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Top Recipients in {stateName}
          </h3>
          <div className="space-y-1">
            {data.topRecipients.slice(0, 7).map((recipient, i) => (
              <div
                key={recipient.name}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {recipient.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 ml-2">
                  {formatMoney(recipient.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 text-center">
        Data from{' '}
        <a href={`https://www.usaspending.gov/search/?hash=&fy=${data.fiscalYear}&tab=spending&subaward=false&geo=state_territory&mapHash=US/${stateCode}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-600 dark:hover:text-purple-400">
          USAspending.gov
        </a>
      </p>
    </div>
  );
}
