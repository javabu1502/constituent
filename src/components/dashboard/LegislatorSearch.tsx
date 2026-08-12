'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

/**
 * Org dashboard member search — type a lawmaker's name, jump straight to
 * their intel page. The roster is every legislator in the states the org
 * campaigns in.
 */
export function LegislatorSearch({
  roster,
}: {
  roster: { id: string; name: string; party: string | null; chamber: string | null; state: string }[];
}) {
  const [q, setQ] = useState('');

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    return roster.filter((r) => r.name.toLowerCase().includes(term)).slice(0, 8);
  }, [q, roster]);

  if (roster.length === 0) return null;

  return (
    <div className="relative mb-8">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Look up a legislator — intel, whip status, notes, constituent pressure…"
        className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
      />
      {matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          {matches.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/legislator?id=${encodeURIComponent(r.id)}`}
              className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                {[r.party ? r.party.charAt(0) : null, r.chamber === 'lower' || r.chamber === 'house' ? 'House' : r.chamber === 'upper' || r.chamber === 'senate' ? 'Senate' : null, r.state]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
