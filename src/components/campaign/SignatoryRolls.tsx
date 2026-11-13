'use client';

import { useEffect, useState } from 'react';

interface Office { office: string; state: string; district: string | null; signers: number; placed: boolean }

/**
 * The signatory rolls for a sign-on letter, one row per office.
 *
 * This is the deliverable. The letter goes to a staffer with the people from
 * that staffer's own district attached, because a list of four hundred names
 * from across the country gets discarded and forty-seven names with addresses
 * in the district does not.
 *
 * Signers whose address could not be placed get their own row rather than
 * being folded into a neighbouring district. The organization decides what to
 * do with them; guessing is what makes an office stop trusting the list.
 */
export function SignatoryRolls({ slug }: { slug: string }) {
  const [level, setLevel] = useState<'federal' | 'state_upper' | 'state_lower'>('federal');
  const [data, setData] = useState<{ total: number; offices: Office[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/api/campaigns/${slug}/signatures?level=${level}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => { if (!cancelled) setData(j); })
      .catch(() => { if (!cancelled) setError('Could not load the signatures.'); });
    return () => { cancelled = true; };
  }, [slug, level]);

  const tab = (value: typeof level, label: string) => (
    <button
      key={value}
      onClick={() => setLevel(value)}
      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
        level === value
          ? 'bg-purple-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="bg-surface dark:bg-gray-800 rounded-2xl border border-rule dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Signatures by office</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Send the letter to each office with its own signers attached. Each row downloads as a list you
        can paste under it, with the addresses that show they live there.
      </p>

      <div className="mt-4 flex gap-2">
        {tab('federal', 'US House')}
        {tab('state_upper', 'State Senate')}
        {tab('state_lower', 'State House')}
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!data && !error && <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading...</p>}

      {data && data.offices.length === 0 && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Nobody has signed yet.</p>
      )}

      {data && data.offices.length > 0 && (
        <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
          {data.offices.map((o) => (
            <div key={o.office} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <span className={`text-sm ${o.placed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {o.office}
                </span>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {o.signers} {o.signers === 1 ? 'signer' : 'signers'}
                </span>
              </div>
              <a
                href={`/api/campaigns/${slug}/signatures?level=${level}&format=csv&office=${encodeURIComponent(o.office)}`}
                className="shrink-0 text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Download
              </a>
            </div>
          ))}
          <p className="pt-3 text-sm text-gray-500 dark:text-gray-400">
            {data.total} {data.total === 1 ? 'signature' : 'signatures'} in total.
          </p>
        </div>
      )}
    </section>
  );
}
