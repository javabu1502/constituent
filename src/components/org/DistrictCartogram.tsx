'use client';

import { useMemo, useState } from 'react';
import { buildTileGrid, type TileFeature } from '@/lib/tile-layout';
import type { DistrictCount } from './DistrictHeatmap';

/**
 * Supporter counts as an equal-tile grid rather than a map.
 *
 * On a true map of Nevada roughly half the Assembly sits inside Clark County
 * at a few pixels across, so the districts a campaign most needs to read are
 * the ones it cannot see or click, while empty rural districts take the eye.
 * Every tile here is the same size, so Las Vegas reads exactly as clearly as
 * Elko, and each one is big enough to carry its own number.
 *
 * Geography is approximate by design: tiles keep roughly their real relative
 * position, and the map view stays available for anyone who needs the real
 * shape.
 */
export function DistrictCartogram({
  boundaries,
  counts,
  chamberLabel,
}: {
  boundaries: { features: TileFeature[] };
  counts: DistrictCount[];
  chamberLabel: string;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const grid = useMemo(() => buildTileGrid(boundaries.features), [boundaries]);
  const byDistrict = useMemo(() => {
    const m = new Map<string, DistrictCount>();
    for (const c of counts) m.set(String(+c.district), c);
    return m;
  }, [counts]);
  const max = useMemo(() => counts.reduce((n, c) => Math.max(n, c.count), 0), [counts]);

  const step = (n: number): number => {
    if (n <= 0) return 0;
    const t = max <= 1 ? 1 : n / max;
    return t > 0.8 ? 5 : t > 0.6 ? 4 : t > 0.4 ? 3 : t > 0.2 ? 2 : 1;
  };

  const active = hover ? byDistrict.get(hover) : null;

  return (
    <div
      style={
        {
          '--hm-empty': 'rgb(241 245 249)',
          '--hm-1': 'rgb(233 213 255)',
          '--hm-2': 'rgb(216 180 254)',
          '--hm-3': 'rgb(192 132 252)',
          '--hm-4': 'rgb(147 51 234)',
          '--hm-5': 'rgb(107 33 168)',
        } as React.CSSProperties
      }
      className="dark:[--hm-empty:rgb(51_65_85)]"
    >
      <div
        role="img"
        aria-label={`${chamberLabel} districts as equal tiles, shaded by number of supporters`}
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: grid.cols * grid.rows }, (_, i) => {
          const col = i % grid.cols;
          const row = Math.floor(i / grid.cols);
          const tile = grid.tiles.find((t) => t.col === col && t.row === row);
          if (!tile) return <div key={i} aria-hidden="true" />;
          const c = byDistrict.get(tile.district);
          const n = c?.count ?? 0;
          const s = step(n);
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(tile.district)}
              onMouseLeave={() => setHover((h) => (h === tile.district ? null : h))}
              onFocus={() => setHover(tile.district)}
              onBlur={() => setHover((h) => (h === tile.district ? null : h))}
              title={`${chamberLabel} District ${tile.district}: ${n} supporter${n === 1 ? '' : 's'}${c?.legislatorName ? ` — ${c.legislatorName}` : ''}`}
              className={`aspect-square flex flex-col items-center justify-center rounded-sm border text-xs leading-none transition-colors ${
                hover === tile.district ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
              } ${s >= 4 ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}
              style={{ background: s === 0 ? 'var(--hm-empty)' : `var(--hm-${s})` }}
            >
              <span className="font-semibold tabular-nums">{tile.district}</span>
              {n > 0 && <span className="mt-0.5 text-[10px] opacity-80 tabular-nums">{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>0</span>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="w-6 h-3 rounded-sm" style={{ background: `var(--hm-${i})` }} />
          ))}
          <span>{max || 0}</span>
          <span className="ml-1">supporters</span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 min-h-[1.25rem]" aria-live="polite">
          {active
            ? `District ${active.district}: ${active.count} supporter${active.count === 1 ? '' : 's'}${active.legislatorName ? ` · ${active.legislatorName}` : ''}`
            : hover
              ? `District ${hover}: no supporters yet`
              : 'Each tile is one district. Hover for the count.'}
        </p>
      </div>
    </div>
  );
}
