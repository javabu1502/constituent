import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/openstates-api', () => ({ openstatesRestFetch: vi.fn() }));
vi.mock('@/lib/congress-api', () => ({ congressFetch: vi.fn() }));

import {
  chamberName,
  chamberShortName,
  isUnicameral,
  originChamber,
  billTrack,
  billTrackPosition,
} from '../legislative-process';
import { suggestNextStage } from '../bill-status';

describe('chamber names', () => {
  it('defaults the lower chamber to House of Representatives', () => {
    expect(chamberName('TX', 'lower')).toBe('House of Representatives');
    expect(chamberName('fl', 'lower')).toBe('House of Representatives');
  });

  it('knows the states that call it an Assembly', () => {
    for (const st of ['CA', 'NV', 'NY', 'WI']) {
      expect(chamberName(st, 'lower')).toBe('Assembly');
    }
  });

  it('knows New Jersey is a General Assembly', () => {
    expect(chamberName('NJ', 'lower')).toBe('General Assembly');
    // Short form still has to fit a progress bar.
    expect(chamberShortName('NJ', 'lower')).toBe('Assembly');
  });

  it('knows the three House of Delegates states', () => {
    for (const st of ['MD', 'VA', 'WV']) {
      expect(chamberName(st, 'lower')).toBe('House of Delegates');
      expect(chamberShortName(st, 'lower')).toBe('Delegates');
    }
  });

  it('calls every upper chamber the Senate', () => {
    expect(chamberName('NV', 'upper')).toBe('Senate');
    expect(chamberName('MD', 'upper')).toBe('Senate');
  });
});

describe('Nebraska is unicameral', () => {
  it('is the only one', () => {
    expect(isUnicameral('NE')).toBe(true);
    for (const st of ['CA', 'NV', 'TX', 'MD', 'NY']) {
      expect(isUnicameral(st)).toBe(false);
    }
  });

  it('names its single chamber the Legislature', () => {
    expect(chamberName('NE', 'lower')).toBe('Legislature');
    expect(chamberName('NE', 'upper')).toBe('Legislature');
  });

  it('has four stages, not five', () => {
    const t = billTrack('state', 'NE', 'LB');
    expect(t.stages).toEqual(['Introduced', 'Committee', 'Floor', 'Governor']);
    expect(t.stages).toHaveLength(4);
  });

  it('puts a signed Nebraska bill at the last stage', () => {
    const t = billTrack('state', 'NE', 'LB');
    const pos = billTrackPosition('Approved by Governor', null, 'state', 'NE', 'LB');
    expect(pos).toBe(t.stages.length - 1);
    expect(t.stages[pos]).toBe('Governor');
  });
});

describe('origin chamber comes from the bill number', () => {
  it('reads senate prefixes as upper', () => {
    for (const t of ['s', 'S', 'SB', 'sres', 'SJRes', 'sconres']) {
      expect(originChamber(t)).toBe('upper');
    }
  });

  it('reads house and assembly prefixes as lower', () => {
    for (const t of ['hr', 'HR', 'HB', 'h', 'hres', 'AB', 'A']) {
      expect(originChamber(t)).toBe('lower');
    }
  });

  it('falls back to lower when the type is missing', () => {
    expect(originChamber(null)).toBe('lower');
    expect(originChamber('')).toBe('lower');
  });
});

describe('billTrack orders chambers by where the bill started', () => {
  it('sends a House bill to the House first', () => {
    expect(billTrack('federal', null, 'hr').stages).toEqual([
      'Introduced', 'Committee', 'House', 'Senate', 'Signed',
    ]);
  });

  it('sends a Senate bill to the Senate first', () => {
    expect(billTrack('federal', null, 's').stages).toEqual([
      'Introduced', 'Committee', 'Senate', 'House', 'Signed',
    ]);
  });

  it('does the same for a state, with that stateial names', () => {
    expect(billTrack('state', 'NV', 'AB').stages).toEqual([
      'Introduced', 'Committee', 'Assembly', 'Senate', 'Governor',
    ]);
    expect(billTrack('state', 'NV', 'SB').stages).toEqual([
      'Introduced', 'Committee', 'Senate', 'Assembly', 'Governor',
    ]);
    expect(billTrack('state', 'MD', 'HB').stages).toEqual([
      'Introduced', 'Committee', 'Delegates', 'Senate', 'Governor',
    ]);
  });

  it('ends a state bill at the governor and a federal bill at signed', () => {
    expect(billTrack('state', 'TX', 'HB').stages.at(-1)).toBe('Governor');
    expect(billTrack('federal', null, 'hr').stages.at(-1)).toBe('Signed');
  });
});

describe('billTrackPosition', () => {
  it('puts an unmatched action at the start', () => {
    expect(billTrackPosition('Filed with the Clerk', null, 'federal', null, 'hr')).toBe(0);
    expect(billTrackPosition('', null, 'federal', null, 'hr')).toBe(0);
  });

  it('puts referral and report-out in committee', () => {
    expect(billTrackPosition('Referred to Committee on Education.', 'lower', 'federal', null, 'hr')).toBe(1);
    expect(billTrackPosition('From committee: Do pass.', 'lower', 'federal', null, 'hr')).toBe(1);
    expect(billTrackPosition('Placed on the Union Calendar, Calendar No. 290.', 'lower', 'federal', null, 'hr')).toBe(1);
  });

  it('puts a first-chamber pass at the origin chamber', () => {
    // H.R. passing the House is the bill's own chamber: stage 2 of 5.
    expect(billTrackPosition('Passed the House.', 'lower', 'federal', null, 'hr')).toBe(2);
    // S. passing the Senate is likewise its own chamber.
    expect(billTrackPosition('Passed Senate with amendments.', 'upper', 'federal', null, 's')).toBe(2);
  });

  it('puts a second-chamber pass past both chambers', () => {
    // H.R. passing the Senate means both are done.
    expect(billTrackPosition('Passed Senate with amendments.', 'upper', 'federal', null, 'hr')).toBe(3);
    // S. passing the House means both are done.
    expect(billTrackPosition('Passed the House.', 'lower', 'federal', null, 's')).toBe(3);
  });

  it('treats delivery to the executive as not yet signed', () => {
    const t = billTrack('state', 'NV', 'AB');
    const pos = billTrackPosition('Enrolled and delivered to Governor.', null, 'state', 'NV', 'AB');
    expect(pos).toBe(t.stages.length - 2);
    expect(t.stages[pos]).toBe('Senate');
  });

  it('treats enactment as the final stage', () => {
    const t = billTrack('state', 'NV', 'AB');
    const pos = billTrackPosition('Approved by the Governor. Chapter 212.', null, 'state', 'NV', 'AB');
    expect(pos).toBe(t.stages.length - 1);
    expect(t.stages[pos]).toBe('Governor');
  });

  it('never returns an index outside the track', () => {
    const cases: Array<[string, string | null, 'federal' | 'state', string | null, string]> = [
      ['Became Public Law No: 119-21.', null, 'federal', null, 'hr'],
      ['Approved by Governor', null, 'state', 'NE', 'LB'],
      ['Referred to Committee on Education.', 'lower', 'state', 'NV', 'AB'],
      ['Passed the Assembly. (28-14)', 'lower', 'state', 'NV', 'AB'],
      ['Some action nobody anticipated', null, 'state', 'MD', 'HB'],
    ];
    for (const [action, chamber, level, state, type] of cases) {
      const t = billTrack(level, state, type);
      const pos = billTrackPosition(action, chamber, level, state, type);
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThan(t.stages.length);
    }
  });
});

/**
 * The progress bar and the "next move" banner sit on the same screen and read
 * the same action text. If they ever disagree, the page contradicts itself.
 */
describe('agrees with suggestNextStage', () => {
  it('shows the bill at the end when the suggestion is to say thank you', () => {
    const action = 'Became Public Law No: 119-21.';
    expect(suggestNextStage(action, null).goal).toBe('thank_you');
    const t = billTrack('federal', null, 'hr');
    expect(billTrackPosition(action, null, 'federal', null, 'hr')).toBe(t.stages.length - 1);
  });

  it('shows the bill in committee when the suggestion is a committee push', () => {
    const action = 'Referred to Committee on Education.';
    expect(suggestNextStage(action, 'lower').goal).toBe('committee');
    expect(billTrackPosition(action, 'lower', 'federal', null, 'hr')).toBe(1);
  });

  it('shows one chamber cleared when the suggestion is the second chamber floor', () => {
    const action = 'Passed the Assembly. (28-14)';
    expect(suggestNextStage(action, 'lower').goal).toBe('floor_senate');
    // An Assembly bill that passed the Assembly: its own chamber is done.
    expect(billTrackPosition(action, 'lower', 'state', 'NV', 'AB')).toBe(2);
  });
});
