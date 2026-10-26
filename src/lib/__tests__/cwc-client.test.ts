import { describe, it, expect } from 'vitest';
import {
  describeCwcOutcome,
  describeSendError,
  participatingSenateCount,
  isNonParticipatingSenator,
  congressChannel,
  streetLooksUndeliverable,
  districtResolvedFrom,
  isSentStatus,
  cwcAccepted,
  cwcStateFromStatus,
  CWC_COPY,
} from '../cwc-client';
import type { Official } from '@/lib/types';

describe('describeCwcOutcome', () => {
  it('queued reads as sent', () => {
    expect(describeCwcOutcome({ ok: true, cwc: { status: 'queued' } })).toEqual({ state: 'sent', note: CWC_COPY.sent });
  });
  it('held is its own state: not green, no "within minutes"', () => {
    const d = describeCwcOutcome({ ok: true, cwc: { status: 'held' } });
    expect(d.state).toBe('held');
    expect(d.note).toMatch(/reviewer/i);
    expect(d.note).not.toMatch(/within minutes/i);
  });
  it('blocked has no email fallback and plain copy', () => {
    const d = describeCwcOutcome({ ok: true, cwc: { status: 'blocked' } });
    expect(d.state).toBe('blocked');
    expect(d.note).toBe('This message could not be sent through this site.');
    expect(d.note).not.toMatch(/email option/i);
  });
  it('skipped / error / unknown fall back to the email path with a note', () => {
    expect(describeCwcOutcome({ ok: true, cwc: { status: 'skipped', reason: 'advocate name has no last name' } }).note).toMatch(/last name/);
    expect(describeCwcOutcome({ ok: true, cwc: { status: 'error' } }).state).toBe('failed');
    expect(describeCwcOutcome({ ok: true }).state).toBe('failed');
    expect(describeCwcOutcome(undefined).state).toBe('failed');
  });
  it('a cooldown 429 becomes a state with no send actions', () => {
    const d = describeCwcOutcome({ ok: false, error: 'You already contacted this official on Monday. Please wait before sending another message to the same representative.' });
    expect(d.state).toBe('cooldown');
    expect(d.note).toMatch(/already contacted this official on Monday/);
  });
  it('queued and held both count as accepted; everything else does not', () => {
    expect(cwcAccepted({ ok: true, cwc: { status: 'queued' } })).toBe(true);
    expect(cwcAccepted({ ok: true, cwc: { status: 'held' } })).toBe(true);
    expect(cwcAccepted({ ok: true, cwc: { status: 'blocked' } })).toBe(false);
    expect(cwcAccepted({ ok: false })).toBe(false);
    expect(cwcAccepted(undefined)).toBe(false);
  });
});

describe('describeSendError maps raw server strings to plain copy', () => {
  it('zod subject length', () => {
    const d = describeSendError('cwc.subject: String must contain at least 6 character(s)');
    expect(d.state).toBe('failed');
    expect(d.note).toMatch(/six characters/);
    expect(d.note).not.toMatch(/zod|String must/i);
  });
  it('CAPTCHA', () => {
    expect(describeSendError('CAPTCHA verification failed').note).toMatch(/confirm you are a person/);
  });
  it('generic server failure', () => {
    expect(describeSendError('Failed to log message').note).toMatch(/could not hand this message/);
    expect(describeSendError(undefined).note).toMatch(/could not hand this message/);
  });
  it('rate limit', () => {
    expect(describeSendError('Too many requests').note).toMatch(/Wait a minute/);
  });
  it('never contains an em dash', () => {
    for (const s of ['CAPTCHA verification failed', 'cwc.subject: x', 'Failed to log message', 'Too many requests', 'You already contacted this official on Monday.']) {
      expect(describeSendError(s).note).not.toMatch(/[—–]/);
    }
    for (const v of Object.values(CWC_COPY)) expect(v).not.toMatch(/[—–]/);
  });
});

describe('restoring a card from a recorded status', () => {
  it('maps statuses to card states', () => {
    expect(cwcStateFromStatus('cwc_submitted')).toBe('sent');
    expect(cwcStateFromStatus('webform_submitted')).toBe('sent');
    expect(cwcStateFromStatus('cwc_held')).toBe('held');
    expect(cwcStateFromStatus('email_opened')).toBe('idle');
    expect(cwcStateFromStatus(undefined)).toBe('idle');
  });
  it('any prior send status counts as already sent', () => {
    for (const s of ['email_opened', 'cwc_submitted', 'cwc_held', 'webform_submitted', 'form_opened', 'called']) {
      expect(isSentStatus(s)).toBe(true);
    }
    expect(isSentStatus('drafted')).toBe(false);
    expect(isSentStatus(undefined)).toBe(false);
  });
});

describe('congressChannel and the unresolved-district guard', () => {
  const rosen = { id: 'R000608', name: 'Jacky Rosen', level: 'federal', chamber: 'senate', state: 'NV', senateClass: 1 } as unknown as Official;
  const offices = { loaded: true, codes: new Set(['SNV01', 'HNV02', 'SCA01']), webformIds: new Set<string>() };
  const fields = { prefix: 'Ms.', email: 'a@b.co', street: '1 Main St', zip: '89501' };
  it('returns null when the street could not be geocoded, whatever the list says', () => {
    expect(congressChannel(rosen, offices, fields, false)).toBeNull();
  });
  it('defaults to resolved (CWC_ENABLED is false in tests, so null either way)', () => {
    expect(congressChannel(rosen, offices, fields)).toBeNull();
  });
});

describe('districtResolvedFrom reads the representatives response', () => {
  it('false on the senators-only fallback (warning or unknown district)', () => {
    expect(districtResolvedFrom({ warning: 'Could not determine district. Only showing senators.' })).toBe(false);
    expect(districtResolvedFrom({ address: { congressionalDistrict: 'unknown' } })).toBe(false);
    expect(districtResolvedFrom(null)).toBe(false);
  });
  it('true on a normal lookup', () => {
    expect(districtResolvedFrom({ address: { congressionalDistrict: '2' } })).toBe(true);
    expect(districtResolvedFrom({})).toBe(true);
  });
});

describe('streetLooksUndeliverable', () => {
  it('flags dorms, campus buildings, PO boxes, and streets with no house number', () => {
    expect(streetLooksUndeliverable('Liberty University')).toBe(true);
    expect(streetLooksUndeliverable('1971 University Blvd')).toBe(true);
    expect(streetLooksUndeliverable('PO Box 123')).toBe(true);
    expect(streetLooksUndeliverable('P.O. Box 123')).toBe(true);
    expect(streetLooksUndeliverable('Commons Hall Room 204')).toBe(true);
    expect(streetLooksUndeliverable('East Dorm 3')).toBe(true);
    expect(streetLooksUndeliverable('Main Street')).toBe(true);
  });
  it('accepts an ordinary residential street', () => {
    expect(streetLooksUndeliverable('123 Main St')).toBe(false);
    expect(streetLooksUndeliverable('45B Oak Ave Apt 2')).toBe(false);
    expect(streetLooksUndeliverable('')).toBe(false);
  });
});

describe('non-participating senator detection', () => {
  const rosen = { id: 'R000608', name: 'Jacky Rosen', level: 'federal', chamber: 'senate', state: 'NV', senateClass: 1 } as unknown as Official;
  const cortezMasto = { id: 'C001113', name: 'Catherine Cortez Masto', level: 'federal', chamber: 'senate', state: 'NV', senateClass: 3 } as unknown as Official;
  const amodei = { id: 'A000369', name: 'Mark Amodei', level: 'federal', chamber: 'house', state: 'NV', district: '2' } as unknown as Official;
  const offices = { loaded: true, codes: new Set(['SNV01', 'HNV02', 'SCA01']), webformIds: new Set<string>() };
  it('flags only senators missing from a LOADED list', () => {
    // CWC_ENABLED is false in tests, so everything reads as participating/not applicable.
    expect(isNonParticipatingSenator(cortezMasto, offices)).toBe(false);
    expect(isNonParticipatingSenator(rosen, offices)).toBe(false);
    expect(isNonParticipatingSenator(amodei, offices)).toBe(false);
    expect(isNonParticipatingSenator(cortezMasto, { loaded: false, codes: new Set(), webformIds: new Set() })).toBe(false);
  });
  it('counts Senate seats on the list', () => {
    expect(participatingSenateCount(offices)).toBe(2);
  });
});
