import { describe, it, expect } from 'vitest';
import { buildTileGrid, centroidOf, type TileFeature } from '@/lib/tile-layout';
import nvAssembly from '@/data/districts/nv-assembly.json';
import nvSenate from '@/data/districts/nv-senate.json';

const square = (district: string, x: number, y: number): TileFeature => ({
  properties: { district },
  geometry: { type: 'Polygon', coordinates: [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]] },
});

describe('buildTileGrid', () => {
  it('gives every district exactly one cell, and no two share a cell', () => {
    for (const fc of [nvAssembly, nvSenate]) {
      const features = (fc as { features: TileFeature[] }).features;
      const grid = buildTileGrid(features);
      expect(grid.tiles).toHaveLength(features.length);
      const cells = new Set(grid.tiles.map((t) => `${t.col},${t.row}`));
      expect(cells.size).toBe(features.length);
      const districts = new Set(grid.tiles.map((t) => t.district));
      expect(districts.size).toBe(features.length);
    }
  });

  it('keeps every tile inside the reported grid', () => {
    const grid = buildTileGrid((nvAssembly as { features: TileFeature[] }).features);
    for (const t of grid.tiles) {
      expect(t.col).toBeGreaterThanOrEqual(0);
      expect(t.row).toBeGreaterThanOrEqual(0);
      expect(t.col).toBeLessThan(grid.cols);
      expect(t.row).toBeLessThan(grid.rows);
    }
  });

  it('preserves rough geography: north of a district stays north', () => {
    // A column of four, far apart, must come out in order top to bottom.
    const grid = buildTileGrid([square('1', 0, 0), square('2', 0, 10), square('3', 0, 20), square('4', 0, 30)]);
    const row = (d: string) => grid.tiles.find((t) => t.district === d)!.row;
    expect(row('4')).toBeLessThan(row('3'));
    expect(row('3')).toBeLessThan(row('2'));
    expect(row('2')).toBeLessThan(row('1'));
  });

  it('separates districts that overlap on a real map', () => {
    // The whole point: four tiny districts stacked in one place still get
    // four distinct cells, which is what a choropleth cannot do.
    const clustered = [square('1', 0, 0), square('2', 0.01, 0.01), square('3', 0.02, 0.0), square('4', 0.0, 0.02)];
    const grid = buildTileGrid(clustered);
    expect(new Set(grid.tiles.map((t) => `${t.col},${t.row}`)).size).toBe(4);
  });

  it('handles an empty input', () => {
    expect(buildTileGrid([])).toEqual({ tiles: [], cols: 0, rows: 0 });
  });

  it('centroid sits inside the bounding box', () => {
    const [x, y] = centroidOf(square('1', 2, 5));
    expect(x).toBeCloseTo(2.5);
    expect(y).toBeCloseTo(5.5);
  });
});
