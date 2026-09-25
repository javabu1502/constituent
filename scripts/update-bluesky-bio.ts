/**
 * One-shot: update the Bluesky profile bio (description) with the AI disclosure.
 * Preserves displayName/avatar/banner — only the description changes.
 *
 * Needs BLUESKY_HANDLE + BLUESKY_APP_PASSWORD in the environment.
 *   vercel env pull .env.local --environment=production   # if not already local
 *   npx tsx scripts/update-bluesky-bio.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PDS = 'https://bsky.social/xrpc';
const NEW_BIO =
  'MyDemocracy — nonpartisan civic engagement. Weigh in on what your reps are deciding → mydemocracy.app. This account is AI-assisted and human-overseen.';

async function main() {
  const identifier = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!identifier || !password) {
    console.error('Missing BLUESKY_HANDLE / BLUESKY_APP_PASSWORD in env.');
    process.exit(1);
  }

  // 1. Auth
  const sessRes = await fetch(`${PDS}/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const sess = await sessRes.json();
  if (!sessRes.ok) throw new Error(`auth failed: ${JSON.stringify(sess)}`);
  const { accessJwt, did } = sess as { accessJwt: string; did: string };

  // 2. Read the existing profile record (preserve everything but description)
  const getRes = await fetch(
    `${PDS}/com.atproto.repo.getRecord?repo=${did}&collection=app.bsky.actor.profile&rkey=self`,
    { headers: { Authorization: `Bearer ${accessJwt}` } },
  );
  const existing = getRes.ok ? await getRes.json() : null;
  const prev = (existing?.value as Record<string, unknown>) ?? { $type: 'app.bsky.actor.profile' };

  // 3. Write it back with the new description
  const record = { ...prev, $type: 'app.bsky.actor.profile', description: NEW_BIO };
  const putRes = await fetch(`${PDS}/com.atproto.repo.putRecord`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessJwt}` },
    body: JSON.stringify({ repo: did, collection: 'app.bsky.actor.profile', rkey: 'self', record }),
  });
  const out = await putRes.json();
  if (!putRes.ok) throw new Error(`putRecord failed: ${JSON.stringify(out)}`);

  console.log('✓ Bio updated to:\n  ' + NEW_BIO);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
