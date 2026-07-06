'use client';

import { useEffect, useState } from 'react';

interface Brief {
  bullets: string[];
  generatedAt: string;
}

/**
 * Today's 3-bullet nonpartisan civic brief. Renders nothing until the brief
 * loads, and nothing at all if one isn't available.
 */
export function NewsBrief() {
  const [brief, setBrief] = useState<Brief | null>(null);

  useEffect(() => {
    fetch('/api/news/brief')
      .then((res) => (res.ok ? res.json() : { brief: null }))
      .then((data) => setBrief(data.brief || null))
      .catch(() => {});
  }, []);

  if (!brief) return null;

  return (
    <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-purple-900 dark:text-purple-200">Today&rsquo;s Civic Brief</h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
          AI summary · nonpartisan
        </span>
      </div>
      <ul className="space-y-1.5">
        {brief.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-purple-950 dark:text-purple-100">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
