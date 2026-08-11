import { describe, it, expect, beforeEach } from 'vitest';
import { listCommittees, getCommittee, getCommitteeMembers, isCommitteeMember, clearCommitteesCache } from '../committees';

// These tests run against the vendored YAML so they keep passing across data
// refreshes: they assert structure and internal consistency, not specific
// members.

beforeEach(() => clearCommitteesCache());

describe('committees', () => {
  it('lists House and Senate committees with well-formed ids', () => {
    const house = listCommittees('house');
    const senate = listCommittees('senate');
    expect(house.length).toBeGreaterThan(10);
    expect(senate.length).toBeGreaterThan(10);
    for (const c of house) expect(c.id).toMatch(/^H[A-Z]{3}$/);
    for (const c of senate) expect(c.id).toMatch(/^S[A-Z]{3}$/);
    // Sorted by name for direct dropdown use.
    const names = house.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('exposes subcommittees keyed by parent id + sub id', () => {
    const withSubs = listCommittees().find((c) => c.subcommittees.length > 0);
    expect(withSubs).toBeDefined();
    for (const s of withSubs!.subcommittees) {
      expect(s.id.startsWith(withSubs!.id)).toBe(true);
      expect(s.id.length).toBeGreaterThan(4);
    }
  });

  it('returns members with bioguide ids for a real committee', () => {
    const senate = listCommittees('senate');
    const members = getCommitteeMembers(senate[0].id);
    expect(members.length).toBeGreaterThan(5);
    for (const m of members) expect(m.bioguide).toMatch(/^[A-Z]\d{6}$/);
  });

  it('isCommitteeMember matches actual membership and rejects outsiders', () => {
    const committee = listCommittees('house')[0];
    const members = getCommitteeMembers(committee.id);
    expect(isCommitteeMember(members[0].bioguide, committee.id)).toBe(true);
    expect(isCommitteeMember('X000000', committee.id)).toBe(false);
  });

  it('handles unknown ids without throwing', () => {
    expect(getCommittee('ZZZZ')).toBeNull();
    expect(getCommitteeMembers('ZZZZ')).toEqual([]);
    expect(isCommitteeMember('B001236', 'ZZZZ')).toBe(false);
  });
});
