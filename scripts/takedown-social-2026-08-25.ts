/**
 * One-shot takedown for the 2026-08-25 social audit:
 *  - the 08-24 "Three things that moved today" brief whose bullets were
 *    year-old events hallucinated from model training data (Dr. Oz CMS
 *    confirmation etc.), and
 *  - three replies drafted with no thread context that earnestly answered
 *    sarcasm/jokes (@meik2 Canadian Tire hats, @niedermeyer cardio,
 *    @lynn.cat blind quote-post).
 *
 * Deletes each post from Bluesky, then marks the DB row status 'deleted'.
 *
 * Needs BLUESKY_HANDLE + BLUESKY_APP_PASSWORD + SUPABASE_SECRET_KEY in env
 * (the app password is a sensitive Vercel var — paste it into .env.local or
 * the shell before running):
 *   npx tsx scripts/takedown-social-2026-08-25.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PDS = 'https://bsky.social/xrpc';
const SUPABASE_URL = 'https://mydemocracy.supabase.co';

const TARGETS: Array<{ table: 'social_posts' | 'social_replies'; rowId: string; uri: string; why: string }> = [
  {
    table: 'social_posts',
    rowId: '20fddcf6-8eae-48b3-91f3-7ccd9a8d5b4c',
    uri: 'at://did:plc:ckg7cyuly4f4wilw5hdqz7a4/app.bsky.feed.post/3mts7lenoqz2y',
    why: 'stale brief: 2025 events posted as today',
  },
  {
    table: 'social_replies',
    rowId: '703d6ed2-0ac7-449f-af46-7b81669df544',
    uri: 'at://did:plc:ckg7cyuly4f4wilw5hdqz7a4/app.bsky.feed.post/3mturmzasur2o',
    why: 'earnest reply to sarcasm (@meik2, Canadian Tire hats)',
  },
  {
    table: 'social_replies',
    rowId: '38df4314-24a7-4f1e-b66b-87d0b14ef55b',
    uri: 'at://did:plc:ckg7cyuly4f4wilw5hdqz7a4/app.bsky.feed.post/3mtpxf4aagr2u',
    why: 'earnest reply to joke (@niedermeyer, cardio)',
  },
  {
    table: 'social_replies',
    rowId: 'e3f0af07-131a-4649-823d-95acfa5bed8c',
    uri: 'at://did:plc:ckg7cyuly4f4wilw5hdqz7a4/app.bsky.feed.post/3mtna7rq4wx2v',
    why: 'reply to quote-post whose substance was invisible (@lynn.cat)',
  },
];

async function main() {
  const identifier = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!identifier || !password || !supabaseKey) {
    console.error('Missing BLUESKY_HANDLE / BLUESKY_APP_PASSWORD / SUPABASE_SECRET_KEY in env.');
    process.exit(1);
  }

  const sessRes = await fetch(`${PDS}/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const sess = (await sessRes.json()) as { accessJwt: string; did: string };
  if (!sessRes.ok) throw new Error(`auth failed: ${JSON.stringify(sess)}`);

  for (const t of TARGETS) {
    const rkey = t.uri.split('/').pop()!;
    const delRes = await fetch(`${PDS}/com.atproto.repo.deleteRecord`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sess.accessJwt}` },
      body: JSON.stringify({ repo: sess.did, collection: 'app.bsky.feed.post', rkey }),
    });
    if (!delRes.ok) {
      console.error(`FAILED to delete ${t.uri}: ${await delRes.text()}`);
      continue;
    }
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/${t.table}?id=eq.${t.rowId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ status: 'deleted' }),
    });
    console.log(`deleted ${t.uri} (${t.why}) — db ${t.table} ${dbRes.ok ? 'updated' : 'UPDATE FAILED'}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
