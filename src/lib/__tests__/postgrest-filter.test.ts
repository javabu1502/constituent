import { describe, it, expect } from 'vitest';
import { sanitizeFilterValue } from '../postgrest-filter';

describe('sanitizeFilterValue', () => {
  it('strips the comma that starts a second condition', () => {
    // The production proof: this returned every demo campaign.
    expect(sanitizeFilterValue('zzzz,slug.like.*demo*')).toBe('zzzz slug.like. demo');
  });

  it('strips parentheses, which group conditions', () => {
    expect(sanitizeFilterValue('a),or(b.eq.c')).toBe('a or b.eq.c');
  });

  it('strips wildcards so a search cannot ask for every row', () => {
    expect(sanitizeFilterValue('%')).toBe('');
    expect(sanitizeFilterValue('*school*')).toBe('school');
  });

  it('strips quotes and backslashes rather than trusting an escape', () => {
    expect(sanitizeFilterValue('a"b\\c')).toBe('a b c');
  });

  it('leaves an ordinary search alone', () => {
    expect(sanitizeFilterValue('school breakfast')).toBe('school breakfast');
    expect(sanitizeFilterValue('  child   care  ')).toBe('child care');
  });

  // A dot cannot break out: PostgREST splits a condition on its first two
  // dots and treats the rest as the value, so the bill number survives.
  it('keeps a bill reference searchable exactly as typed', () => {
    expect(sanitizeFilterValue('H.R. 1234')).toBe('H.R. 1234');
  });
});
