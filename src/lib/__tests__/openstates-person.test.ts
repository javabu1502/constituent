import { describe, it, expect } from 'vitest';
import {
  mapOpenStatesBill,
  sponsorshipTypeFor,
  extractPersonVotes,
  deriveStatus,
  committeeFromReferral,
  type OpenStatesBill,
} from '../openstates-person';

const ME = { id: 'ocd-person/me', name: 'Alexis Hansen' };

// Shape taken from a live v3 response (NV, session 83) on 2026-09-30.
const bill: OpenStatesBill = {
  identifier: 'SB 224',
  title: 'Revises provisions relating to education. (BDR 34-72)',
  updated_at: '2025-10-22T03:43:50+00:00',
  latest_action_date: '2025-04-12T07:00:00+00:00',
  latest_action_description: 'Pursuant to Joint Standing Rule No. 14.3.1, no further action allowed.',
  openstates_url: 'https://openstates.org/nv/bills/83/SB224/',
  abstracts: [{ abstract: 'An act about schools.' }],
  actions: [
    { description: 'Read first time. Referred to Committee on Education. To printer.', date: '2025-02-19T08:00:00+00:00', classification: ['reading-1', 'referral-committee'] },
    { description: 'No further action allowed.', date: '2025-04-12T07:00:00+00:00', classification: [] },
  ],
  sponsorships: [
    { name: 'Carrie Ann Buck', primary: true, classification: 'sponsor', person: { id: 'ocd-person/buck', name: 'Carrie Buck' } },
    { name: 'Hansen', primary: false, classification: 'cosponsor', person: { id: ME.id, name: ME.name } },
  ],
  sources: [{ url: 'https://www.leg.state.nv.us/App/NELIS/REL/83rd2025/Bill/12303/Overview' }],
  votes: [
    {
      id: 'ocd-vote/1',
      identifier: '',
      motion_text: 'Senate (As Introduced)',
      start_date: '2025-04-01T07:00:00+00:00',
      result: 'pass',
      organization: { classification: 'upper' },
      counts: [{ option: 'yes', value: 20 }, { option: 'no', value: 1 }, { option: 'absent', value: 0 }],
      votes: [
        { option: 'yes', voter_name: 'Buck, Carrie', voter: { id: 'ocd-person/buck' } },
        { option: 'no', voter_name: 'Hansen, Alexis', voter: { id: ME.id } },
      ],
    },
    {
      id: 'ocd-vote/2',
      motion_text: 'Assembly floor',
      start_date: '2025-04-05T07:00:00+00:00',
      result: 'pass',
      organization: { classification: 'lower' },
      counts: [],
      votes: [{ option: 'yes', voter: { id: 'ocd-person/someone-else' } }],
    },
  ],
};

describe('sponsorshipTypeFor', () => {
  it('is sponsored only when the person has a primary sponsorship', () => {
    expect(sponsorshipTypeFor(bill, 'ocd-person/buck')).toBe('sponsored');
    expect(sponsorshipTypeFor(bill, ME.id)).toBe('cosponsored');
  });
  it('treats an unlisted person as cosponsor rather than throwing', () => {
    expect(sponsorshipTypeFor({ sponsorships: [] }, ME.id)).toBe('cosponsored');
  });
});

describe('mapOpenStatesBill', () => {
  const mapped = mapOpenStatesBill(bill, ME);
  it('maps identifiers, dates, and status from the REST shape', () => {
    expect(mapped.bill_number).toBe('SB 224');
    expect(mapped.level).toBe('state');
    expect(mapped.rep_id).toBe(ME.id);
    expect(mapped.sponsor_name).toBe(ME.name);
    expect(mapped.sponsorship_type).toBe('cosponsored');
    expect(mapped.date).toBe('2025-04-12T07:00:00+00:00');
    expect(mapped.last_action).toMatch(/no further action/);
    expect(mapped.status).toBe('In Committee');
    expect(mapped.committee).toBe('Committee on Education');
    expect(mapped.description).toBe('An act about schools.');
  });
  it('prefers the official source URL over the Open States page', () => {
    expect(mapped.bill_url).toMatch(/leg\.state\.nv\.us/);
    expect(mapOpenStatesBill({ ...bill, sources: [] }, ME).bill_url).toBe(bill.openstates_url);
  });
  it('lists sponsors by canonical person name', () => {
    expect(mapped.sponsors).toEqual(['Carrie Buck', 'Alexis Hansen']);
  });
  it('falls back to the last action when latest_action fields are missing', () => {
    const m = mapOpenStatesBill({ ...bill, latest_action_date: undefined, latest_action_description: undefined }, ME);
    expect(m.date).toBe('2025-04-12T07:00:00+00:00');
    expect(m.last_action).toBe('No further action allowed.');
  });
});

describe('extractPersonVotes', () => {
  it('returns only the vote events the person voted in, normalized', () => {
    const votes = extractPersonVotes([bill], ME, 'lower');
    expect(votes).toHaveLength(1);
    const v = votes[0];
    expect(v.rep_position).toBe('Nay');
    expect(v.chamber).toBe('Senate');
    expect(v.bill_number).toBe('SB 224');
    expect(v.yea_count).toBe(20);
    expect(v.nay_count).toBe(1);
    expect(v.level).toBe('state');
    expect(v.vote_url).toBe(bill.openstates_url);
  });
  it('dedupes the same vote event appearing on two bill records', () => {
    expect(extractPersonVotes([bill, bill], ME, 'lower')).toHaveLength(1);
  });
  it('is empty when votes were not included', () => {
    expect(extractPersonVotes([{ ...bill, votes: undefined }], ME, 'lower')).toEqual([]);
  });
});

describe('committeeFromReferral', () => {
  it('handles referral phrasing from several states', () => {
    expect(committeeFromReferral('Read first time. Referred to Committee on Education. To printer.')).toBe('Committee on Education');
    expect(committeeFromReferral('Referred to Ways and Means')).toBe('Ways and Means');
    expect(committeeFromReferral('Referred to the Committee on Judiciary; text available')).toBe('Committee on Judiciary');
    expect(committeeFromReferral('Introduced')).toBe('');
  });
});

describe('deriveStatus', () => {
  it('picks the furthest stage present', () => {
    expect(deriveStatus([['reading-1'], ['passage']])).toBe('Passed Chamber');
    expect(deriveStatus([])).toBe('');
  });
});
