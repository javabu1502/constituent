import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCallClaude = vi.fn();

vi.mock('@/lib/claude', () => ({
  callClaude: (...args: unknown[]) => mockCallClaude(...args),
  extractJSON: (t: string) => JSON.parse(t),
}));

vi.mock('@/lib/env', () => ({
  env: () => ({ ANTHROPIC_API_KEY: 'test-key', CLAUDE_MODEL: 'test-model' }),
}));

import { applyAttribution } from '../story-attribution';

describe('applyAttribution', () => {
  beforeEach(() => vi.clearAllMocks());

  it('named: leaves the story unchanged and never calls the model', async () => {
    const body = 'My name is Jane Smith and this is my story.';
    const res = await applyAttribution(body, 'named', 'Jane Smith');
    expect(res.final_body).toBe(body);
    expect(res.flagged).toEqual([]);
    expect(mockCallClaude).not.toHaveBeenCalled();
  });

  it('first_name_only: reduces full name to first name and drops the surname', async () => {
    const res = await applyAttribution('My name is Jane Smith and Smith has lived here for years.', 'first_name_only', 'Jane Smith');
    expect(res.final_body).toContain('Jane');
    expect(res.final_body).not.toContain('Smith');
    expect(mockCallClaude).not.toHaveBeenCalled();
  });

  it('anonymous: returns the model-redacted body and any flagged items', async () => {
    mockCallClaude.mockResolvedValue(JSON.stringify({ redacted: 'A community member shared their experience.', flagged: ['the town name'] }));
    const res = await applyAttribution('I am John Doe from Springfield.', 'anonymous', 'John Doe');
    expect(res.final_body).toBe('A community member shared their experience.');
    expect(res.flagged).toEqual(['the town name']);
    expect(mockCallClaude).toHaveBeenCalledOnce();
  });

  it('anonymous fail-safe: if redaction fails, strips the name and flags for manual review', async () => {
    mockCallClaude.mockRejectedValue(new Error('model down'));
    const res = await applyAttribution('John Doe did this.', 'anonymous', 'John Doe');
    expect(res.final_body).not.toContain('John Doe');
    expect(res.flagged.length).toBeGreaterThan(0);
  });
});
