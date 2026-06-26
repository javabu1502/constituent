/**
 * Story usage permissions.
 *
 * Usage is the STORYTELLER's choice: at consent they pick which of these uses
 * they're comfortable with, and we record + flag exactly that set to the
 * campaign creator. The creator's `usage_statement` is context (how they hope
 * to use stories), but it never overrides what the storyteller actually grants.
 */

export interface UsageOption {
  value: string;
  label: string;
  description: string;
}

export const STORY_USAGE_OPTIONS: UsageOption[] = [
  {
    value: 'shared_with_legislators',
    label: 'Shared with elected officials',
    description: 'Sent to or shown to lawmakers and their staff to support the cause.',
  },
  {
    value: 'published_web_social',
    label: 'Published on web or social media',
    description: 'Posted on the organization’s website or social channels.',
  },
  {
    value: 'included_in_reports',
    label: 'Quoted in reports & materials',
    description: 'Used in reports, presentations, or printed materials.',
  },
  {
    value: 'shared_with_media',
    label: 'Shared with the press',
    description: 'Given to journalists or news outlets covering the issue.',
  },
  {
    value: 'used_in_campaign_messaging',
    label: 'Used in campaign messaging',
    description: 'Included in the organization’s emails, fundraising, or advocacy campaigns.',
  },
  {
    value: 'contact_me_followup',
    label: 'They may contact me about it',
    description: 'The organization can reach out to you about your story.',
  },
];

const LABELS = new Map(STORY_USAGE_OPTIONS.map((o) => [o.value, o.label]));

/** Human-readable labels for a set of granted usage values. */
export function usageLabels(values: string[]): string[] {
  return values.map((v) => LABELS.get(v) ?? v);
}
