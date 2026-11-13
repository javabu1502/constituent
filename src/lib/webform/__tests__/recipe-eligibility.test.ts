import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hasWorkingRecipe, recipeDeliverableIds, recipeAgeDays, resetRecipeCache, setRecipeResults } from '../recipe-eligibility';

const asFile = (obj: Parameters<typeof setRecipeResults>[0]) => setRecipeResults(obj);

beforeEach(() => resetRecipeCache());
afterEach(() => resetRecipeCache());

/**
 * Eligibility is not "a definition exists". It is "a definition was walked
 * against the live page and still binds". Several were last touched in 2023,
 * and a stale one fills nothing while the page still answers 200.
 */
describe('which offices a recipe can reach', () => {
  it('admits an office the last sweep confirmed', () => {
    asFile({ checkedAt: '2026-11-13T00:00:00.000Z', binds: ['C001113', 'M001244'] });
    expect(hasWorkingRecipe('C001113')).toBe(true);
    expect(recipeDeliverableIds()).toHaveLength(2);
  });

  it('refuses an office the sweep found stale', () => {
    asFile({ binds: ['C001113'], stale: [{ bioguide: 'B001288', reason: 'click timed out' }] });
    expect(hasWorkingRecipe('B001288')).toBe(false);
  });

  it('refuses an office that needs a person', () => {
    asFile({ binds: [], skipped: [{ bioguide: 'M000133', reason: 'needs a challenge' }] });
    expect(hasWorkingRecipe('M000133')).toBe(false);
  });

  // Treating an unreadable file as "everything works" would hand the worker
  // every stale recipe at once.
  it('admits nobody when the results hold no binds', () => {
    asFile({ binds: [] });
    expect(recipeDeliverableIds()).toEqual([]);
    expect(hasWorkingRecipe('C001113')).toBe(false);
  });

  it('refuses an empty or missing id without looking', () => {
    asFile({ binds: ['C001113'] });
    expect(hasWorkingRecipe('')).toBe(false);
    expect(hasWorkingRecipe(null)).toBe(false);
    expect(hasWorkingRecipe(undefined)).toBe(false);
  });
});

/** Offices change their sites, so how old the sweep is matters. */
describe('how stale the sweep is', () => {
  it('reports the age in days', () => {
    asFile({ checkedAt: '2026-11-03T00:00:00.000Z', binds: [] });
    expect(recipeAgeDays(new Date('2026-11-13T00:00:00.000Z'))).toBe(10);
  });

  it('reports null when it has never run', () => {
    asFile({ binds: [] });
    expect(recipeAgeDays(new Date())).toBeNull();
  });
});
