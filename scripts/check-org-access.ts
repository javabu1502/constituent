/**
 * Does an org account actually have the org side yet?
 *
 * Two separate things, and the second is the one that gets missed: the
 * profile has to carry account_type 'organization', which is what the
 * dashboard and src/lib/legiscan-access.ts both gate on, AND the user has
 * to have confirmed their email and signed in at least once. An org row
 * pre-inserted before first sign-in looks correct in the database while the
 * person on the other end still cannot get in.
 *
 * Read-only. Writes nothing.
 *
 * Usage:
 *   npx tsx scripts/check-org-access.ts                       # every org account
 *   npx tsx scripts/check-org-access.ts nvchildrenslobby.com  # filter by email substring
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
    '  or prefix the command with SUPABASE_SERVICE_KEY=<the key>.'
  );
}

const when = (v: string | null | undefined) => (v ? new Date(v).toISOString().replace('T', ' ').slice(0, 16) : 'never');

async function main() {
  const filter = process.argv[2]?.toLowerCase();
  const db = createClient(SUPABASE_URL, serviceKey(), { auth: { persistSession: false } });

  const { data: profiles, error } = await db
    .from('profiles')
    .select('user_id, name, org_name, org_about, account_type, created_at')
    .eq('account_type', 'organization');
  if (error) throw new Error(`profiles read failed: ${error.message}`);

  // auth.users is not reachable through the data API; the admin endpoint is.
  const users = new Map<string, { email: string; confirmed: string | null; lastSignIn: string | null }>();
  for (let page = 1; page <= 20; page++) {
    const { data, error: authErr } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (authErr) throw new Error(`auth list failed: ${authErr.message}`);
    for (const u of data.users) {
      users.set(u.id, {
        email: u.email ?? '(no email)',
        confirmed: (u.email_confirmed_at as string | null) ?? null,
        lastSignIn: (u.last_sign_in_at as string | null) ?? null,
      });
    }
    if (data.users.length < 200) break;
  }

  const rows = (profiles ?? [])
    .map((p) => ({ profile: p, auth: users.get(p.user_id as string) }))
    .filter((r) => !filter || (r.auth?.email ?? '').toLowerCase().includes(filter) || String(r.profile.org_name ?? '').toLowerCase().includes(filter))
    .sort((a, b) => String(a.auth?.email ?? '').localeCompare(String(b.auth?.email ?? '')));

  if (rows.length === 0) {
    console.log(filter ? `No organization profile matches "${filter}".` : 'No organization profiles.');
    return;
  }

  console.log(`${rows.length} organization account(s)\n`);
  for (const { profile, auth } of rows) {
    const canSignIn = !!auth?.confirmed;
    const hasSignedIn = !!auth?.lastSignIn;
    const verdict = !auth
      ? 'NO AUTH USER'
      : !canSignIn
        ? 'BLOCKED: email never confirmed'
        : hasSignedIn
          ? 'IN'
          : 'CONFIRMED BUT NEVER SIGNED IN';
    console.log(`${auth?.email ?? '(unknown)'}  ${verdict}`);
    console.log(`  user_id       ${profile.user_id}`);
    console.log(`  account_type  ${profile.account_type}`);
    console.log(`  org_name      ${profile.org_name ?? '(not set)'}`);
    console.log(`  org_about     ${profile.org_about ? `${String(profile.org_about).length} chars` : '(not set)'}`);
    console.log(`  confirmed     ${when(auth?.confirmed)}`);
    console.log(`  last sign in  ${when(auth?.lastSignIn)}`);

    const { count } = await db
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', profile.user_id as string);
    console.log(`  campaigns     ${count ?? 0}`);
    console.log();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
