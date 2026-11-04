'use client';

import { useEffect, useState } from 'react';
import { DistrictHeatmap, type Boundaries, type DistrictCount } from './DistrictHeatmap';
import { DistrictCartogram } from './DistrictCartogram';
import nvSenate from '@/data/districts/nv-senate.json';
import nvAssembly from '@/data/districts/nv-assembly.json';

interface PlaceCount {
  place: string;
  count: number;
}

interface Summary {
  orgName: string | null;
  total: number;
  sources: { joined: number; acted: number; shared: number };
  mapped: number;
  unplaced: number;
  anonymousActions: number;
  anonymousStories: number;
  primaryState: string | null;
  cities: PlaceCount[];
  senate: DistrictCount[];
  assembly: DistrictCount[];
}

// Only Nevada's boundaries ship today. Another state's supporters still count
// and still list; they just have no shape to fill until its file is built
// (npm run build-districts <FIPS> <slug>).
const BOUNDARIES: Record<string, { senate: Boundaries; assembly: Boundaries; lowerLabel: string }> = {
  NV: { senate: nvSenate as Boundaries, assembly: nvAssembly as Boundaries, lowerLabel: 'Assembly' },
};

/**
 * `token` is set when the map is embedded on the org's own site, where there
 * is no owner session to authenticate against.
 */
export function SupporterMap({ slug, token }: { slug: string; token?: string }) {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chamber, setChamber] = useState<'senate' | 'assembly'>('assembly');
  // Tiles by default. On a real map of Nevada the Las Vegas districts are a
  // few pixels wide, which is where most supporters actually are.
  const [view, setView] = useState<'tiles' | 'map'>('tiles');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qs = token ? `?t=${encodeURIComponent(token)}` : '';
        const res = await fetch(`/api/org/${encodeURIComponent(slug)}/supporters${qs}`);
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) return setError(body.error || 'Could not load your supporters.');
        setData(body as Summary);
      } catch {
        if (!cancelled) setError('Could not load your supporters.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  if (error) {
    return (
      <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }
  if (!data) return <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;

  const anonymous = data.anonymousActions + data.anonymousStories;

  if (data.total === 0) {
    return (
      <div className="p-6 rounded-2xl border border-rule dark:border-gray-700 text-center">
        <p className="text-gray-700 dark:text-gray-300">No supporters yet.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Share your join link or embed the form, and this map fills in as people sign up.
        </p>
        {anonymous > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {anonymous} {anonymous === 1 ? 'person has' : 'people have'} acted or shared a story without leaving
            contact details, so they are not counted here.
          </p>
        )}
      </div>
    );
  }

  const geo = data.primaryState ? BOUNDARIES[data.primaryState] : undefined;
  const counts = chamber === 'senate' ? data.senate : data.assembly;
  const lowerLabel = geo?.lowerLabel ?? 'House';
  const label = chamber === 'senate' ? 'Senate' : lowerLabel;

  const parts = [
    data.sources.joined > 0 ? `${data.sources.joined} joined` : null,
    data.sources.acted > 0 ? `${data.sources.acted} took an action` : null,
    data.sources.shared > 0 ? `${data.sources.shared} shared a story` : null,
  ].filter(Boolean) as string[];

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">{data.total}</span> supporter{data.total === 1 ? '' : 's'}
          {parts.length > 0 && <span className="text-gray-500 dark:text-gray-400"> · {parts.join(' · ')}</span>}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {data.mapped} placed in a district
          {data.unplaced > 0 && <> · {data.unplaced} with no address on file</>}
          {anonymous > 0 && <> · {anonymous} anonymous, not counted above</>}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
          {(['assembly', 'senate'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChamber(c)}
              className={`px-3 py-1.5 ${chamber === c ? 'bg-purple-600 text-white' : 'bg-surface dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              {c === 'senate' ? 'Senate' : lowerLabel}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
          {(['tiles', 'map'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1.5 ${view === v ? 'bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-surface dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              {v === 'tiles' ? 'Tiles' : 'Map'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {data.mapped === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
              Nobody has a district yet. Only the join form asks for a street address, so supporters who arrived by
              taking an action or sharing a story are listed by city instead.
            </div>
          ) : geo ? (
            view === 'tiles' ? (
              <DistrictCartogram boundaries={chamber === 'senate' ? geo.senate : geo.assembly} counts={counts} chamberLabel={label} />
            ) : (
              <DistrictHeatmap boundaries={chamber === 'senate' ? geo.senate : geo.assembly} counts={counts} chamberLabel={label} />
            )
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
              District shapes for {data.primaryState ?? 'this state'} are not loaded yet, so the counts are listed
              instead of mapped.
            </div>
          )}
        </div>

        <div>
          {counts.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Strongest districts</h3>
              <ol className="space-y-1.5 mb-6">
                {counts.slice(0, 12).map((c) => (
                  <li key={c.district} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      <span className="font-medium">{label} {c.district}</span>
                      {c.legislatorName && <span className="text-gray-500 dark:text-gray-400"> · {c.legislatorName}</span>}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{c.count}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {data.cities.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">By city</h3>
              <ol className="space-y-1.5">
                {data.cities.slice(0, 12).map((c) => (
                  <li key={c.place} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate">{c.place}</span>
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{c.count}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {counts.length === 0 && data.cities.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No locations on file yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
