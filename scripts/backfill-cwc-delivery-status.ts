/**
 * One-time backfill: write the real delivery outcome onto message rows that
 * predate the messageId plumbing.
 *
 * Until 2026-10-23 a queue row carried no `delivery.messageId`, so when the
 * drain settled a delivery it had nothing to write the outcome back to. All
 * 12 production queue rows were enqueued before that, which leaves 13
 * `messages` rows reading `cwc_submitted` ("Sending to Congress") forever,
 * including 10 that the office actually accepted and 2 it refused.
 *
 * Matching is exact, not fuzzy: the message's own legislator resolves to a
 * CWC office code, and that code plus the sender's email identifies the queue
 * row. A message with no matching queue row is left alone and reported, since
 * a guess here would tell a person their letter arrived when it did not.
 *
 * Dry run by default. Pass --apply to write.
 *
 *   npx tsx scripts/backfill-cwc-delivery-status.ts
 *   npx tsx scripts/backfill-cwc-delivery-status.ts --apply
 */
import dotenv from 'dotenv';
dotenv.config({ path: process.env.CWC_ENV_FILE ?? '.env.local' });

import { createAdminClient } from '../src/lib/supabase';
import { CWC_MESSAGE_STATUS } from '../src/lib/cwc/message-status';
import { resolveOfficeCode } from '../src/lib/cwc/offices';
import { getAllFederalLegislators } from '../src/lib/legislators';
import type { Official } from '../src/lib/types';

const APPLY = process.argv.includes('--apply');

const QUEUE_TO_MESSAGE: Record<string, string> = {
  sent: CWC_MESSAGE_STATUS.delivered,
  refused: CWC_MESSAGE_STATUS.refused,
  failed: CWC_MESSAGE_STATUS.failed,
};

async function main() {
  const db = createAdminClient();

  const { data: queueRows, error: qErr } = await db
    .from('cwc_send_queue')
    .select('id, status, office_code, delivery')
    .in('status', Object.keys(QUEUE_TO_MESSAGE));
  if (qErr) throw new Error(`queue read failed: ${qErr.message}`);

  // (email, office code) -> outcome. A sender who wrote to the same office
  // twice would be ambiguous; report rather than pick one.
  const byKey = new Map<string, { status: string; queueId: number }[]>();
  for (const r of queueRows ?? []) {
    const email = ((r.delivery as { constituent?: { email?: string } })?.constituent?.email ?? '').trim().toLowerCase();
    if (!email || !r.office_code) continue;
    const key = `${email}|${r.office_code}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push({ status: r.status as string, queueId: r.id as number });
  }

  const { data: msgs, error: mErr } = await db
    .from('messages')
    .select('id, advocate_email, legislator_id, legislator_name, delivery_status, created_at')
    .in('delivery_status', ['cwc_submitted', 'webform_submitted'])
    .order('created_at');
  if (mErr) throw new Error(`messages read failed: ${mErr.message}`);

  const roster = getAllFederalLegislators() as unknown as Official[];
  const byId = new Map(roster.map((l) => [l.id, l]));

  let written = 0;
  const unmatched: string[] = [];
  const ambiguous: string[] = [];

  for (const m of msgs ?? []) {
    const email = (m.advocate_email as string | null)?.trim().toLowerCase() ?? '';
    const official = byId.get(m.legislator_id as string);
    const code = official ? resolveOfficeCode(official) : { ok: false as const, reason: 'not on the roster' };
    if (!email || !code.ok) {
      unmatched.push(`${String(m.id).slice(0, 8)} ${m.legislator_name} (${code.ok ? 'no sender email' : code.reason})`);
      continue;
    }
    const hits = byKey.get(`${email}|${code.code}`) ?? [];
    if (hits.length === 0) {
      unmatched.push(`${String(m.id).slice(0, 8)} ${m.legislator_name} -> ${code.code} (no queue row)`);
      continue;
    }
    if (new Set(hits.map((h) => h.status)).size > 1) {
      ambiguous.push(`${String(m.id).slice(0, 8)} ${m.legislator_name} -> ${code.code} (${hits.map((h) => h.status).join('/')})`);
      continue;
    }
    const target = QUEUE_TO_MESSAGE[hits[0].status];
    console.log(`${APPLY ? 'WRITE' : 'would write'} ${String(m.id).slice(0, 8)} ${String(m.legislator_name).padEnd(22)} ${code.code} ${m.delivery_status} -> ${target} (queue #${hits[0].queueId})`);
    if (APPLY) {
      const { error } = await db.from('messages').update({ delivery_status: target }).eq('id', m.id);
      if (error) console.error(`  FAILED: ${error.message}`);
      else written++;
    }
  }

  console.log(`\n${APPLY ? `wrote ${written}` : 'dry run, nothing written'}`);
  if (ambiguous.length) console.log(`\nambiguous, left alone:\n  ${ambiguous.join('\n  ')}`);
  if (unmatched.length) {
    console.log(`\nno queue row, left reading "Sending to Congress":\n  ${unmatched.join('\n  ')}`);
    console.log('  These were never enqueued. Leaving them is correct: the outcome is genuinely unknown.');
  }
  if (!APPLY) console.log('\nRe-run with --apply to write.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
