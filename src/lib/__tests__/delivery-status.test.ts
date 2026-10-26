import { describe, it, expect } from 'vitest';
import { deliveryStatusInfo, deliveryStatusLabel, tallyDelivery } from '../delivery-status';

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
});
