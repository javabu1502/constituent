import { describe, it, expect } from 'vitest';
import { stripSignatureBlock, blocksFederalDelivery } from '../content';
import { sendBatch } from '../client';
import type { CwcDelivery } from '../types';

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
    const res = await sendBatch([delivery(1), delivery(2), delivery(3)], send, { maxPerSecond: 10 });
    expect(res).toHaveLength(3);
    expect(res[1].error).toBe('boom'); // failure captured, batch continues
    expect(res[0].result?.ok).toBe(true);
    // 10/sec → ~100ms gaps; the 3rd send should start >=180ms in (2 gaps).
    expect(times[2]).toBeGreaterThanOrEqual(180);
  });
});
