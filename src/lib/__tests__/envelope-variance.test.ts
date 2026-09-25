import { describe, expect, it } from 'vitest';
import { buildEnvelope, validateCampaignAsk } from '../envelope';
import type { Official } from '../types';

const rep = { name: 'Jane Smith', lastName: 'Smith', title: 'Senator', party: 'D', level: 'state', id: 'x1' } as unknown as Official;

const baseOpts = {
  committeeName: null,
  verb: null as 'support' | 'oppose' | null,
  billRef: null as string | null,
  stageGoal: undefined,
  headline: 'inflation',
  senderName: 'Pat Doe',
  city: 'Reno',
  stateCode: 'NV',
  zip: '89506',
};

describe('envelope variance', () => {
  it('uses the AI opening and ask when provided', () => {
    const msg = buildEnvelope('CORE TEXT', rep, {
      ...baseOpts,
      coreOpening: 'Groceries have gotten away from my family, and I need you to know it.',
      coreAsk: 'Please make the cost of living your top priority this session.',
    });
    expect(msg.body).toContain('Groceries have gotten away');
    expect(msg.body).toContain('top priority this session');
    expect(msg.body).not.toContain('I am writing to you as your constituent because your vote speaks');
  });

  it('different senders draw different pooled frames (no single template)', () => {
    const senders = ['Ana Lopez', 'Bill Chen', 'Cara Jones', 'Dev Patel', 'Eve Kim', 'Frank Moore', 'Gia Russo', 'Hank Webb', 'Iris Cole', 'Jay Ford'];
    const openers = new Set(
      senders.map((s) => buildEnvelope('CORE', rep, { ...baseOpts, senderName: s }).body.split('\n\n')[1])
    );
    // Ten senders must not share one opener; the pool guarantees spread.
    expect(openers.size).toBeGreaterThanOrEqual(3);
  });

  it('the same sender always gets the same frame (stable on regenerate)', () => {
    const a = buildEnvelope('CORE', rep, baseOpts).body;
    const b = buildEnvelope('CORE', rep, baseOpts).body;
    expect(a).toBe(b);
  });

  it('committee context keeps the factual pooled opener even when an AI opening exists', () => {
    const msg = buildEnvelope('CORE', rep, {
      ...baseOpts,
      committeeName: 'Assembly Education Committee',
      billRef: 'AB 156',
      verb: 'support',
      coreOpening: 'This should not be used here.',
    });
    expect(msg.body).toContain('Assembly Education Committee');
    expect(msg.body).not.toContain('should not be used here');
  });
});

describe('validateCampaignAsk', () => {
  it('requires the bill ref, tolerant of formatting', () => {
    expect(validateCampaignAsk('Please support AB 156 this session.', 'AB 156', 'support', null)).toBe(true);
    expect(validateCampaignAsk('Please support A.B.156 this session.', 'AB 156', 'support', null)).toBe(true);
    expect(validateCampaignAsk('Please support this bill.', 'AB 156', 'support', null)).toBe(false);
  });
  it('rejects polarity mismatches', () => {
    expect(validateCampaignAsk('Please vote no on AB 156.', 'AB 156', 'support', null)).toBe(false);
    expect(validateCampaignAsk('Please support AB 156.', 'AB 156', 'oppose', null)).toBe(false);
    expect(validateCampaignAsk('I urge you to oppose AB 156.', 'AB 156', 'oppose', null)).toBe(true);
  });
  it('cosponsor stage requires the word', () => {
    expect(validateCampaignAsk('Please support S. 1332.', 'S. 1332', 'support', 'cosponsor')).toBe(false);
    expect(validateCampaignAsk('Please cosponsor S. 1332.', 'S. 1332', 'support', 'cosponsor')).toBe(true);
  });
});
