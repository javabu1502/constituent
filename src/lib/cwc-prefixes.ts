/**
 * Client-safe CWC (Communicating With Congress) form constants.
 *
 * The Senate validates <Prefix> against exactly these five values and
 * hard-rejects anything else (the House historically doesn't validate,
 * but we build to the stricter Senate rules). Any UI that collects a
 * constituent title for congressional delivery must constrain the picker
 * to this list — free-text prefixes will bounce the whole message.
 */
export const CWC_PREFIXES = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.'] as const;
export type CwcPrefix = (typeof CWC_PREFIXES)[number];

/**
 * Staged-rollout flag for CWC delivery. While false/absent, delivery stays
 * mailto/webform and the CWC-only form fields (title, required email) are
 * hidden — flipping the env var makes the forms collect everything a CWC
 * payload needs before the delivery path itself ships.
 */
export const CWC_ENABLED = process.env.NEXT_PUBLIC_CWC_ENABLED === 'true';
