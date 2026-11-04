import { describe, it, expect } from 'vitest';
import { topicFor, topicsPresentIn, topicBySlug, POLICY_TOPICS } from '@/lib/policy-topics';

/** Every distinct issue_area on /issues on 2026-11-04, with its count. */
const LIVE_LABELS = [
  'civil rights', 'healthcare', 'economy', 'labor', 'foreign policy', 'guns', 'education',
  'technology', 'Health', 'Science, Technology, Communications', 'environment', 'infrastructure',
  'Economics and Public Finance', 'taxation', 'Energy', 'Agriculture and Food', 'veterans',
  'Crime and Law Enforcement', 'Technology and Online Safety', 'Finance and Financial Sector',
  'Transportation and Public Works', 'Elections and Voting', 'Immigration', 'Families',
  'Government Operations and Politics', 'Commerce', 'Social Welfare',
  'Foreign Trade and International Finance', 'Housing and Community Development', 'agriculture',
];

describe('policy topics', () => {
  it('collapses the thirty live labels into a browsable set', () => {
    const topics = topicsPresentIn(LIVE_LABELS);
    expect(LIVE_LABELS.length).toBe(30);
    expect(topics.length).toBeLessThanOrEqual(17);
    expect(topics.length).toBeGreaterThan(8);
  });

  it('puts the spellings that split the filter back together', () => {
    // These were separate chips on the live page.
    expect(topicFor('healthcare').slug).toBe(topicFor('Health').slug);
    for (const t of ['technology', 'Technology and Online Safety', 'Science, Technology, Communications']) {
      expect(topicFor(t).slug, t).toBe('technology');
    }
    for (const t of ['economy', 'Economics and Public Finance', 'Commerce', 'Finance and Financial Sector']) {
      expect(topicFor(t).slug, t).toBe('money-and-the-economy');
    }
    expect(topicFor('agriculture').slug).toBe(topicFor('Agriculture and Food').slug);
  });

  it('is case and whitespace insensitive', () => {
    expect(topicFor('  HEALTHCARE  ').slug).toBe('health-care');
    expect(topicFor('Guns').slug).toBe('guns');
  });

  it('never loses a campaign: anything unknown lands in other', () => {
    for (const odd of ['', null, undefined, 'Zoning in Ward 3', 'misc']) {
      expect(topicFor(odd).slug).toBeTruthy();
    }
    expect(topicFor('something nobody has written before').slug).toBe('other');
  });

  it('keeps families separate from health, which is the distinction the orgs care about', () => {
    expect(topicFor('Families').slug).toBe('families-and-children');
    expect(topicFor('Social Welfare').slug).toBe('families-and-children');
    expect(topicFor('Families').slug).not.toBe(topicFor('healthcare').slug);
  });

  it('every slug is unique, url-safe, and resolvable', () => {
    const slugs = POLICY_TOPICS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s).toMatch(/^[a-z0-9-]+$/);
      expect(topicBySlug(s)?.slug).toBe(s);
    }
    expect(topicBySlug('not-a-topic')).toBeNull();
  });

  it('every live label resolves to a real topic', () => {
    for (const l of LIVE_LABELS) {
      const t = topicFor(l);
      expect(POLICY_TOPICS.map((x) => x.slug), l).toContain(t.slug);
    }
  });
});
