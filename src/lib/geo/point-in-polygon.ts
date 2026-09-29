/**
 * Point-in-polygon for GeoJSON Polygon / MultiPolygon (ray casting, WGS84
 * lon/lat). Holes are honored. No dependency: the local-district boundary
 * files are small and this runs once per address lookup.
 */
export type Position = [number, number]; // [lon, lat]
export type PolygonCoords = Position[][];
export type MultiPolygonCoords = PolygonCoords[];

export interface GeoFeature<P = Record<string, unknown>> {
  type: 'Feature';
  properties: P;
  geometry:
    | { type: 'Polygon'; coordinates: PolygonCoords }
    | { type: 'MultiPolygon'; coordinates: MultiPolygonCoords };
}

export interface GeoFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoFeature<P>[];
}

function inRing(lon: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function inPolygon(lon: number, lat: number, poly: PolygonCoords): boolean {
  if (poly.length === 0 || !inRing(lon, lat, poly[0])) return false;
  for (let h = 1; h < poly.length; h++) if (inRing(lon, lat, poly[h])) return false; // hole
  return true;
}

export function pointInFeature(lon: number, lat: number, f: GeoFeature): boolean {
  const g = f.geometry;
  if (g.type === 'Polygon') return inPolygon(lon, lat, g.coordinates);
  return g.coordinates.some((p) => inPolygon(lon, lat, p));
}

/** First feature containing the point, or null. */
export function findContainingFeature<P>(lon: number, lat: number, fc: GeoFeatureCollection<P>): GeoFeature<P> | null {
  for (const f of fc.features) if (pointInFeature(lon, lat, f as GeoFeature)) return f;
  return null;
}
