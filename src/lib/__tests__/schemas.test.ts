import { describe, it, expect } from 'vitest';
import {
  generateMessageSchema,
  chatRequestSchema,
  trackSendSchema,
  createCampaignSchema,
  generateCommentSchema,
  profileUpdateSchema,
  parseBody,
} from '../schemas';

// --- generateMessageSchema ---

const validOfficial = {
  name: 'Jane Smith',
  title: 'Senator',
  party: 'D',
  state: 'CA',
};

describe('generateMessageSchema', () => {
  it('accepts valid input', () => {
    const result = generateMessageSchema.safeParse({
      officials: [validOfficial],
      issue: 'Climate change',
      ask: 'Support the Green New Deal',
      senderName: 'John Doe',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty officials array', () => {
    const result = generateMessageSchema.safeParse({
      officials: [],
      issue: 'Climate',
      ask: 'Act now',
      senderName: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing issue', () => {
    const result = generateMessageSchema.safeParse({
      officials: [validOfficial],
      ask: 'Act now',
      senderName: 'John',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid contactMethod', () => {
    const result = generateMessageSchema.safeParse({
      officials: [validOfficial],
      issue: 'Climate',
      ask: 'Act now',
      senderName: 'John',
      contactMethod: 'fax',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional address with valid zip', () => {
    const result = generateMessageSchema.safeParse({
      officials: [validOfficial],
      issue: 'Climate',
      ask: 'Act now',
      senderName: 'John',
      address: { street: '123 Main', city: 'LA', state: 'CA', zip: '90210' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects address with invalid zip', () => {
    const result = generateMessageSchema.safeParse({
      officials: [validOfficial],
      issue: 'Climate',
      ask: 'Act now',
      senderName: 'John',
      address: { street: '123 Main', city: 'LA', state: 'CA', zip: 'bad' },
    });
    expect(result.success).toBe(false);
  });
});

// --- chatRequestSchema ---

describe('chatRequestSchema', () => {
  it('accepts valid messages', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty messages array', () => {
    const result = chatRequestSchema.safeParse({ messages: [] });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'system', content: 'Hello' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects content exceeding 2000 chars', () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: 'user', content: 'x'.repeat(2001) }],
    });
    expect(result.success).toBe(false);
  });
});

// --- trackSendSchema ---

const validTrackSend = {
  advocate_name: 'John Doe',
  advocate_city: 'Austin',
  advocate_state: 'TX',
  legislator_name: 'Sen. Smith',
  legislator_id: 'S001234',
  legislator_party: 'R',
  legislator_level: 'federal',
  legislator_chamber: 'senate',
  issue_area: 'Health',
  issue_subtopic: 'Medicare',
  message_body: 'Please support...',
  delivery_method: 'email' as const,
  delivery_status: 'sent' as const,
};

describe('trackSendSchema', () => {
  it('accepts valid input', () => {
    const result = trackSendSchema.safeParse(validTrackSend);
    expect(result.success).toBe(true);
  });

  it('rejects missing required field', () => {
    const { advocate_name, ...rest } = validTrackSend;
    void advocate_name;
    const result = trackSendSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid delivery_method', () => {
    const result = trackSendSchema.safeParse({
      ...validTrackSend,
      delivery_method: 'pigeon',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid delivery_status', () => {
    const result = trackSendSchema.safeParse({
      ...validTrackSend,
      delivery_status: 'unknown',
    });
    expect(result.success).toBe(false);
  });
});

// --- createCampaignSchema ---

describe('createCampaignSchema', () => {
  it('accepts valid input', () => {
    const result = createCampaignSchema.safeParse({
      headline: 'Save Our Parks',
      description: 'A campaign to protect local parks from development.',
      issue_area: 'Environment',
      target_level: 'state',
    });
    expect(result.success).toBe(true);
  });

  it('rejects headline under 3 chars', () => {
    const result = createCampaignSchema.safeParse({
      headline: 'Hi',
      description: 'A campaign to protect local parks.',
      issue_area: 'Environment',
      target_level: 'state',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid target_level', () => {
    const result = createCampaignSchema.safeParse({
      headline: 'Save Parks',
      description: 'A campaign to protect local parks.',
      issue_area: 'Environment',
      target_level: 'local',
    });
    expect(result.success).toBe(false);
  });
});

// --- generateCommentSchema ---

describe('generateCommentSchema', () => {
  it('accepts valid input', () => {
    const result = generateCommentSchema.safeParse({
      regulationTitle: 'Clean Air Standards',
      agency: 'EPA',
      position: 'support',
      senderName: 'Jane Doe',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing regulationTitle', () => {
    const result = generateCommentSchema.safeParse({
      agency: 'EPA',
      position: 'support',
      senderName: 'Jane',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid position', () => {
    const result = generateCommentSchema.safeParse({
      regulationTitle: 'Rule',
      agency: 'EPA',
      position: 'neutral',
      senderName: 'Jane',
    });
    expect(result.success).toBe(false);
  });
});

// --- profileUpdateSchema ---

describe('profileUpdateSchema', () => {
  it('accepts valid partial update', () => {
    const result = profileUpdateSchema.safeParse({ city: 'Austin' });
    expect(result.success).toBe(true);
  });

  it('rejects empty object (no fields)', () => {
    const result = profileUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts valid zip format', () => {
    const result = profileUpdateSchema.safeParse({ zip: '78701' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid zip format', () => {
    const result = profileUpdateSchema.safeParse({ zip: 'bad' });
    expect(result.success).toBe(false);
  });
});

// --- parseBody helper ---

describe('parseBody', () => {
  it('returns typed data on success', () => {
    const result = parseBody(chatRequestSchema, {
      messages: [{ role: 'user', content: 'Hi' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toHaveLength(1);
    }
  });

  it('returns error string on failure', () => {
    const result = parseBody(chatRequestSchema, { messages: 'not-array' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});
