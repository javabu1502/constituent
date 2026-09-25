import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/openstates-api', () => ({ openstatesRestFetch: vi.fn() }));
vi.mock('@/lib/congress-api', () => ({ congressFetch: vi.fn() }));

import { suggestNextStage } from '../bill-status';

describe('suggestNextStage', () => {
  it('maps enactment to thank_you', () => {
    expect(suggestNextStage('Approved by the Governor. Chapter 212.', null).goal).toBe('thank_you');
    expect(suggestNextStage('Signed by Governor', null).goal).toBe('thank_you');
    expect(suggestNextStage('Became Public Law No: 119-21.', null).goal).toBe('thank_you');
  });

  it('maps delivery to the executive to thank_you', () => {
    expect(suggestNextStage('Enrolled and delivered to Governor.', null).goal).toBe('thank_you');
    expect(suggestNextStage('Presented to the President.', null).goal).toBe('thank_you');
  });

  it('maps chamber passage to the next chamber', () => {
    expect(suggestNextStage('Passed the Assembly. (28-14)', 'lower').goal).toBe('floor_senate');
    expect(suggestNextStage('Read third time. Passed.', 'lower').goal).toBe('floor_senate');
    expect(suggestNextStage('Passed Senate with amendments.', 'upper').goal).toBe('thank_you');
  });

  it('maps committee report-out to that chamber floor', () => {
    expect(suggestNextStage('From committee: Do pass.', 'lower').goal).toBe('floor_house');
    expect(suggestNextStage('Reported favorably and ordered to a third reading.', 'upper').goal).toBe('floor_senate');
  });

  it('maps committee referral to a committee stage and extracts the name', () => {
    const s1 = suggestNextStage('Referred to Committee on Education.', 'lower');
    expect(s1.goal).toBe('committee');
    expect(s1.committeeName).toBe('Education');
    const s2 = suggestNextStage('Referred to the Health and Human Services Committee', 'upper');
    expect(s2.goal).toBe('committee');
    expect(s2.committeeName).toBe('Health and Human Services');
  });

  it('defaults early actions to cosponsor building', () => {
    expect(suggestNextStage('Read first time.', 'lower').goal).toBe('cosponsor');
    expect(suggestNextStage('Prefiled.', null).goal).toBe('cosponsor');
  });
});
