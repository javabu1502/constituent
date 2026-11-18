import { describe, it, expect } from 'vitest';
import { buildAskInstruction, normalizeAsk, MAX_ASK_LENGTH } from '../campaign-ask';

describe('normalizeAsk', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeAsk('  Add your   name\n before Friday. ')).toBe('Add your name before Friday.');
  });

  it('treats blank as absent', () => {
    expect(normalizeAsk('')).toBeNull();
    expect(normalizeAsk('   ')).toBeNull();
    expect(normalizeAsk(null)).toBeNull();
    expect(normalizeAsk(undefined)).toBeNull();
  });

  it('caps the length, because this is one sentence', () => {
    const long = 'x'.repeat(MAX_ASK_LENGTH + 120);
    expect(normalizeAsk(long)).toHaveLength(MAX_ASK_LENGTH);
  });
});

describe("buildAskInstruction uses the organization's own ask when there is one", () => {
  it('quotes it and tells the model not to soften it', () => {
    const out = buildAskInstruction({
      ask: 'Add your name as an original cosponsor before the Friday deadline.',
      billRef: 'H.R. 2184',
      stageGoal: 'cosponsor',
      stance: 'support',
    });
    expect(out).toContain('original cosponsor before the Friday deadline');
    expect(out).toContain('Do not broaden or soften it');
  });

  it('wins over the sentence the goal would have implied', () => {
    const out = buildAskInstruction({
      ask: 'Request a hearing in Education and Workforce.',
      billRef: 'H.R. 2184',
      stageGoal: 'cosponsor',
      stance: 'support',
    });
    expect(out).toContain('Request a hearing');
    expect(out).not.toContain('cosponsor it');
  });

  it('ignores an ask that is only whitespace', () => {
    const out = buildAskInstruction({ ask: '   ', billRef: 'H.R. 2184', stageGoal: 'cosponsor' });
    expect(out).toContain('cosponsor it');
  });
});

describe('buildAskInstruction falls back to the goal', () => {
  it('asks for a cosponsor on a cosponsor action', () => {
    expect(buildAskInstruction({ billRef: 'H.R. 2184', stageGoal: 'cosponsor', stance: 'support' }))
      .toBe('THE ASK SENTENCE MUST: name H.R. 2184 and ask them to cosponsor it.');
  });

  it('asks for a yes when the campaign supports the bill', () => {
    expect(buildAskInstruction({ billRef: 'S. 4825', stageGoal: 'floor_senate', stance: 'support' }))
      .toContain('support it / vote yes');
  });

  it('asks for a no when the campaign opposes it', () => {
    expect(buildAskInstruction({ billRef: 'S. 4825', stageGoal: 'floor_senate', stance: 'oppose' }))
      .toContain('oppose it / vote no');
  });

  it('says nothing at all without a bill to name', () => {
    expect(buildAskInstruction({ billRef: null, stageGoal: 'committee' })).toBe('');
    expect(buildAskInstruction({})).toBe('');
  });

  it('still says nothing when there is no bill and no ask', () => {
    expect(buildAskInstruction({ ask: null, billRef: '', stance: 'support' })).toBe('');
  });
});
