/**
 * Brand brain loader.
 *
 * The brand brain is the operational config every stage of the Social Desk
 * reads before acting — voice rules, the four non-negotiables, lanes,
 * guardrails, approved examples. Jared steers the whole account by editing it.
 *
 * Two sources, in priority order:
 *   1. A live override in Supabase (social_config key 'brand_brain') — edit
 *      the row and the next run picks it up with no deploy.
 *   2. The version-controlled copy vendored into the repo (brand-brain.md),
 *      which ships with the agent and is the source of truth / fallback.
 *
 * Keeping the file in-repo means the deployed agent can always load it even
 * with no DB override set; the DB override exists for fast, deploy-free edits.
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { createAdminClient } from '@/lib/supabase';

let repoCache: string | null = null;

async function loadFromRepo(): Promise<string> {
  if (repoCache) return repoCache;
  const p = path.join(process.cwd(), 'src/lib/social/brand-brain.md');
  repoCache = await readFile(p, 'utf8');
  return repoCache;
}

async function loadOverride(): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('social_config')
      .select('value')
      .eq('key', 'brand_brain')
      .maybeSingle();
    if (error || !data) return null;
    const text = (data.value as { text?: string } | null)?.text;
    return typeof text === 'string' && text.trim().length > 0 ? text : null;
  } catch {
    return null;
  }
}

/**
 * Returns the active brand brain text. Prefers the Supabase override, falls
 * back to the in-repo copy. Never throws for the override — a DB hiccup just
 * means we run on the committed version.
 */
export async function loadBrandBrain(): Promise<string> {
  const override = await loadOverride();
  if (override) return override;
  return loadFromRepo();
}
