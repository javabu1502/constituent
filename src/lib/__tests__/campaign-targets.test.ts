import { describe, it, expect } from 'vitest';
import { billLevelAllowed, billLevelAfterTargetChange } from '../campaign-targets';

describe('billLevelAllowed (a campaign cannot cite another legislature\'s bill)', () => {
  it('lets federal targets cite a federal bill only', () => {
    expect(billLevelAllowed('federal', 'federal')).toBe(true);
    expect(billLevelAllowed('federal', 'state')).toBe(false);
  });
  it('lets state targets cite a state bill only', () => {
    expect(billLevelAllowed('state', 'state')).toBe(true);
    expect(billLevelAllowed('state', 'federal')).toBe(false);
  });
  it('lets "both" cite either', () => {
    expect(billLevelAllowed('both', 'federal')).toBe(true);
    expect(billLevelAllowed('both', 'state')).toBe(true);
  });
  it('always allows no bill, since the link is optional', () => {
    for (const t of ['federal', 'state', 'both'] as const) {
      expect(billLevelAllowed(t, '')).toBe(true);
    }
  });
});

describe('billLevelAfterTargetChange', () => {
  it('drops a bill the new target cannot act on', () => {
    expect(billLevelAfterTargetChange('state', 'federal')).toBe('');
    expect(billLevelAfterTargetChange('federal', 'state')).toBe('');
  });
  it('keeps one that still fits', () => {
    expect(billLevelAfterTargetChange('federal', 'federal')).toBe('federal');
    expect(billLevelAfterTargetChange('both', 'state')).toBe('state');
    expect(billLevelAfterTargetChange('state', '')).toBe('');
  });
});

describe('local targets', () => {
  it('cannot cite a bill, because a council acts on applications and ordinances', () => {
    expect(billLevelAllowed('local', 'federal')).toBe(false);
    expect(billLevelAllowed('local', 'state')).toBe(false);
  });
  it('still allows no bill at all', () => {
    expect(billLevelAllowed('local', '')).toBe(true);
  });
  it('drops a bill when the target changes to local', () => {
    expect(billLevelAfterTargetChange('local', 'state')).toBe('');
    expect(billLevelAfterTargetChange('local', 'federal')).toBe('');
    expect(billLevelAfterTargetChange('local', '')).toBe('');
  });
});
