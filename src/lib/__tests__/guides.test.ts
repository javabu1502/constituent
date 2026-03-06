import { describe, it, expect } from 'vitest';
import { GUIDES, CATEGORY_LABELS, type GuideCategory } from '../guides';

describe('GUIDES', () => {
  it('has 32 guides', () => {
    expect(GUIDES.length).toBe(32);
  });

  it('every guide has required fields', () => {
    for (const guide of GUIDES) {
      expect(guide.title).toBeTruthy();
      expect(guide.href).toBeTruthy();
      expect(guide.description).toBeTruthy();
      expect(guide.category).toBeTruthy();
    }
  });

  it('every href starts with /guides/', () => {
    for (const guide of GUIDES) {
      expect(guide.href).toMatch(/^\/guides\//);
    }
  });

  it('CATEGORY_LABELS maps every category used in GUIDES', () => {
    const usedCategories = new Set(GUIDES.map((g) => g.category));
    for (const cat of usedCategories) {
      expect(CATEGORY_LABELS[cat as GuideCategory]).toBeTruthy();
    }
  });

  it('has no duplicate hrefs', () => {
    const hrefs = GUIDES.map((g) => g.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
