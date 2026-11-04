/**
 * Turn district polygons into an equal-tile grid ("cartogram") layout.
 *
 * A true map of legislative districts is close to unreadable, because the
 * districts are drawn by population rather than area. Nevada packs roughly
 * half its Assembly into Clark County, so on a geographic map those
 * districts are a few pixels wide while empty rural districts dominate the
 * frame. The districts a campaign most needs to see are the ones it cannot
 * click.
 *
 * A tile grid gives every district the same size and keeps its rough
 * position, so Las Vegas is as legible as Elko. Derived from the geometry
 * rather than hand-authored, so it works for any state whose boundaries are
 * built by scripts/build-district-boundaries.sh.
 */
export interface TileFeature {
  properties: { district: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
}

export interface Tile {
  district: string;
  col: number;
  row: number;
}

export interface TileGrid {
  tiles: Tile[];
  cols: number;
  rows: number;
}

function ringsOf(f: TileFeature): [number, number][][] {
  if (f.geometry.type === 'Polygon') return f.geometry.coordinates as [number, number][][];
  return (f.geometry.coordinates as number[][][][]).flatMap((p) => p as [number, number][][]);
}

/** Bounding-box centre. Cheaper than a true centroid and good enough to order tiles. */
export function centroidOf(f: TileFeature): [number, number] {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const ring of ringsOf(f)) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

/** Cells in rings of increasing distance from (col,row), nearest first. */
function* spiral(col: number, row: number, cols: number, rows: number): Generator<[number, number]> {
  const max = Math.max(cols, rows);
  for (let r = 0; r <= max; r++) {
    const seen = new Set<string>();
    for (let dc = -r; dc <= r; dc++) {
      for (let dr = -r; dr <= r; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== r) continue;
        const c = col + dc;
        const w = row + dr;
        if (c < 0 || w < 0 || c >= cols || w >= rows) continue;
        const k = `${c},${w}`;
        if (seen.has(k)) continue;
        seen.add(k);
        yield [c, w];
      }
    }
  }
}

/**
 * Place every district on a grid, keeping relative geography where it can.
 *
 * Each district wants the cell its centroid falls in. Contested cells go to
 * whoever asked first, and the loser takes the nearest free cell outward, so
 * a dense metro spreads into the space around it instead of overlapping.
 * Districts are placed densest-area-first (smallest polygons, i.e. the urban
 * ones) because they are the ones whose relative position is easiest to lose.
 */
export function buildTileGrid(features: TileFeature[]): TileGrid {
  const n = features.length;
  if (n === 0) return { tiles: [], cols: 0, rows: 0 };

  const pts = features.map((f) => ({ district: String(+f.properties.district), c: centroidOf(f) }));
  const xs = pts.map((p) => p.c[0]);
  const ys = pts.map((p) => p.c[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  // Longitude degrees are shorter than latitude degrees away from the
  // equator; without this a tall state comes out square.
  const kx = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
  const aspect = (spanX * kx) / spanY;
  // Leave slack so collisions have somewhere to go. Pure ceil(sqrt(n)) fills
  // the grid exactly and forces long displacement chains.
  const cols = Math.max(1, Math.round(Math.sqrt(n * aspect * 1.45)));
  let rows = Math.max(1, Math.ceil((n * 1.45) / cols));
  while (cols * rows < n) rows++;

  // Smallest first: urban districts are small and clustered, and they are the
  // ones that lose their relative position when they get bumped.
  const order = [...pts].sort((a, b) => {
    const ai = features.find((f) => String(+f.properties.district) === a.district)!;
    const bi = features.find((f) => String(+f.properties.district) === b.district)!;
    return bboxArea(ai) - bboxArea(bi);
  });

  const taken = new Set<string>();
  const tiles: Tile[] = [];
  for (const p of order) {
    const wantCol = Math.min(cols - 1, Math.floor(((p.c[0] - minX) / spanX) * cols));
    // Latitude grows north, rows grow down.
    const wantRow = Math.min(rows - 1, Math.floor(((maxY - p.c[1]) / spanY) * rows));
    for (const [c, r] of spiral(wantCol, wantRow, cols, rows)) {
      const k = `${c},${r}`;
      if (taken.has(k)) continue;
      taken.add(k);
      tiles.push({ district: p.district, col: c, row: r });
      break;
    }
  }

  // Trim empty edges so the grid is not floating in blank space.
  const usedCols = tiles.map((t) => t.col);
  const usedRows = tiles.map((t) => t.row);
  const c0 = Math.min(...usedCols), r0 = Math.min(...usedRows);
  const shifted = tiles.map((t) => ({ ...t, col: t.col - c0, row: t.row - r0 }));
  return {
    tiles: shifted.sort((a, b) => a.row - b.row || a.col - b.col),
    cols: Math.max(...shifted.map((t) => t.col)) + 1,
    rows: Math.max(...shifted.map((t) => t.row)) + 1,
  };
}

function bboxArea(f: TileFeature): number {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const ring of ringsOf(f)) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return (maxX - minX) * (maxY - minY);
}
