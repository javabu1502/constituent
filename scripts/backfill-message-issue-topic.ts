/**
 * Backfill messages.issue_topic from the free-text issue_area/issue_subtopic
 * already on each row, using the same normalizer the CWC XML layer uses.
 *
 * Idempotent: only touches rows where issue_topic is null. Run after the
 * 20261103000000_message_issue_topic migration.
 *
 *   npx tsx scripts/backfill-message-issue-topic.ts [--dry]
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { locTopicsForIssueArea } from '../src/lib/cwc/topics';

const dry = process.argv.includes('--dry');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function main(): Promise<void> {
  const { data, error } = await db
    .from('messages')
    .select('id, issue_area, issue_subtopic')
    .is('issue_topic', null);
  if (error) throw new Error(`fetch failed: ${error.message}`);

  const rows = data ?? [];
  console.log(`${rows.length} rows without a topic${dry ? ' (dry run)' : ''}`);

  const counts = new Map<string, number>();
  let written = 0;
  for (const r of rows) {
    const topic = locTopicsForIssueArea(
      r.issue_area as string | null,
      undefined,
      (r.issue_subtopic as string | null) ?? undefined,
    )[0];
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
    if (dry) continue;
    const { error: upErr } = await db.from('messages').update({ issue_topic: topic }).eq('id', r.id);
    if (upErr) {
      console.error(`  ${r.id}: ${upErr.message}`);
      continue;
    }
    written++;
  }

  console.log([...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `  ${String(n).padStart(4)}  ${t}`).join('\n'));
  if (!dry) console.log(`updated ${written} rows`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
