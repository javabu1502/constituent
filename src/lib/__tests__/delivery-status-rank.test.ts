import { describe, it, expect } from 'vitest';
import { isStrongerStatus, deliveryStatusRank } from '../delivery-status';

/**
 * One person engaging one official produces several of these. She opens her
 * mail app, copies the text, comes back and opens it again. Every one was a
 * new row, so on 2026-11-13 a constituent writing to five officials produced
 * ten of them and every count read it as ten messages.
 */
describe('how far a message got', () => {
  it('treats copying as less than opening', () => {
    expect(isStrongerStatus('email_opened', 'email_copied')).toBe(true);
    expect(isStrongerStatus('email_copied', 'email_opened')).toBe(false);
  });

  it('never lets a later click undo a confirmed delivery', () => {
    expect(isStrongerStatus('email_copied', 'cwc_delivered')).toBe(false);
    expect(isStrongerStatus('email_opened', 'cwc_delivered')).toBe(false);
    expect(isStrongerStatus('cwc_held', 'cwc_delivered')).toBe(false);
  });

  it('lets a real outcome replace an intention', () => {
    expect(isStrongerStatus('cwc_delivered', 'cwc_held')).toBe(true);
    expect(isStrongerStatus('cwc_failed', 'cwc_queued')).toBe(true);
  });

  it('treats the same status as not stronger, so repeats change nothing', () => {
    expect(isStrongerStatus('email_opened', 'email_opened')).toBe(false);
  });

  it('counts anything as stronger than no status at all', () => {
    expect(isStrongerStatus('email_copied', null)).toBe(true);
    expect(deliveryStatusRank(null)).toBe(0);
  });

  // An unknown status should not outrank a delivery we confirmed.
  it('gives an unrecognised status a middling rank', () => {
    expect(isStrongerStatus('something_new', 'cwc_delivered')).toBe(false);
    expect(isStrongerStatus('something_new', 'email_copied')).toBe(true);
  });
});
