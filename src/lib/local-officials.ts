import type { Official, JurisdictionLevel, LocalOfficial } from '@/lib/types';
import nv from '@/data/local/nv.json';
import { findContainingFeature, type GeoFeatureCollection } from '@/lib/geo/point-in-polygon';

/**
 * Local officials (county commissions, city councils, school boards) from the
 * hand-verified rosters in src/data/local. Resolution is by Census GEOID:
 * the geocoder gives county / incorporated place / unified school district,
 * and every seat of each matching body is returned (at-large v1).
 */
export type LocalBodyType = 'county' | 'city' | 'school_district';

export interface LocalSeat {
  name: string;
  title: string;
  district?: string | null;
  party?: string | null;
  email?: string | null;
  emailIsShared?: boolean;
  contactFormUrl?: string | null;
  phone?: string | null;
  website?: string | null;
  photoUrl?: string | null;
  termEnd?: string | number | null;
  sourceUrl?: string | null;
  verifiedAt?: string | null;
  unverified?: boolean;
}

export interface LocalBody {
  type: LocalBodyType;
  name: string;
  state: string;
  geoid: string;
  geoidVerified?: boolean;
  electionBasis?: string;
  website?: string | null;
  /** Key of a district boundary file in src/data/local/nv-boundaries. When
   *  present and the address has coordinates, only the seat for the matched
   *  district (plus at-large seats and the mayor) is returned. */
  boundaries?: BoundaryKey | null;
  seats: LocalSeat[];
}

export type BoundaryKey =
  | 'clark-commission' | 'ccsd-trustees' | 'las-vegas-wards' | 'henderson-wards' | 'north-las-vegas-wards'
  | 'washoe-commission' | 'wcsd-trustees' | 'reno-wards' | 'sparks-wards';

type BoundaryFc = GeoFeatureCollection<{ district: string }>;
// Static import map so the bundler can see every boundary file; each loads
// on first use and is cached for the life of the process.
const BOUNDARY_LOADERS: Record<BoundaryKey, () => Promise<{ default: unknown }>> = {
  'clark-commission': () => import('@/data/local/nv-boundaries/clark-commission.json'),
  'ccsd-trustees': () => import('@/data/local/nv-boundaries/ccsd-trustees.json'),
  'las-vegas-wards': () => import('@/data/local/nv-boundaries/las-vegas-wards.json'),
  'henderson-wards': () => import('@/data/local/nv-boundaries/henderson-wards.json'),
  'north-las-vegas-wards': () => import('@/data/local/nv-boundaries/north-las-vegas-wards.json'),
  'washoe-commission': () => import('@/data/local/nv-boundaries/washoe-commission.json'),
  'wcsd-trustees': () => import('@/data/local/nv-boundaries/wcsd-trustees.json'),
  'reno-wards': () => import('@/data/local/nv-boundaries/reno-wards.json'),
  'sparks-wards': () => import('@/data/local/nv-boundaries/sparks-wards.json'),
};
const boundaryCache = new Map<BoundaryKey, Promise<BoundaryFc>>();
export function loadBoundary(key: BoundaryKey): Promise<BoundaryFc> {
  let p = boundaryCache.get(key);
  if (!p) {
    p = BOUNDARY_LOADERS[key]().then((m) => m.default as BoundaryFc);
    boundaryCache.set(key, p);
  }
  return p;
}

/** "District A" / "district a" / "A" / "Ward I" / "Ward 1" → comparable token. */
export function normalizeDistrictLabel(label: string | null | undefined): string {
  const ROMAN: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8' };
  const t = (label ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const last = t.split(' ').pop() ?? '';
  return ROMAN[last] ?? last;
}

/** Seats every constituent of the body gets regardless of district. */
function isBodyWide(seat: LocalSeat): boolean {
  const d = (seat.district ?? '').toLowerCase();
  return !d || /at[- ]large|mayor|president|citywide|countywide/.test(d) || /mayor/i.test(seat.title);
}

/**
 * The district label for this point in the body's boundary file, or null
 * when the body has no boundaries, the point is missing, or it falls outside
 * every district (callers then keep every seat: at-large fallback).
 */
export async function resolveDistrict(body: LocalBody, geo: LocalGeographies): Promise<string | null> {
  if (!body.boundaries || geo.latitude == null || geo.longitude == null) return null;
  const fc = await loadBoundary(body.boundaries);
  if (!fc.features?.length) return null;
  const hit = findContainingFeature(geo.longitude, geo.latitude, fc);
  return hit?.properties?.district ?? null;
}

export interface LocalRoster {
  state: string;
  updatedAt: string;
  bodies: LocalBody[];
}

const ROSTERS: Record<string, LocalRoster> = { NV: nv as LocalRoster };

export function localRosterFor(stateCode: string): LocalRoster | null {
  return ROSTERS[stateCode.toUpperCase()] ?? null;
}

const LEVEL_FOR: Record<LocalBodyType, JurisdictionLevel> = {
  county: 'county',
  city: 'city',
  school_district: 'school_district',
};

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export interface LocalGeographies {
  countyGeoid?: string | null;
  placeGeoid?: string | null;
  schoolDistrictGeoid?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Every seat of every body that governs this address. Unincorporated areas
 * have no place, so only the county commission and school board apply. Seats
 * flagged `unverified` are returned without an email so they can never be
 * mailed on stale data.
 */
export async function findLocalOfficials(stateCode: string, geo: LocalGeographies): Promise<LocalOfficial[]> {
  const roster = localRosterFor(stateCode);
  if (!roster) return [];
  const wanted = new Set([geo.countyGeoid, geo.placeGeoid, geo.schoolDistrictGeoid].filter((g): g is string => !!g));
  if (wanted.size === 0) return [];

  const out: LocalOfficial[] = [];
  for (const body of roster.bodies) {
    if (!wanted.has(body.geoid)) continue;
    // District precision: with a boundary match, only that district's seat
    // plus body-wide seats (at-large, mayor). No match → every seat.
    const matched = await resolveDistrict(body, geo);
    const matchedKey = matched ? normalizeDistrictLabel(matched) : null;
    const seats = matchedKey
      ? body.seats.filter((s) => isBodyWide(s) || normalizeDistrictLabel(s.district) === matchedKey)
      : body.seats;
    for (const seat of seats) {
      const district = seat.district?.trim() || null;
      const officeName = district && !/^mayor$/i.test(district) && !new RegExp(district, 'i').test(seat.title)
        ? `${seat.title}, ${district}`
        : seat.title;
      const official: LocalOfficial = {
        id: `local:${body.geoid}:${slug(seat.name)}`,
        name: seat.name,
        lastName: seat.name.split(/\s+/).pop(),
        title: seat.title,
        level: 'local',
        party: seat.party?.trim() || 'Nonpartisan',
        state: roster.state,
        district: district ?? undefined,
        phone: seat.phone ?? undefined,
        email: seat.unverified ? undefined : seat.email ?? undefined,
        website: seat.website ?? body.website ?? undefined,
        contactForm: seat.contactFormUrl ?? undefined,
        photoUrl: seat.photoUrl ?? undefined,
        office: `${body.name}${district ? `, ${district}` : ''}`,
        termEnd: seat.termEnd != null ? String(seat.termEnd) : undefined,
        officeName,
        divisionId: `ocd-division/country:us/state:${roster.state.toLowerCase()}/${body.type}:${body.geoid}`,
        jurisdiction: body.name,
        jurisdictionLevel: LEVEL_FOR[body.type],
      };
      out.push(official);
    }
  }
  return out;
}

/** Plain Official view (what the contact flow consumes). */
export function toOfficial(o: LocalOfficial): Official {
  const rest: Partial<LocalOfficial> = { ...o };
  delete rest.officeName;
  delete rest.divisionId;
  delete rest.jurisdiction;
  delete rest.jurisdictionLevel;
  return rest as Official;
}
