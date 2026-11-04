'use client';

import { useEffect, useState } from 'react';
import type { FeedBill } from '@/lib/types';

/**
 * Bills, votes and news for a state legislator.
 *
 * Loaded from the client on purpose. The identity half of the page comes from
 * local data and paints immediately; this comes from OpenStates and Google
 * News through /api/legislators/activity, which caches for twelve hours. A
 * cold page should never sit blank waiting on someone else's API, and a
 * legislator with nothing on file should not make the page look broken.
 */
interface Activity {
  bills?: FeedBill[];
  news?: { title: string; link: string; source: string }[];
}

export function StateLegislatorActivity({
  personId,
  stateCode,
  chamber,
  name,
  title,
}: {
  personId: string;
  stateCode: string;
  chamber: 'upper' | 'lower';
  name: string;
  title: string;
}) {
  const [data, setData] = useState<Activity | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({ personId, state: stateCode, chamber, name, title });
    (async () => {
      try {
        const res = await fetch(`/api/legislators/activity?${q}`);
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as Activity;
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [personId, stateCode, chamber, name, title]);

  if (failed) return null;

  if (!data) {
    return (
      <section>
        <h2 className="label mb-4 border-t border-gray-900 dark:border-gray-600 pt-6">Recent bills</h2>
        <div className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </section>
    );
  }

  const bills = (data.bills ?? []).slice(0, 8);
  const news = (data.news ?? []).slice(0, 4);
  if (bills.length === 0 && news.length === 0) return null;

  return (
    <>
      {bills.length > 0 && (
        <section>
          <h2 className="label mb-4 border-t border-gray-900 dark:border-gray-600 pt-6">
            Bills {name} has sponsored
          </h2>
          <ul className="divide-y divide-rule dark:divide-gray-700 border-y border-rule dark:border-gray-700">
            {bills.map((b) => (
              <li key={b.bill_number} className="py-3.5">
                <p className="label mb-1">{b.bill_number}</p>
                <p className="text-[15px] leading-snug text-gray-900 dark:text-gray-100">
                  {b.bill_url ? (
                    <a href={b.bill_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {b.title}
                    </a>
                  ) : (
                    b.title
                  )}
                </p>
                {b.last_action && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{b.last_action}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {news.length > 0 && (
        <section className="mt-12">
          <h2 className="label mb-4 border-t border-gray-900 dark:border-gray-600 pt-6">In the news</h2>
          <ul className="space-y-3">
            {news.map((n) => (
              <li key={n.link}>
                <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-[15px] leading-snug hover:underline">
                  {n.title}
                </a>
                {n.source && <span className="label ml-2">{n.source}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
