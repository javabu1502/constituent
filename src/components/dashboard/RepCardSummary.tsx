'use client';

import { useState, useEffect } from 'react';
import type { BioData } from './RepBioTab';

export function RepCardSummary({ repId, repLevel, repState }: {
  repId: string;
  repLevel: 'federal' | 'state' | 'local';
  repState?: string;
}) {
  const [bio, setBio] = useState<BioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ repId, level: repLevel });
    if (repState) params.set('state', repState);

    fetch(`/api/legislators/bio?${params.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then((data: BioData | null) => { if (data) setBio(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [repId, repLevel, repState]);

  if (loading) {
    return (
      <div className="animate-pulse mb-3">
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
          ))}
        </div>
      </div>
    );
  }

  if (!bio) return null;

  // Only show quick facts for federal reps
  const facts: string[] = [];
  if (bio.type === 'federal') {
    if (bio.yearsInOffice) facts.push(`${bio.yearsInOffice} yrs in office`);
    if (bio.firstElected) facts.push(`Since ${bio.firstElected}`);
    if (bio.totalTerms > 1) facts.push(`${bio.totalTerms} terms`);
  }

  if (facts.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex gap-2 flex-wrap">
        {facts.map((f) => (
          <span
            key={f}
            className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
