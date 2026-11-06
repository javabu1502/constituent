import { describe, it, expect } from 'vitest';
import { trackSendSchema } from '../schemas';

/**
 * Every id shape the clients actually send. The schema allowed 20 characters,
 * which fits a bioguide id and nothing else, so state and local messages were
 * rejected with a 400 that the fire-and-forget client swallowed while the page
 * told the person their message was in the count.
 */
const base = {
  advocate_name: 'Stuart',
  advocate_city: 'Olympia',
  advocate_state: 'WA',
  legislator_name: 'A Legislator',
  legislator_party: 'Democratic',
  issue_area: 'Health',
  issue_subtopic: 'Paid caregivers for disabled children',
  message_body: 'A message long enough to be real.',
  delivery_method: 'email' as const,
  delivery_status: 'email_opened' as const,
};

describe('track-send accepts the ids the app actually produces', () => {
  it('a federal bioguide id', () => {
    const r = trackSendSchema.safeParse({ ...base, legislator_id: 'C000127', legislator_level: 'federal', legislator_chamber: 'senate' });
    expect(r.success).toBe(true);
  });

  it('a state ocd-person id, 47 characters', () => {
    const id = 'ocd-person/9eddb3cd-868e-42ba-831a-b415fd7ed445';
    expect(id.length).toBe(47);
    const r = trackSendSchema.safeParse({ ...base, legislator_id: id, legislator_level: 'state', legislator_chamber: 'upper' });
    expect(r.success).toBe(true);
  });

  it('a local official id', () => {
    const r = trackSendSchema.safeParse({ ...base, legislator_id: 'local:3260600:hillary-schieve', legislator_level: 'local' });
    expect(r.success).toBe(true);
  });

  it('a local official with no chamber at all, because a mayor has none', () => {
    const r = trackSendSchema.safeParse({ ...base, legislator_id: 'local:3260600:meghan-ebert', legislator_level: 'local', legislator_chamber: undefined });
    expect(r.success).toBe(true);
  });

  it('still rejects an empty id', () => {
    const r = trackSendSchema.safeParse({ ...base, legislator_id: '', legislator_level: 'state' });
    expect(r.success).toBe(false);
  });
});
