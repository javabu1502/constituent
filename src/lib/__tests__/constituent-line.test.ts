import { describe, it, expect } from 'vitest';
import { buildEnvelope, constituentLine } from '@/lib/envelope';
import type { Official } from '@/lib/types';

const official = (over: Partial<Official> = {}): Official => ({
  id: 'x1',
  name: 'Erica Roth',
  lastName: 'Roth',
  title: 'Assemblymember, District 24',
  level: 'state',
  chamber: 'lower',
  party: 'Democratic',
  state: 'NV',
  district: '24',
  ...over,
});

describe('constituent line', () => {
  it('names the chamber the state actually has', () => {
    expect(constituentLine(official(), 'Reno', 'NV')).toBe('I am a constituent in Assembly District 24.');
    expect(constituentLine(official({ chamber: 'upper', district: '13' }), 'Reno', 'NV')).toBe(
      'I am a constituent in Senate District 13.',
    );
    expect(constituentLine(official({ state: 'VA', district: '78' }), 'Richmond', 'VA')).toBe(
      'I am a constituent in House of Delegates District 78.',
    );
  });

  it('falls back to the city when no district is on file', () => {
    expect(constituentLine(official({ district: undefined }), 'Reno', 'NV')).toBe('I am a constituent in Reno, NV.');
  });

  it('stays off federal and local mail', () => {
    // Federal goes through CWC, which verifies the address against the seat.
    expect(constituentLine(official({ level: 'federal' }), 'Reno', 'NV')).toBeNull();
    expect(constituentLine(official({ level: 'local' }), 'Reno', 'NV')).toBeNull();
  });
});

describe('every state legislature email says it', () => {
  const envelope = (o: Official) =>
    buildEnvelope('The core of my letter about child care.', o, {
      committeeName: null,
      verb: 'support',
      billRef: null,
      stageGoal: null,
      headline: 'Make Hidden Foster Care Visible',
      senderName: 'Jane Doe',
      city: 'Reno',
      stateCode: 'NV',
      zip: '89501',
      coreOpening: 'Child care in my neighborhood has become impossible to afford.',
      coreAsk: 'Please fund the state child care assistance program.',
    });

  it('puts the claim between the greeting and the opener', () => {
    const { body } = envelope(official());
    expect(body).toContain('Dear Assemblymember Roth,\n\nI am a constituent in Assembly District 24.\n\n');
  });

  it('is present for both state chambers', () => {
    for (const ch of ['upper', 'lower'] as const) {
      expect(envelope(official({ chamber: ch })).body).toMatch(/I am a constituent in \w/);
    }
  });

  it('is absent for a federal office, where CWC carries the address', () => {
    const fed = official({ level: 'federal', title: 'U.S. Senator', chamber: 'senate', lastName: 'Rosen', name: 'Jacky Rosen' });
    expect(envelope(fed).body).not.toContain('I am a constituent');
  });

  it('does not disturb the core, which is the sender\'s approved text', () => {
    expect(envelope(official()).body).toContain('The core of my letter about child care.');
  });
});

describe('CWC-bound drafts', () => {
  it('omits the claim, because those chambers forbid the address in the text', () => {
    // signature === false marks a CWC delivery. CWC carries name and address
    // in its own fields, verifies them against the seat, and asks that
    // neither appear in the body.
    const { body } = buildEnvelope('The core case.', official(), {
      committeeName: null,
      verb: null,
      billRef: null,
      stageGoal: null,
      headline: 'child care',
      senderName: 'Jane Doe',
      city: 'Reno',
      stateCode: 'NV',
      zip: '89501',
      signature: false,
    });
    expect(body).not.toContain('I am a constituent');
    expect(body).not.toMatch(/Reno, NV/);
  });
});

describe('local bodies are not legislatures', () => {
  const planner = {
    id: 'case-contact', name: 'Reno Planning Commission', title: 'Case comments',
    level: 'local' as const, party: 'Nonpartisan', state: 'NV',
  };
  it('says nothing in the standing line, because the opener names the place', () => {
    expect(constituentLine(planner, 'Reno', 'NV')).toBeNull();
  });
  it('still gives state legislators their district line', () => {
    const senator = { ...planner, level: 'state' as const, chamber: 'upper' as const, district: '15' };
    expect(constituentLine(senator, 'Reno', 'NV')).toBe('I am a constituent in Senate District 15.');
  });
});
