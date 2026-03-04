import { describe, it, expect } from 'vitest';
import { getAllIssueOptions, searchIssues } from '../policy-areas';

describe('getAllIssueOptions', () => {
  it('returns a non-empty array', () => {
    const options = getAllIssueOptions();
    expect(options.length).toBeGreaterThan(0);
  });

  it('each option has label and category', () => {
    const options = getAllIssueOptions();
    for (const opt of options) {
      expect(opt.label).toBeTruthy();
      expect(opt.category).toBeTruthy();
    }
  });

  it('returns consistent results (cached)', () => {
    const a = getAllIssueOptions();
    const b = getAllIssueOptions();
    expect(a).toBe(b);
  });
});

describe('searchIssues', () => {
  it('returns all options for empty query', () => {
    const all = getAllIssueOptions();
    const results = searchIssues('');
    expect(results.length).toBe(all.length);
  });

  it('returns all options for whitespace-only query', () => {
    const all = getAllIssueOptions();
    const results = searchIssues('   ');
    expect(results.length).toBe(all.length);
  });

  it('finds a direct label match', () => {
    const results = searchIssues('gun violence');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label.toLowerCase()).toContain('gun violence');
  });

  it('expands keyword alias "guns"', () => {
    const results = searchIssues('guns');
    const labels = results.map((r) => r.label.toLowerCase());
    expect(labels).toContain('gun violence');
  });

  it('expands multi-word alias "social security"', () => {
    const results = searchIssues('social security');
    const labels = results.map((r) => r.label.toLowerCase());
    expect(labels).toContain('social security');
  });

  it('direct match scores higher than alias match', () => {
    const results = searchIssues('gun violence');
    // "Gun Violence" is a direct label match - should be first or near top
    expect(results[0].label.toLowerCase()).toContain('gun violence');
  });

  it('returns no results for gibberish', () => {
    const results = searchIssues('xyzzyflorp');
    expect(results.length).toBe(0);
  });

  it('finds category-level matches', () => {
    const results = searchIssues('education');
    expect(results.length).toBeGreaterThan(0);
    // Should include items from the Education category
    const categories = results.map((r) => r.category);
    expect(categories).toContain('Education');
  });

  it('is case-insensitive', () => {
    const lower = searchIssues('climate');
    const upper = searchIssues('CLIMATE');
    expect(lower.length).toBe(upper.length);
  });

  it('handles single-word search', () => {
    const results = searchIssues('tax');
    expect(results.length).toBeGreaterThan(0);
  });
});
