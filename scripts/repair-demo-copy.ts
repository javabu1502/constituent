/**
 * Bring the already-seeded demo campaigns in line with the copy rules.
 *
 * The seed scripts were fixed, which only helps the next person who runs
 * them. These rows were written months ago and are what a walkthrough
 * actually opens on, including "every step in Carson City, join the push at
 * the stage that matters right now".
 *
 * Only demo- rows, matched by exact current text, so re-running it is a
 * no-op and a row somebody has since edited by hand is left alone rather
 * than overwritten.
 *
 * Usage:
 *   npx tsx scripts/repair-demo-copy.ts           # shows what it would do
 *   npx tsx scripts/repair-demo-copy.ts --apply   # writes
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mydemocracy.supabase.co';

function serviceKey(): string {
  const fromEnv = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (fromEnv && fromEnv !== '...') return fromEnv;
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    for (const name of ['SUPABASE_SERVICE_KEY', 'SUPABASE_SECRET_KEY']) {
      const m = envFile.match(new RegExp(`^${name}=["']?([^"'\n]+)`, 'm'));
      if (m?.[1]?.trim()) return m[1].trim();
    }
  } catch {
    // fall through
  }
  throw new Error(
    'No service key.\n' +
    '  Either fill SUPABASE_SECRET_KEY in .env.local (it is there but empty),\n' +
    '  or prefix the command with SUPABASE_SERVICE_KEY=<the key>.\n' +
    '  Supabase dashboard, Project Settings, API keys, service_role.'
  );
}

/** field -> [exact current value, replacement]. Exact, so this is idempotent. */
const FIXES: Array<{ slug: string; field: 'headline' | 'description'; from: string; to: string }> = [
  {
    slug: 'demo-ab156-parent',
    field: 'description',
    from: 'AB 156 would provide free school breakfast to every K-12 student in Nevada. We are following it through every step in Carson City — join the push at the stage that matters right now.',
    to: 'AB 156 would provide free school breakfast to every K-12 student in Nevada. We are following it through every vote in Carson City. Join the action that matters right now.',
  },
  {
    slug: 'demo-ab156-assembly-floor',
    field: 'headline',
    from: 'AB 156 heads to the Assembly floor — ask for a YES',
    to: 'AB 156 heads to the Assembly floor: ask for a YES',
  },
  {
    slug: 'demo-ab156-thanks',
    field: 'headline',
    from: 'AB 156 passed — thank your legislators',
    to: 'AB 156 passed: thank your legislators',
  },
];

async function main() {
  const apply = process.argv.includes('--apply');
  const db = createClient(SUPABASE_URL, serviceKey(), { auth: { persistSession: false } });

  // Anything else on a demo row that still carries a dash, so the report is
  // the whole truth rather than only the cases listed above.
  const { data: all } = await db
    .from('campaigns')
    .select('slug, headline, description')
    .like('slug', 'demo-%');
  const stragglers = (all ?? []).filter(
    (c) => /[—–]/.test(String(c.headline ?? '')) || /[—–]/.test(String(c.description ?? '')),
  );

  let changed = 0;
  for (const fix of FIXES) {
    const { data: row } = await db
      .from('campaigns')
      .select(`slug, ${fix.field}`)
      .eq('slug', fix.slug)
      .maybeSingle();

    if (!row) {
      console.log(`  skip   ${fix.slug}: no such campaign`);
      continue;
    }
    const current = String((row as Record<string, unknown>)[fix.field] ?? '');
    if (current !== fix.from) {
      console.log(`  skip   ${fix.slug}.${fix.field}: already changed, leaving it alone`);
      continue;
    }
    console.log(`  ${apply ? 'write ' : 'would '} ${fix.slug}.${fix.field}`);
    console.log(`           - ${fix.from.slice(0, 100)}`);
    console.log(`           + ${fix.to.slice(0, 100)}`);
    if (apply) {
      const { error } = await db.from('campaigns').update({ [fix.field]: fix.to }).eq('slug', fix.slug);
      if (error) {
        console.error(`  FAILED ${fix.slug}: ${error.message}`);
        continue;
      }
    }
    changed++;
  }

  console.log(`\n${apply ? 'wrote' : 'would write'} ${changed} of ${FIXES.length}`);
  const remaining = stragglers.filter((s) => !FIXES.some((f) => f.slug === s.slug));
  if (remaining.length) {
    console.log(`\n${remaining.length} other demo row(s) still carry a dash:`);
    for (const r of remaining) console.log(`  ${r.slug}`);
  }
  if (!apply) console.log('\nNothing was written. Re-run with --apply.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
