import { describe, it, expect } from 'vitest';
import {
  stripSignatureBlock,
  blocksFederalDelivery,
  containsSignatureBlock,
  cwcSendableProblems,
  assertCwcSendable,
  CwcComplianceError,
} from '../content';
import { sendBatch } from '../client';
import type { CwcDelivery, CwcMessageContent } from '../types';

describe('stripSignatureBlock', () => {
  it('removes a Sincerely closing with name + address', () => {
    const body = 'I urge you to support affordable insulin.\n\nSincerely,\nJane Doe\nNew York, NY 10118';
    expect(stripSignatureBlock(body)).toBe('I urge you to support affordable insulin.');
  });

  it('handles other closings', () => {
    expect(stripSignatureBlock('My message.\n\nThank you,\nJohn')).toBe('My message.');
    expect(stripSignatureBlock('My message.\n\nBest regards,\nJohn Smith\nBoston, MA')).toBe('My message.');
  });

  it('leaves a body without a closing untouched', () => {
    const body = 'Please protect coverage. My family depends on it.';
    expect(stripSignatureBlock(body)).toBe(body);
  });

  it('does not over-strip when "thanks" appears mid-message', () => {
    const body = 'Thanks to this program my mother got care. Please keep it.';
    expect(stripSignatureBlock(body)).toBe(body);
  });
});

describe('blocksFederalDelivery', () => {
  it('blocks state-bill campaigns from federal delivery', () => {
    expect(blocksFederalDelivery({ billLevel: 'state' })).toBe(true);
    expect(blocksFederalDelivery({ billLevel: 'federal' })).toBe(false);
    expect(blocksFederalDelivery({ billLevel: null })).toBe(false);
  });
});

describe('containsSignatureBlock', () => {
  it('detects a closing-salutation line anywhere in the body', () => {
    expect(containsSignatureBlock('Sincerely,\nJane Doe\n123 Main St')).toBe(true);
    expect(containsSignatureBlock('Body text.\n\nRespectfully,\nJohn\nP.S. one more thing')).toBe(true);
  });

  it('does not flag closings that are part of a sentence', () => {
    expect(containsSignatureBlock('Thanks to this program my mother got care.')).toBe(false);
    expect(containsSignatureBlock('I sincerely believe this matters.')).toBe(false);
    expect(containsSignatureBlock('Please protect coverage for my family.')).toBe(false);
  });
});

describe('assertCwcSendable (pre-send compliance gate)', () => {
  const cleanMessage: CwcMessageContent = {
    subject: 'Please support lowering insulin prices',
    topics: ['Health'],
    bills: [{ congress: 119, type: 's', number: 233 }],
    stance: 'pro',
    constituentMessage: 'As a nurse, I see insulin costs hurt my patients every week.',
  };

  it('passes a clean federal-bill message with a stance', () => {
    expect(cwcSendableProblems({ message: cleanMessage, billLevel: 'federal' })).toEqual([]);
    expect(() => assertCwcSendable({ message: cleanMessage, billLevel: 'federal' })).not.toThrow();
  });

  it('(a) blocks state-bill campaigns from federal CWC', () => {
    expect(() => assertCwcSendable({ message: cleanMessage, billLevel: 'state' })).toThrow(CwcComplianceError);
    expect(cwcSendableProblems({ message: cleanMessage, billLevel: 'state' }).join()).toMatch(/STATE bill/);
  });

  it('(b) requires a ProOrCon stance when a federal bill is referenced', () => {
    const noStance = { ...cleanMessage, stance: undefined };
    expect(() => assertCwcSendable({ message: noStance, billLevel: 'federal' })).toThrow(/stance/);
    // No bill referenced → no stance required.
    const noBill = { ...cleanMessage, bills: undefined, stance: undefined };
    expect(() => assertCwcSendable({ message: noBill })).not.toThrow();
  });

  it('(c) flags a signature block that survives stripping', () => {
    // A closing at the very start of the body is NOT removed by the trailing
    // stripper — the gate must catch it rather than let name/address ship.
    const sneaky = { ...cleanMessage, constituentMessage: 'Sincerely,\nJane Doe\nNew York, NY 10118' };
    expect(() => assertCwcSendable({ message: sneaky, billLevel: 'federal' })).toThrow(/signature block/);
    // A normal trailing signature is fine — stripping removes it downstream.
    const trailing = { ...cleanMessage, constituentMessage: 'My message body.\n\nSincerely,\nJane Doe' };
    expect(() => assertCwcSendable({ message: trailing, billLevel: 'federal' })).not.toThrow();
  });

  it('collects every problem at once', () => {
    const bad: CwcMessageContent = {
      ...cleanMessage,
      stance: undefined,
      constituentMessage: 'Sincerely,\nJane Doe\n10118',
    };
    const problems = cwcSendableProblems({ message: bad, billLevel: 'state' });
    expect(problems).toHaveLength(3);
  });
});

describe('sendBatch rate limiting', () => {
  const delivery = (i: number): CwcDelivery => ({
    chamber: 'house', officeCode: `HNY${String(i).padStart(2, '0')}`, campaignId: 'c',
    constituent: { prefix: 'Ms.', firstName: 'A', lastName: 'B', address1: '1 Main St', city: 'NYC', state: 'NY', zip: '10001', email: 'a@b.co' },
    message: { subject: 'Hello there', topics: ['Health'], constituentMessage: 'A message body here.' },
  });

  it('spaces sends to honor the per-second cap and captures per-item errors', async () => {
    const times: number[] = [];
    const start = Date.now();
    const send = async (d: CwcDelivery) => {
      times.push(Date.now() - start);
      if (d.officeCode === 'HNY02') throw new Error('boom');
      return { ok: true, status: 200 };
    };
    // Fixed `now` outside the SCWC maintenance windows so the run time of the
    // suite can never trip the batch guard.
    const res = await sendBatch([delivery(1), delivery(2), delivery(3)], send, {
      maxPerSecond: 10,
      now: new Date('2026-08-14T16:00:00Z'), // a Friday
    });
    expect(res).toHaveLength(3);
    expect(res[1].error).toBe('boom'); // failure captured, batch continues
    expect(res[0].result?.ok).toBe(true);
    // 10/sec → ~100ms gaps; the 3rd send should start >=180ms in (2 gaps).
    expect(times[2]).toBeGreaterThanOrEqual(180);
  });
});
