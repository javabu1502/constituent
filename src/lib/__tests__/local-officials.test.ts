import { describe, it, expect } from 'vitest';
import { findLocalOfficials, localRosterFor, toOfficial, normalizeDistrictLabel } from '../local-officials';
import { extractLocalGeographies } from '../geocode';

describe('extractLocalGeographies (Census layers → local GEOIDs)', () => {
  it('reads county, incorporated place, and unified school district', () => {
    const geo = extractLocalGeographies({
      'Counties': [{ GEOID: '32031', NAME: 'Washoe County', BASENAME: 'Washoe' }],
      'Incorporated Places': [{ GEOID: '3260600', NAME: 'Reno city' }],
      'Unified School Districts': [{ GEOID: '3200480', NAME: 'Washoe County School District' }],
      '120th Congressional Districts': [{ GEOID: '3202', CD120: '02' }],
    });
    expect(geo).toEqual({
      countyGeoid: '32031', countyName: 'Washoe County',
      placeGeoid: '3260600', placeName: 'Reno city',
      schoolDistrictGeoid: '3200480', schoolDistrictName: 'Washoe County School District',
    });
  });
  it('leaves the place empty for an unincorporated address', () => {
    const geo = extractLocalGeographies({ 'Counties': [{ GEOID: '32003', NAME: 'Clark County' }] });
    expect(geo.countyGeoid).toBe('32003');
    expect(geo.placeGeoid).toBeUndefined();
  });
});

describe('findLocalOfficials', () => {
  it('returns nothing for a state without a roster or an address without geographies', async () => {
    expect(await findLocalOfficials('CA', { countyGeoid: '06037' })).toEqual([]);
    expect(await findLocalOfficials('NV', {})).toEqual([]);
  });
  it('Nevada roster is well-formed: every body has a GEOID and every seat a name/title, and verified seats have a contact path', () => {
    const roster = localRosterFor('NV')!;
    expect(roster.state).toBe('NV');
    for (const body of roster.bodies) {
      expect(body.geoid, body.name).toMatch(/^\d{5}$|^\d{7}$/);
      expect(['county', 'city', 'school_district']).toContain(body.type);
      for (const seat of body.seats) {
        expect(seat.name, body.name).toBeTruthy();
        expect(seat.title, `${body.name} ${seat.name}`).toBeTruthy();
        if (!seat.unverified) {
          expect(!!(seat.email || seat.contactFormUrl || seat.website || body.website), `${body.name} ${seat.name} has no contact path`).toBe(true);
        }
        if (seat.email) expect(seat.email, `${body.name} ${seat.name}`).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
      }
    }
  });
  it('an unverified seat is listed but never carries an email', async () => {
    const roster = localRosterFor('NV')!;
    const body = roster.bodies.find((b) => b.seats.some((s) => s.unverified));
    if (!body) return; // nothing unverified in this roster
    const found = await findLocalOfficials('NV', { countyGeoid: body.geoid, placeGeoid: body.geoid, schoolDistrictGeoid: body.geoid });
    for (const o of found) if (o.name === body.seats.find((s) => s.unverified)!.name) expect(o.email).toBeUndefined();
  });
  it('resolves a Reno address to Washoe County, Reno, and WCSD bodies when present in the roster', async () => {
    const found = await findLocalOfficials('NV', { countyGeoid: '32031', placeGeoid: '3260600', schoolDistrictGeoid: '3200480' });
    const bodies = new Set(found.map((o) => o.jurisdiction));
    const roster = localRosterFor('NV')!;
    const expected = roster.bodies.filter((b) => ['32031', '3260600', '3200480'].includes(b.geoid)).map((b) => b.name);
    expect([...bodies].sort()).toEqual([...new Set(expected)].sort());
    for (const o of found) {
      expect(o.level).toBe('local');
      expect(o.id).toMatch(/^local:\d+:/);
      expect(toOfficial(o)).not.toHaveProperty('jurisdictionLevel');
    }
  });
});

describe('normalizeDistrictLabel', () => {
  it('compares labels the way bodies write them', () => {
    expect(normalizeDistrictLabel('District A')).toBe('a');
    expect(normalizeDistrictLabel('Ward 3')).toBe('3');
    expect(normalizeDistrictLabel('Ward III')).toBe('3');
    expect(normalizeDistrictLabel('At-Large District F')).toBe('f');
  });
});
