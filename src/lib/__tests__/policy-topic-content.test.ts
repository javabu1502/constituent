import { describe, it, expect } from 'vitest';
import { POLICY_TOPICS } from '@/lib/policy-topics';
import { TOPIC_CONTENT } from '@/lib/policy-topic-content';

/**
 * These pages exist to be read and indexed, so the checks are about the
 * content actually being there rather than about types.
 */
describe('policy topic content', () => {
  it('covers every topic, with nothing orphaned', () => {
    for (const t of POLICY_TOPICS) {
      expect(TOPIC_CONTENT[t.slug], `missing content for ${t.slug}`).toBeDefined();
    }
    for (const slug of Object.keys(TOPIC_CONTENT)) {
      expect(POLICY_TOPICS.map((t) => t.slug), `content for unknown topic ${slug}`).toContain(slug);
    }
  });

  it('says who decides, for every real topic', () => {
    for (const t of POLICY_TOPICS) {
      if (t.slug === 'other') continue;
      const c = TOPIC_CONTENT[t.slug];
      expect(c.deciders.length, t.slug).toBeGreaterThanOrEqual(2);
      for (const d of c.deciders) {
        expect(['Congress', 'Your state', 'Your city or county'], t.slug).toContain(d.level);
        expect(d.what.length, `${t.slug} ${d.level}`).toBeGreaterThan(30);
      }
    }
  });

  it('carries enough prose to be worth indexing', () => {
    for (const t of POLICY_TOPICS) {
      if (t.slug === 'other') continue;
      const c = TOPIC_CONTENT[t.slug];
      // A heading and a list is a thin page; this is the floor that stops one.
      expect(c.intro.length, t.slug).toBeGreaterThan(140);
      expect(c.questions.length, t.slug).toBeGreaterThanOrEqual(1);
      for (const q of c.questions) {
        expect(q.q.endsWith('?'), `${t.slug}: "${q.q}"`).toBe(true);
        expect(q.a.length, `${t.slug}: ${q.q}`).toBeGreaterThan(60);
      }
    }
  });

  it('names real congressional committees where it names any', () => {
    // Guards against a plausible-looking invention like "House Health Committee".
    const real = [
      'Senate Finance', 'Senate Health, Education, Labor and Pensions', 'Senate Judiciary',
      'Senate Banking, Housing and Urban Affairs', 'Senate Commerce, Science and Transportation',
      'Senate Environment and Public Works', 'Senate Energy and Natural Resources',
      'Senate Agriculture, Nutrition and Forestry', 'Senate Veterans Affairs', 'Senate Armed Services',
      'Senate Foreign Relations', 'Senate Rules and Administration',
      'House Energy and Commerce', 'House Ways and Means', 'House Education and Workforce',
      'House Financial Services', 'House Judiciary', 'House Administration',
      'House Transportation and Infrastructure', 'House Natural Resources', 'House Agriculture',
      'House Veterans Affairs', 'House Armed Services', 'House Foreign Affairs', 'House Homeland Security',
    ];
    for (const t of POLICY_TOPICS) {
      for (const c of TOPIC_CONTENT[t.slug]?.committees ?? []) {
        expect(real, `${t.slug} names "${c}"`).toContain(c);
      }
    }
  });

  it('tells foreign policy readers their state cannot help', () => {
    // The clearest jurisdiction trap on the site: people write to a state
    // legislator about tariffs.
    const fp = TOPIC_CONTENT['foreign-policy'];
    expect(fp.deciders.find((d) => d.level === 'Your state')?.what.toLowerCase()).toContain('little');
  });
});
