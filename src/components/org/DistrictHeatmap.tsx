'use client';

import { useMemo, useState } from 'react';

export interface PlaceCount {
  place: string;
  count: number;
}

export interface DistrictCount {
  district: string;
  count: number;
  legislatorName: string | null;
  legislatorParty: string | null;
  cities: PlaceCount[];
  sources: { joined: number; acted: number; shared: number };
}

type Ring = [number, number][];
interface Feature {
  properties: { district: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
}
export interface Boundaries {
  features: Feature[];
}

/**
 * A choropleth of supporter counts over state legislative districts, drawn
 * as inline SVG.
 *
 * No mapping library: the shapes are already simplified to ~20KB per chamber
 * (scripts/build-district-boundaries.sh) and all this needs is a projection
 * and a fill, which is less code than wiring a renderer would be.
 *
 * The projection is equirectangular with a cos(latitude) correction on x, so
 * Nevada does not come out stretched. A state-sized extent does not need
 * anything truer.
 */
function ringsOf(f: Feature): Ring[] {
  if (f.geometry.type === 'Polygon') return (f.geometry.coordinates as number[][][]).map((r) => r as Ring);
  return (f.geometry.coordinates as number[][][][]).flatMap((poly) => poly.map((r) => r as Ring));
}

const WIDTH = 520;
const HEIGHT = 620;
const PAD = 8;

export function DistrictHeatmap({
  boundaries,
  counts,
  chamberLabel,
  selected,
  onSelect,
}: {
  boundaries: Boundaries;
  counts: DistrictCount[];
  chamberLabel: string;
  /** District number the parent is showing a panel for. */
  selected?: string | null;
  onSelect?: (district: string | null) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const byDistrict = useMemo(() => {
    const m = new Map<string, DistrictCount>();
    for (const c of counts) m.set(String(+c.district), c);
    return m;
  }, [counts]);

  const max = useMemo(() => counts.reduce((n, c) => Math.max(n, c.count), 0), [counts]);

  const paths = useMemo(() => {
    const all = boundaries.features.flatMap((f) => ringsOf(f).flat());
    if (all.length === 0) return [];
    const lons = all.map((p) => p[0]);
    const lats = all.map((p) => p[1]);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    // Correct longitude for the latitude band so the state is not stretched.
    const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
    const kx = Math.cos(midLat);
    const w = (maxLon - minLon) * kx;
    const h = maxLat - minLat;
    const scale = Math.min((WIDTH - PAD * 2) / w, (HEIGHT - PAD * 2) / h);
    const offX = (WIDTH - w * scale) / 2;
    const offY = (HEIGHT - h * scale) / 2;
    const project = ([lon, lat]: [number, number]): [number, number] => [
      offX + (lon - minLon) * kx * scale,
      // SVG y grows downward; latitude grows upward.
      offY + (maxLat - lat) * scale,
    ];
    return boundaries.features.map((f) => {
      const d = ringsOf(f)
        .map((ring) => ring.map(project).map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z')
        .join(' ');
      return { district: String(+f.properties.district), d };
    });
  }, [boundaries]);

  // Fill ramp. Zero is a plain neutral rather than the lightest shade of the
  // ramp, so "nobody here" never reads as "a few people here".
  const fillFor = (count: number): string => {
    if (count <= 0) return 'var(--hm-empty)';
    const t = max <= 1 ? 1 : count / max;
    const stop = t > 0.8 ? 5 : t > 0.6 ? 4 : t > 0.4 ? 3 : t > 0.2 ? 2 : 1;
    return `var(--hm-${stop})`;
  };

  const active = hover ? byDistrict.get(hover) : null;

  return (
    <div
      className="w-full"
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
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto max-h-[620px] dark:[--hm-empty:rgb(51_65_85)]"
        role="img"
        aria-label={`${chamberLabel} districts shaded by number of supporters`}
      >
        {paths.map((p) => {
          const c = byDistrict.get(p.district);
          const n = c?.count ?? 0;
          const isSelected = selected === p.district;
          return (
            <path
              key={p.district}
              d={p.d}
              fill={fillFor(n)}
              stroke={isSelected || hover === p.district ? 'rgb(15 23 42)' : 'rgb(148 163 184)'}
              strokeWidth={isSelected ? 3 : hover === p.district ? 2 : 0.5}
              onMouseEnter={() => setHover(p.district)}
              onMouseLeave={() => setHover((h) => (h === p.district ? null : h))}
              onClick={() => onSelect?.(isSelected ? null : p.district)}
              className="cursor-pointer transition-[stroke-width]"
            >
              <title>{`${chamberLabel} District ${p.district}: ${n} supporter${n === 1 ? '' : 's'}${c?.legislatorName ? ` — ${c.legislatorName}` : ''}`}</title>
            </path>
          );
        })}
      </svg>

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
              : 'Click a district for its detail.'}
        </p>
      </div>
    </div>
  );
}
