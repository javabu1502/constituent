import { describe, it, expect } from 'vitest';
import { deliveryStatusInfo, deliveryStatusLabel, tallyDelivery, statusesForOutcome } from '../delivery-status';
import { NOT_DELIVERED_STATUSES, SENT_TO_CONGRESS_STATUSES } from '../cwc/message-status';

/**
 * One vocabulary, shared by the constituent dashboard, the organization's
 * analytics and the impact report. Before this, the org screens printed
 * "Cwc refused" on a green bar, and the funder report counted a refused
 * message as reach.
 */
describe('delivery status vocabulary', () => {
  it('separates arrived from never arrived', () => {
    expect(deliveryStatusInfo('cwc_delivered').outcome).toBe('delivered');
    expect(deliveryStatusInfo('cwc_refused').outcome).toBe('not_delivered');
    expect(deliveryStatusInfo('cwc_failed').outcome).toBe('not_delivered');
    expect(deliveryStatusInfo('webform_failed').outcome).toBe('not_delivered');
  });

  it('treats in-flight as neither', () => {
    expect(deliveryStatusInfo('cwc_submitted').outcome).toBe('in_flight');
    expect(deliveryStatusInfo('cwc_held').outcome).toBe('in_flight');
  });

  it('does not claim to know what happened to a message the person sent themselves', () => {
    expect(deliveryStatusInfo('email_opened').outcome).toBe('self_sent');
    expect(deliveryStatusInfo('called').outcome).toBe('self_sent');
  });

  it('never prints a raw column name', () => {
    for (const s of ['cwc_refused', 'webform_failed', 'cwc_held', 'cwc_blocked']) {
      expect(deliveryStatusLabel(s)).not.toMatch(/_/);
      expect(deliveryStatusLabel(s)).not.toMatch(/^Cwc/);
    }
  });

  it('degrades readably on something it has never seen', () => {
    expect(deliveryStatusLabel('some_new_status')).toBe('some new status');
    expect(deliveryStatusLabel(null)).toBe('Unknown');
  });

  it('tallies a mixed batch the way a report needs it', () => {
    const t = tallyDelivery(['cwc_delivered', 'cwc_delivered', 'cwc_refused', 'cwc_held', 'email_opened']);
    expect(t).toEqual({ delivered: 2, inFlight: 1, notDelivered: 1, selfSent: 1, total: 5 });
  });

  /**
   * `cwc_skipped` means the payload could not be built, so the office never
   * got the message. It was labelled "Sent by email instead" and counted as
   * mail the person sent themselves, which is a claim about an action they
   * never took, and it hid every build failure from an organization's
   * not-delivered column.
   */
  it('counts a payload that could not be built as not delivered', () => {
    for (const st of ['cwc_skipped', 'webform_skipped']) {
      expect(deliveryStatusInfo(st).outcome).toBe('not_delivered');
      expect(deliveryStatusLabel(st)).not.toMatch(/email instead/i);
    }
  });

  /** The two files that classify a status must not disagree. */
  it('agrees with message-status.ts on every status that file names', () => {
    for (const st of NOT_DELIVERED_STATUSES) {
      expect(deliveryStatusInfo(st).outcome, st).toBe('not_delivered');
    }
    for (const st of SENT_TO_CONGRESS_STATUSES) {
      expect(['delivered', 'in_flight'], st).toContain(deliveryStatusInfo(st).outcome);
    }
  });

  it('gives every legacy status a label instead of raw column text', () => {
    for (const st of ['drafted', 'opened', 'copied', 'sent', 'initiated']) {
      expect(deliveryStatusLabel(st), st).not.toContain('_');
      expect(deliveryStatusLabel(st), st).not.toBe('Unknown');
    }
  });

  /**
   * The legacy catch-all cannot claim Congress. Every row carrying it was
   * sent by the person from their own mail app, and many are state
   * legislature messages, so counting it as delivered made the demo report
   * overstate what the product had done.
   */
  it('does not claim the legacy "sent" status as a confirmed congressional delivery', () => {
    expect(deliveryStatusInfo('sent').outcome).toBe('self_sent');
    expect(deliveryStatusLabel('sent')).not.toMatch(/congress/i);
    expect(statusesForOutcome('delivered')).not.toContain('sent');
  });
});
