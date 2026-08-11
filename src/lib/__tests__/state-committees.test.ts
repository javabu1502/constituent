import { describe, it, expect, beforeEach } from 'vitest';
import {
  listStateCommittees,
  getStateCommittee,
  getStateCommitteeMembers,
  isStateCommitteeMember,
  clearStateCommitteesCache,
} from '../state-committees';

// Structure/consistency assertions against the vendored data, so refreshes
// don't break the suite.

beforeEach(() => clearStateCommitteesCache());

describe('state-committees', () => {
  it('every state has committees with URL-safe ids and ocd-person members', () => {
    const states = ['NV', 'CA', 'TX', 'NY', 'DE', 'WY'];
    for (const st of states) {
      const committees = listStateCommittees(st);
      expect(committees.length, st).toBeGreaterThan(5);
      for (const c of committees.slice(0, 5)) {
        expect(c.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(['upper', 'lower', 'legislature']).toContain(c.chamber);
        expect(c.members.length).toBeGreaterThan(0);
        for (const m of c.members) expect(m).toMatch(/^ocd-person\//);
      }
    }
  });

  it('membership lookups round-trip', () => {
    const committee = listStateCommittees('NV')[0];
    const members = getStateCommitteeMembers('NV', committee.id);
    expect(members).toEqual(committee.members);
    expect(isStateCommitteeMember(members[0], 'NV', committee.id)).toBe(true);
    expect(isStateCommitteeMember('ocd-person/not-real', 'NV', committee.id)).toBe(false);
  });

  it('handles unknown states and ids without throwing', () => {
    expect(listStateCommittees('ZZ')).toEqual([]);
    expect(listStateCommittees('bogus')).toEqual([]);
    expect(getStateCommittee('NV', 'nope')).toBeNull();
    expect(getStateCommitteeMembers('NV', 'nope')).toEqual([]);
  });
});
