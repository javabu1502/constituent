/**
 * Are the live weigh-ins still live questions?
 *
 * A weigh-in asks "Should Congress pass X?". Once X becomes law, is vetoed or
 * fails, the question is answered and asking it makes the site look abandoned.
 * Nothing watched for that: the 2026-11-04 audit found two enacted bills still
 * on /issues, one of them public law since July.
 *
 * Reports by default. --apply closes the resolved ones the way the product
 * closes a campaign: status 'paused' with an outcome and the note from
 * Congress itself, never a delete, so every story, consent record and whip
 * position survives.
 *
 *   npx tsx scripts/audit-weigh-in-freshness.ts [--apply]
 *
 * Only federal weigh-ins carrying congress/type/number can be checked here.
 * State bills have no national API; they are listed as unchecked so a human
 * knows what this did not cover.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const apply = process.argv.includes('--apply');
const CONGRESS_KEY = process.env.CONGRESS_API_KEY;

/**
 * Credentials are read when the script runs, not when it loads, so
 * verdictFor() can be imported and tested without a database or an API key.
 */
function connect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.');
  if (!process.env.CONGRESS_API_KEY) throw new Error('CONGRESS_API_KEY is required to read bill status.');
  return createClient(url, key, { auth: { persistSession: false } });
}

type Verdict = 'law' | 'vetoed' | 'failed' | 'pending';

/** Read the verdict out of the bill's own latest action. */
export function verdictFor(latestAction: string | null | undefined): Verdict {
  const t = (latestAction ?? '').toLowerCase();
  if (/became public law|became law|signed by president/.test(t)) return 'law';
  if (/vetoed/.test(t)) return 'vetoed';
  // "Failed of passage", "motion to proceed ... not agreed to", "rejected by".
  if (/failed of passage|failed to pass|rejected by|not agreed to/.test(t)) return 'failed';
  return 'pending';
}

/** What a resolved weigh-in records as its outcome. */
const OUTCOME: Record<Exclude<Verdict, 'pending'>, 'passed' | 'failed' | 'vetoed'> = {
  law: 'passed',
  vetoed: 'vetoed',
  failed: 'failed',
};

interface Row {
  slug: string;
  headline: string;
  bill_ref: string | null;
  bill_congress: number | null;
  bill_type: string | null;
  bill_number: string | null;
  bill_level: string | null;
  action_count: number | null;
}

async function latestActionFor(r: Row): Promise<string | null> {
  const url = `https://api.congress.gov/v3/bill/${r.bill_congress}/${r.bill_type}/${r.bill_number}?format=json&api_key=${CONGRESS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`congress.gov ${res.status}`);
  const body = (await res.json()) as { bill?: { latestAction?: { text?: string; actionDate?: string } } };
  const la = body.bill?.latestAction;
  return la?.text ? `${la.text}${la.actionDate ? ` (${la.actionDate})` : ''}` : null;
}

async function main(): Promise<void> {
  const db = connect();
  const { data, error } = await db
    .from('campaigns')
    .select('slug, headline, bill_ref, bill_congress, bill_type, bill_number, bill_level, action_count')
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .eq('visibility', 'public')
    .eq('campaign_type', 'advocacy')
    .is('is_official', true);
  if (error) throw new Error(`fetch failed: ${error.message}`);

  const rows = (data ?? []) as Row[];
  const checkable = rows.filter((r) => r.bill_congress && r.bill_type && r.bill_number);
  const unchecked = rows.filter((r) => !(r.bill_congress && r.bill_type && r.bill_number));

  console.log(`${rows.length} live weigh-ins; ${checkable.length} checkable against congress.gov.\n`);

  const resolved: { row: Row; verdict: Exclude<Verdict, 'pending'>; note: string }[] = [];
  for (const row of checkable) {
    let note: string | null;
    try {
      note = await latestActionFor(row);
    } catch (e) {
      console.log(`  ?  ${row.bill_ref ?? row.slug}: could not read status (${(e as Error).message})`);
      continue;
    }
    const v = verdictFor(note);
    if (v !== 'pending') resolved.push({ row, verdict: v, note: note ?? v });
    // congress.gov allows 5,000/hour; this keeps a wide margin.
    await new Promise((r) => setTimeout(r, 120));
  }

  if (resolved.length === 0) {
    console.log('Every checkable weigh-in is still an open question.');
  } else {
    console.log(`${resolved.length} weigh-in${resolved.length === 1 ? '' : 's'} asking a question that has been answered:\n`);
    for (const { row, verdict, note } of resolved) {
      console.log(`  [${verdict.toUpperCase()}] ${row.bill_ref ?? '(no ref)'} — ${row.headline}`);
      console.log(`         ${note}`);
      console.log(`         actions: ${row.action_count ?? 0}  slug: ${row.slug}`);
    }
  }

  if (unchecked.length) {
    console.log(`\n${unchecked.length} not checked (no congress/type/number — state bills and ballot measures):`);
    for (const r of unchecked) console.log(`  ${r.bill_level ?? 'federal'}  ${r.bill_ref ?? '—'}  ${r.headline.slice(0, 60)}`);
  }

  if (!apply) {
    if (resolved.length) console.log('\nRe-run with --apply to close these. Nothing was changed.');
    return;
  }

  for (const { row, verdict, note } of resolved) {
    const { error: upErr } = await db
      .from('campaigns')
      .update({ status: 'paused', outcome: OUTCOME[verdict], outcome_note: note.replace(/\.$/, '') })
      .eq('slug', row.slug);
    console.log(upErr ? `  FAILED ${row.slug}: ${upErr.message}` : `  closed ${row.slug} (${OUTCOME[verdict]})`);
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
