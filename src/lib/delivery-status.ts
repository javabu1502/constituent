/**
 * One vocabulary for what happened to a message, used by every surface that
 * shows it: the constituent's dashboard, the organization's analytics, the
 * CSV export and the impact report.
 *
 * It exists because those surfaces disagreed. The constituent dashboard was
 * taught the delivery statuses; the organization screens were not, so a
 * refused message printed as "Cwc refused" on a green bar next to the
 * delivered ones. An organization reporting reach to a funder, or telling an
 * office how many of its constituents wrote in, has to be able to tell a
 * message that arrived from one that never did.
 */

/** Did the office get it, is it still moving, or did it never arrive. */
export type DeliveryOutcome = 'delivered' | 'in_flight' | 'not_delivered' | 'self_sent';

export interface DeliveryStatusInfo {
  /** Plain label for a person to read. */
  label: string;
  outcome: DeliveryOutcome;
}

const STATUSES: Record<string, DeliveryStatusInfo> = {
  // Handed to the office by us, and confirmed.
  sent: { label: 'Delivered to Congress', outcome: 'delivered' },
  cwc_delivered: { label: 'Delivered to Congress', outcome: 'delivered' },
  webform_delivered: { label: 'Filed in the office form', outcome: 'delivered' },

  // Accepted by the pipeline, not yet confirmed by the office.
  cwc_submitted: { label: 'Sending to Congress', outcome: 'in_flight' },
  webform_submitted: { label: 'Sending to the office form', outcome: 'in_flight' },
  cwc_held: { label: 'Held for review', outcome: 'in_flight' },
  webform_held: { label: 'Held for review', outcome: 'in_flight' },
  pending_review: { label: 'Held for review', outcome: 'in_flight' },

  // Never reached an office.
  cwc_refused: { label: 'Address could not be verified', outcome: 'not_delivered' },
  cwc_failed: { label: 'Not delivered', outcome: 'not_delivered' },
  webform_failed: { label: 'Not delivered', outcome: 'not_delivered' },
  cwc_blocked: { label: 'Not sent', outcome: 'not_delivered' },
  webform_blocked: { label: 'Not sent', outcome: 'not_delivered' },

  // The person sent it themselves, so we cannot know whether it arrived.
  email_opened: { label: 'Opened in their email app', outcome: 'self_sent' },
  email_copied: { label: 'Copied to send', outcome: 'self_sent' },
  form_opened: { label: 'Opened the office form', outcome: 'self_sent' },
  website_opened: { label: 'Opened the office website', outcome: 'self_sent' },
  called: { label: 'Called the office', outcome: 'self_sent' },
  cwc_skipped: { label: 'Sent by email instead', outcome: 'self_sent' },
  webform_skipped: { label: 'Sent by email instead', outcome: 'self_sent' },
  initiated: { label: 'Started', outcome: 'self_sent' },
};

export function deliveryStatusInfo(status: string | null | undefined): DeliveryStatusInfo {
  const key = (status ?? '').trim();
  return STATUSES[key] ?? { label: key ? key.replace(/_/g, ' ') : 'Unknown', outcome: 'self_sent' };
}

export function deliveryStatusLabel(status: string | null | undefined): string {
  return deliveryStatusInfo(status).label;
}

/** Tailwind background for a bar or chip, by what the status means. */
export function deliveryOutcomeBarClass(outcome: DeliveryOutcome): string {
  switch (outcome) {
    case 'delivered': return 'bg-green-500';
    case 'in_flight': return 'bg-blue-500';
    case 'not_delivered': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}

export interface DeliveryTally {
  delivered: number;
  inFlight: number;
  notDelivered: number;
  selfSent: number;
  total: number;
}

/** Count a set of messages by what actually happened to them. */
export function tallyDelivery(statuses: Array<string | null | undefined>): DeliveryTally {
  const t: DeliveryTally = { delivered: 0, inFlight: 0, notDelivered: 0, selfSent: 0, total: 0 };
  for (const s of statuses) {
    t.total++;
    switch (deliveryStatusInfo(s).outcome) {
      case 'delivered': t.delivered++; break;
      case 'in_flight': t.inFlight++; break;
      case 'not_delivered': t.notDelivered++; break;
      default: t.selfSent++; break;
    }
  }
  return t;
}
