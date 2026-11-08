import { describe, it, expect } from 'vitest';
import {
  buildCampaignInterviewPrompt,
  campaignGuideTurnDirective,
  CAMPAIGN_GUIDE_HANDOFF,
  CAMPAIGN_GUIDE_MAX_QUESTIONS,
} from '../campaign-interview-prompt';

const RENO = {
  headline: 'Should Reno rezone 156 acres in the North Valleys for industrial use?',
  description: 'A Master Plan Amendment and Zoning Map Amendment on the Peavine Peak Trails Business Park application.',
  is_official: false,
  direction: 'oppose' as const,
};

describe('campaignGuideTurnDirective', () => {
  it('spends the first turn on what the opening did not already cover', () => {
    const d = campaignGuideTurnDirective(1);
    expect(d).toMatch(/first question/i);
    expect(d).toMatch(/go straight to C/);
  });

  it('counts down the remaining questions in the middle of the budget', () => {
    expect(campaignGuideTurnDirective(2)).toMatch(/2 questions left/);
  });

  it('spends the last question on the decision when that slot is still empty', () => {
    const d = campaignGuideTurnDirective(CAMPAIGN_GUIDE_MAX_QUESTIONS);
    expect(d).toMatch(/last question/i);
    expect(d).toMatch(/ask about C now/);
  });

  // The bug this budget exists for: a guide that found a wildfire evacuation
  // kept asking about it and never reached what the writer wanted done.
  it('stops asking once the budget is spent', () => {
    for (const n of [CAMPAIGN_GUIDE_MAX_QUESTIONS + 1, CAMPAIGN_GUIDE_MAX_QUESTIONS + 5, 30]) {
      const d = campaignGuideTurnDirective(n);
      expect(d).toMatch(/Ask nothing/);
      expect(d).toMatch(CAMPAIGN_GUIDE_HANDOFF);
    }
  });

  it('treats a zero or negative turn count as the first turn', () => {
    expect(campaignGuideTurnDirective(0)).toBe(campaignGuideTurnDirective(1));
    expect(campaignGuideTurnDirective(-3)).toBe(campaignGuideTurnDirective(1));
  });
});

describe('buildCampaignInterviewPrompt', () => {
  it('carries the turn directive into the prompt', () => {
    expect(buildCampaignInterviewPrompt(RENO, null, 1)).toContain(campaignGuideTurnDirective(1));
    expect(buildCampaignInterviewPrompt(RENO, null, 9)).toContain(campaignGuideTurnDirective(9));
  });

  it('defaults to the first turn when no count is given', () => {
    expect(buildCampaignInterviewPrompt(RENO)).toContain(campaignGuideTurnDirective(1));
  });

  it('ranks the decision slot above every other reason to ask', () => {
    const p = buildCampaignInterviewPrompt(RENO, null, 2);
    expect(p).toMatch(/If C is missing, ask about C\. This outranks every reason/);
  });

  it('never asks the writer to invent an ask the campaign already sets', () => {
    const p = buildCampaignInterviewPrompt({ ...RENO, bill_ref: 'AB 123', stage_goal: 'cosponsor' }, null, 2);
    expect(p).toContain('cosponsor AB 123');
    expect(p).toMatch(/never ask them what to ask for/);
    expect(p).toContain('AB 123 itself');
  });

  it('asks an official weigh-in what they want, since nothing fixes the ask', () => {
    const p = buildCampaignInterviewPrompt({ ...RENO, is_official: true }, 'oppose', 2);
    expect(p).toMatch(/What they want the official to understand or do/);
    expect(p).not.toMatch(/never ask them what to ask for/);
  });

  it('does not argue back at someone who answered no', () => {
    const p = buildCampaignInterviewPrompt({ ...RENO, is_official: true }, 'oppose', 1);
    expect(p).toMatch(/answered NO/);
    expect(p).toMatch(/Do not argue the other side/);
  });

  it('keeps the hardship and trauma limits', () => {
    const p = buildCampaignInterviewPrompt(RENO, null, 2);
    expect(p).toMatch(/An evacuation, a fire, a flood, an eviction or an accident is a traumatic event/);
    expect(p).toMatch(/A hardship gets one question/);
    expect(p).toMatch(/Do not ask what frightened or worried them most/);
  });

  it('still bans the em dash it tells the model not to write', () => {
    expect(buildCampaignInterviewPrompt(RENO, null, 1)).not.toMatch(/—/);
  });

  it('pins the Spanish hand-off on a Spanish campaign', () => {
    const p = buildCampaignInterviewPrompt({ ...RENO, language: 'es' }, null, 1);
    expect(p).toMatch(/Write every reply in Spanish/);
    expect(p).toContain('Redactar mi mensaje');
  });

  // The client shows "Draft my message" by matching this against the guide's
  // reply, so a hand-off sentence the regex misses strands the person.
  it('emits a hand-off sentence the client can match', () => {
    const d = campaignGuideTurnDirective(CAMPAIGN_GUIDE_MAX_QUESTIONS + 1);
    expect(CAMPAIGN_GUIDE_HANDOFF.test(d)).toBe(true);
  });
});
