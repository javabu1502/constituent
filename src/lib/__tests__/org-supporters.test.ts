import { describe, it, expect } from 'vitest';
import { collectSupporters, isCountableEmail } from '../org-supporters';

describe('isCountableEmail (a supporter needs an identifier that could be real)', () => {
  it('accepts an ordinary address', () => {
    expect(isCountableEmail('someone@gmail.com')).toBe(true);
    expect(isCountableEmail('Someone@ChildrensCabinet.org')).toBe(true);
  });
  it('rejects the reserved domains the seeded demo data uses', () => {
    expect(isCountableEmail('a@example.com')).toBe(false);
    expect(isCountableEmail('a@example.net')).toBe(false);
    expect(isCountableEmail('a@example.org')).toBe(false);
    expect(isCountableEmail('a@mail.example.com')).toBe(false);
    expect(isCountableEmail('a@thing.test')).toBe(false);
    expect(isCountableEmail('a@thing.invalid')).toBe(false);
    expect(isCountableEmail('a@localhost')).toBe(false);
  });
  it('does not reject a real domain that merely contains "test"', () => {
    expect(isCountableEmail('a@testvalley.org')).toBe(true);
    expect(isCountableEmail('a@example.coop')).toBe(true);
  });
  it('rejects missing or malformed addresses', () => {
    expect(isCountableEmail(null)).toBe(false);
    expect(isCountableEmail('')).toBe(false);
    expect(isCountableEmail('nobody')).toBe(false);
    expect(isCountableEmail('nobody@')).toBe(false);
  });
});

/**
 * A stand-in for the admin client: each table answers with fixed rows, so the
 * test is about the union rules rather than about PostgREST.
 */
function fakeAdmin(tables: Record<string, unknown[]>) {
  const make = (name: string) => {
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    builder.select = chain;
    builder.eq = chain;
    builder.in = chain;
    builder.is = chain;
    builder.then = (resolve: (v: { data: unknown[] }) => unknown) => resolve({ data: tables[name] ?? [] });
    return builder;
  };
  return { from: (name: string) => make(name) } as never;
}

const ORG = 'org-1';

describe('collectSupporters', () => {
  it('counts one person once across all three sources', async () => {
    const { supporters } = await collectSupporters(
      fakeAdmin({
        org_supporters: [
          { email: 'Ana@example.coop', name: 'Ana', city: 'Reno', state: 'nv', state_upper_district: '15', state_lower_district: '24', district_resolved: true },
        ],
        campaigns: [{ id: 'c1' }],
        campaign_actions: [{ participant_email: 'ana@example.coop', participant_name: 'Ana R', participant_city: 'Reno', participant_state: 'NV' }],
        stories: [{ storyteller_email: 'ANA@EXAMPLE.COOP', storyteller_name: 'Ana', city: 'Reno', state: 'NV', status: 'active', revoked_at: null }],
      }),
      ORG,
    );
    expect(supporters).toHaveLength(1);
    expect([...supporters[0].sources].sort()).toEqual(['acted', 'joined', 'shared']);
    expect(supporters[0].upperDistrict).toBe('15');
    expect(supporters[0].state).toBe('NV');
  });

  it('keeps distinct people apart and only the join form carries a district', async () => {
    const { supporters } = await collectSupporters(
      fakeAdmin({
        org_supporters: [
          { email: 'joined@gmail.com', name: 'J', city: 'Reno', state: 'NV', state_upper_district: '15', state_lower_district: '24', district_resolved: true },
        ],
        campaigns: [{ id: 'c1' }],
        campaign_actions: [{ participant_email: 'acted@gmail.com', participant_name: 'A', participant_city: 'Las Vegas', participant_state: 'NV' }],
        stories: [],
      }),
      ORG,
    );
    expect(supporters).toHaveLength(2);
    const acted = supporters.find((s) => s.email === 'acted@gmail.com')!;
    expect(acted.upperDistrict).toBeNull();
    expect(acted.lowerDistrict).toBeNull();
    expect(acted.city).toBe('Las Vegas');
  });

  it('does not place a district the geocoder never resolved', async () => {
    const { supporters } = await collectSupporters(
      fakeAdmin({
        org_supporters: [
          { email: 'a@gmail.com', name: 'A', city: 'Reno', state: 'NV', state_upper_district: '15', state_lower_district: '24', district_resolved: false },
        ],
        campaigns: [],
      }),
      ORG,
    );
    expect(supporters[0].upperDistrict).toBeNull();
  });

  it('drops seeded rows and reports emailless ones as anonymous', async () => {
    const { supporters, anonymousActions, anonymousStories } = await collectSupporters(
      fakeAdmin({
        org_supporters: [],
        campaigns: [{ id: 'c1' }],
        campaign_actions: [
          { participant_email: 'seed@example.com', participant_name: 'Seed', participant_city: 'Fresno', participant_state: 'CA' },
          { participant_email: null, participant_name: '', participant_city: '', participant_state: '' },
          { participant_email: 'real@gmail.com', participant_name: 'Real', participant_city: 'Reno', participant_state: 'NV' },
        ],
        stories: [
          { storyteller_email: null, storyteller_name: 'Teller', city: 'Las Vegas', state: 'NV', status: 'active', revoked_at: null },
        ],
      }),
      ORG,
    );
    expect(supporters.map((s) => s.email)).toEqual(['real@gmail.com']);
    expect(anonymousActions).toBe(1);
    expect(anonymousStories).toBe(1);
  });

  it('drops a storyteller who revoked, and one whose story is not active', async () => {
    const { supporters } = await collectSupporters(
      fakeAdmin({
        org_supporters: [],
        campaigns: [{ id: 'c1' }],
        campaign_actions: [],
        // A revoked row would be filtered by the query itself; a pending one
        // reaches us and has to be skipped here.
        stories: [
          { storyteller_email: 'pending@gmail.com', storyteller_name: 'P', city: 'Reno', state: 'NV', status: 'pending', revoked_at: null },
          { storyteller_email: 'live@gmail.com', storyteller_name: 'L', city: 'Reno', state: 'NV', status: 'active', revoked_at: null },
        ],
      }),
      ORG,
    );
    expect(supporters.map((s) => s.email)).toEqual(['live@gmail.com']);
  });

  it('prefers the richer record when sources disagree', async () => {
    const { supporters } = await collectSupporters(
      fakeAdmin({
        org_supporters: [],
        campaigns: [{ id: 'c1' }],
        campaign_actions: [{ participant_email: 'a@gmail.com', participant_name: null, participant_city: null, participant_state: null }],
        stories: [{ storyteller_email: 'a@gmail.com', storyteller_name: 'Ada', city: 'Reno', state: 'NV', status: 'active', revoked_at: null }],
      }),
      ORG,
    );
    expect(supporters[0].name).toBe('Ada');
    expect(supporters[0].city).toBe('Reno');
  });

  it('asks for no actions or stories when the org runs no campaigns', async () => {
    const { supporters, anonymousActions } = await collectSupporters(
      fakeAdmin({
        org_supporters: [{ email: 'a@gmail.com', name: 'A', city: 'Reno', state: 'NV', state_upper_district: null, state_lower_district: null, district_resolved: false }],
        campaigns: [],
        campaign_actions: [{ participant_email: 'leak@gmail.com', participant_name: 'X', participant_city: 'Y', participant_state: 'NV' }],
      }),
      ORG,
    );
    expect(supporters.map((s) => s.email)).toEqual(['a@gmail.com']);
    expect(anonymousActions).toBe(0);
  });
});
