/**
 * Takedown: the 2026-08 FY27 defense-budget post — published as word salad
 * ("13 unresolved issues, troop pay, procurement, and more, before a final
 * bill lands") with a campaign link that didn't match the story. Root causes
 * fixed on main (commit fcac591: dash-rewrite pass, coherence gate, campaign
 * title in writer context); this removes the live artifact.
 *
 * Run (needs BLUESKY_APP_PASSWORD + SUPABASE_SECRET_KEY — sensitive vars not
 * available via `vercel env pull`, so run where they're set):
 *   npx tsx scripts/takedown-social-2026-08-27.ts          # dry run: show matches
 *   npx tsx scripts/takedown-social-2026-08-27.ts --delete # actually delete
 */
import * as path from 'path';
import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase';
import { createSession, getBlueskyCreds } from '../src/lib/social/bluesky';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const NEEDLE = '13 unresolved issues';
const DELETE = process.argv.includes('--delete');

/**
 * Leftover joke replies from the 08-25 incident — that takedown script never
 * made it into the repo, and a 2026-08-27 public-feed audit confirmed all
 * three audited replies are STILL LIVE, plus a fourth in the same
 * invisible-referent class (replying earnestly to context-free "someone
 * should do something" posts). URIs verified against the live feed 08-27.
 */
const LEFTOVER_REPLY_URIS = [
  'at://did:plc:ckg7cyuly4f4wilw5hdqz7a4/app.bsky.feed.post/3mturmzasur2o', // 08-25 @meik2 "you can be the someone"
  'at://did:plc:ckg7cyuly4f4wilw5hdqz7a4/app.bsky.feed.post/3mtpxf4aagr2u', // 08-23 @niedermeyer
  'at://did:plc:ckg7cyuly4f4wilw5hdqz7a4/app.bsky.feed.post/3mtna7rq4wx2v', // 08-22 @lynn.cat
  'at://did:plc:ckg7cyuly4f4wilw5hdqz7a4/app.bsky.feed.post/3mtg4a2b3rn2y', // 08-19 @eradicatemes (same class)
];

async function xrpcDelete(session: { did: string; accessJwt: string }, uri: string): Promise<void> {
  // at://did:plc:xxx/app.bsky.feed.post/rkey
  const m = /^at:\/\/([^/]+)\/([^/]+)\/(.+)$/.exec(uri);
  if (!m) throw new Error(`unparseable post uri: ${uri}`);
  const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.deleteRecord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessJwt}` },
    body: JSON.stringify({ repo: m[1], collection: m[2], rkey: m[3] }),
  });
  if (!res.ok) throw new Error(`deleteRecord failed: HTTP ${res.status} ${await res.text()}`);
}

async function run(): Promise<void> {
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from('social_posts')
    .select('id, body, status, posted_at, external_post_id, campaign_slug, link_url')
    .eq('status', 'posted')
    .ilike('body', `%${NEEDLE}%`)
    .order('posted_at', { ascending: false });
  if (error) throw new Error(`lookup failed: ${error.message}`);
  const matches = rows ?? [];
  if (!matches.length) console.log(`No posted rows matching "${NEEDLE}" — continuing to the pinned 08-25 leftovers.`);

  for (const row of matches) {
    console.log(`\n[${row.posted_at}] ${row.external_post_id}\n  campaign: ${row.campaign_slug ?? '(none)'} link: ${row.link_url ?? '?'}\n  ${row.body}`);
  }
  if (!DELETE) {
    console.log(`\nPlus ${LEFTOVER_REPLY_URIS.length} pinned leftover replies from the 08-25 incident:`);
    for (const uri of LEFTOVER_REPLY_URIS) console.log(`  ${uri}`);
    console.log(`\nDry run: ${matches.length} match(es) + ${LEFTOVER_REPLY_URIS.length} pinned. Re-run with --delete to remove from Bluesky.`);
    return;
  }

  const creds = getBlueskyCreds();
  if (!creds) throw new Error('BLUESKY_HANDLE / BLUESKY_APP_PASSWORD not set');
  const session = await createSession(creds.handle, creds.appPassword);

  for (const row of matches) {
    if (!row.external_post_id) {
      console.log(`Skipping ${row.id}: no external_post_id recorded`);
      continue;
    }
    await xrpcDelete(session, row.external_post_id as string);
    await admin
      .from('social_posts')
      .update({ status: 'deleted', guardrail_report: { takedown: '2026-08-27 word-salad + link mismatch (fixed in fcac591)' } })
      .eq('id', row.id);
    console.log(`Deleted ${row.external_post_id}`);
  }

  // The 08-25 leftovers (URIs pinned above; already re-verified live).
  for (const uri of LEFTOVER_REPLY_URIS) {
    try {
      await xrpcDelete(session, uri);
      console.log(`Deleted leftover reply ${uri}`);
    } catch (e) {
      // Already gone is success for a takedown.
      console.log(`Leftover reply ${uri}: ${(e as Error).message}`);
    }
    await admin
      .from('social_replies')
      .update({ status: 'deleted', guardrail_report: { takedown: '2026-08-27: 08-25 invisible-referent joke replies, verified still live' } })
      .eq('external_post_id', uri);
  }
}

run().catch((e) => {
  console.error('takedown failed:', e);
  process.exit(1);
});
