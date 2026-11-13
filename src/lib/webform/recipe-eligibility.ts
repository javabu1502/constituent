import * as fs from 'fs';
import * as path from 'path';

/**
 * Which offices we can file for by following a recipe.
 *
 * The older path needed a page we had hand-verified as holding a message
 * form, which got us seven senators. This one follows a step-by-step
 * definition of the office's own form, which exists for all forty-seven
 * senators who are not on Communicating With Congress.
 *
 * Eligibility is not "a definition exists". It is "a definition was walked
 * against the live page and still binds", recorded by
 * scripts/contact-form-dryrun.ts. Several definitions were last touched in
 * 2023, and a stale one does not announce itself: it fills nothing and the
 * page still answers 200.
 *
 * No browser code here, so route handlers can ask the question cheaply.
 */
interface DryRunFile {
  checkedAt?: string;
  binds?: string[];
  stale?: Array<{ bioguide: string; reason: string }>;
  skipped?: Array<{ bioguide: string; reason: string }>;
}

let cache: DryRunFile | null = null;

/**
 * Test seam, matching setWebformQueueClientFactory and setCwcNotifiers
 * elsewhere. The file cannot be stubbed directly: fs is an ESM namespace and
 * cannot be spied on.
 */
export function setRecipeResults(data: DryRunFile | null): void {
  cache = data;
}

function results(): DryRunFile {
  if (cache) return cache;
  try {
    const file = path.join(process.cwd(), 'src', 'data', 'contact-form-dryrun.json');
    cache = JSON.parse(fs.readFileSync(file, 'utf-8')) as DryRunFile;
  } catch {
    // No results means nothing is eligible. Treating an unreadable file as
    // "everything works" would hand the worker every stale recipe at once.
    cache = { binds: [] };
  }
  return cache;
}

/** Bioguide ids whose form was confirmed to still bind on the last sweep. */
export function recipeDeliverableIds(): string[] {
  return results().binds ?? [];
}

export function hasWorkingRecipe(bioguide: string | null | undefined): boolean {
  if (!bioguide) return false;
  return recipeDeliverableIds().includes(bioguide);
}

/** When the sweep last ran, so a stale answer can be spotted. */
export function recipesCheckedAt(): string | null {
  return results().checkedAt ?? null;
}

/**
 * How old the sweep is, in days, or null when it has never run.
 *
 * Offices change their sites. A sweep that has not run in a long time is a
 * reason to re-check rather than to keep sending, and the worker says so in
 * its logs rather than discovering it one failed letter at a time.
 */
export function recipeAgeDays(now: Date = new Date()): number | null {
  const at = recipesCheckedAt();
  if (!at) return null;
  const ms = now.getTime() - new Date(at).getTime();
  return Math.floor(ms / 86_400_000);
}

/** Forget whatever was loaded or injected. */
export function resetRecipeCache(): void {
  cache = null;
}
