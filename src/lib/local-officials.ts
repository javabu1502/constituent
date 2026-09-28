import type { Official, JurisdictionLevel, LocalOfficial } from '@/lib/types';
import nv from '@/data/local/nv.json';

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
  seats: LocalSeat[];
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
}

/**
 * Every seat of every body that governs this address. Unincorporated areas
 * have no place, so only the county commission and school board apply. Seats
 * flagged `unverified` are returned without an email so they can never be
 * mailed on stale data.
 */
export function findLocalOfficials(stateCode: string, geo: LocalGeographies): LocalOfficial[] {
  const roster = localRosterFor(stateCode);
  if (!roster) return [];
  const wanted = new Set([geo.countyGeoid, geo.placeGeoid, geo.schoolDistrictGeoid].filter((g): g is string => !!g));
  if (wanted.size === 0) return [];

  const out: LocalOfficial[] = [];
  for (const body of roster.bodies) {
    if (!wanted.has(body.geoid)) continue;
    for (const seat of body.seats) {
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
