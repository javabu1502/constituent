import { describe, it, expect } from 'vitest';
import { draftProblems, draftWordBudget } from '../story-draft-check';

describe('draftProblems (a story may only contain what the teller wrote)', () => {
  const teller = 'Rent went from $1,375 to $1,640 in 2025. I work 34 hours. We have 2 kids.';
  it('passes a draft whose numbers all come from the teller', () => {
    expect(draftProblems('My rent went from $1,375 to $1,640 in 2025 while I work 34 hours a week for my 2 kids.', teller, 60)).toEqual([]);
  });
  it('flags invented numbers, overlong drafts, and dashes', () => {
    const p = draftProblems('My rent jumped $412 a month, about 30 percent, and my 3 kids felt it — hard.', teller, 20);
    expect(p.join(' ')).toMatch(/never wrote: 412, 30, 3/);
    expect(p.join(' ')).toMatch(/dashes/);
    expect(draftProblems(new Array(80).fill('word').join(' '), teller, 40).join(' ')).toMatch(/too long/);
  });
  it('word budget is 2.5x the teller, clamped 120 to 700 (room to develop, 10-02)', () => {
    expect(draftWordBudget(10)).toBe(120);
    expect(draftWordBudget(100)).toBe(250);
    expect(draftWordBudget(1000)).toBe(700);
  });
});
