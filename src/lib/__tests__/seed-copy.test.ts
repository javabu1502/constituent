import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * The demo campaigns are the product, for anyone being walked through it.
 *
 * Every rule about product copy was applied to the app's chrome and not to
 * the data the app is demonstrated with, so a walkthrough opened on "every
 * step in Carson City, join the push at the stage that matters right now":
 * an em dash, the word this product stopped calling a step, and the word it
 * stopped calling a stage, in one sentence, on the page shown to funders.
 *
 * Fixing the strings does nothing on its own, because the next seed script
 * is written by whoever is writing it. This is the part that holds.
 *
 * Scope is deliberately the re-runnable demo seeds. The one-off
 * create-weigh-in-batch-*.ts files are records of campaigns already
 * published; their copy is a content decision, not a build failure.
 */
const SEED_DIR = join(process.cwd(), 'scripts');

/** Fields whose value a person reads on screen. */
const COPY_FIELD = /\b(headline|description|desc|title|ask|story_prompt|usage_statement)\s*:\s*'((?:[^'\\]|\\.)*)'/g;

function seedFiles(): string[] {
  return readdirSync(SEED_DIR)
    .filter((f) => /^seed-.*\.ts$/.test(f) || f === 'enrich-demo-walkthrough.ts')
    .map((f) => join(SEED_DIR, f));
}

function copyStrings(file: string): string[] {
  const src = readFileSync(file, 'utf-8');
  const out: string[] = [];
  for (const m of src.matchAll(COPY_FIELD)) out.push(m[2]);
  return out;
}

describe('demo seed copy follows the same rules as the product', () => {
  const files = seedFiles();

  it('finds the seed scripts', () => {
    expect(files.length).toBeGreaterThan(3);
  });

  it('uses no em or en dashes', () => {
    const bad: string[] = [];
    for (const f of files) {
      for (const s of copyStrings(f)) {
        if (/[—–]/.test(s)) bad.push(`${f.split('/').pop()}: ${s.slice(0, 90)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  // An action is an action everywhere, including in the data we demo with.
  it('does not call an advocacy action a step or a stage', () => {
    const bad: string[] = [];
    for (const f of files) {
      for (const s of copyStrings(f)) {
        if (/\b(steps?|stages?)\b/i.test(s)) bad.push(`${f.split('/').pop()}: ${s.slice(0, 90)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
