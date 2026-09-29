import { describe, it, expect } from 'vitest';
import { findContainingFeature, pointInFeature, type GeoFeatureCollection } from '../geo/point-in-polygon';

const square = (x0: number, y0: number, x1: number, y1: number): [number, number][] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];

describe('point-in-polygon', () => {
  const fc: GeoFeatureCollection<{ district: string }> = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { district: 'Ward 1' }, geometry: { type: 'Polygon', coordinates: [square(0, 0, 10, 10)] } },
      { type: 'Feature', properties: { district: 'Ward 2' }, geometry: { type: 'Polygon', coordinates: [square(10, 0, 20, 10), square(14, 4, 16, 6)] } },
      { type: 'Feature', properties: { district: 'Ward 3' }, geometry: { type: 'MultiPolygon', coordinates: [[square(30, 30, 31, 31)], [square(40, 40, 41, 41)]] } },
    ],
  };
  it('finds the containing polygon', () => {
    expect(findContainingFeature(5, 5, fc)?.properties.district).toBe('Ward 1');
    expect(findContainingFeature(12, 2, fc)?.properties.district).toBe('Ward 2');
  });
  it('honors holes and multipolygons', () => {
    expect(findContainingFeature(15, 5, fc)).toBeNull();
    expect(findContainingFeature(40.5, 40.5, fc)?.properties.district).toBe('Ward 3');
  });
  it('returns null outside every feature', () => {
    expect(findContainingFeature(-1, -1, fc)).toBeNull();
    expect(pointInFeature(25, 25, fc.features[0])).toBe(false);
  });
});
