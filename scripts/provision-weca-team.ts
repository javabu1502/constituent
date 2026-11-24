/**
 * Stand up the WECA organization with its four people on one account.
 *
 * Kelly asked for four colleagues to share an account. Before org_members
 * that was not a thing that could be granted: profiles.org_slug is unique and
 * the dashboard read campaigns by creator_id, so a second person at the same
 * organization could only become a second organization. The Children's
 * Cabinet is already two of those.
 *
 * Kelly owns the organization because she is the contact on the agreement and
 * the owner's profile is what carries the name, slug and branding. The other
 * three are members, which is the same access for everything that matters:
 * membership is what the gate reads, not role. Role only decides who may
 * invite and remove.
 *
 * Accounts are created here rather than waiting for each person to sign up,
 * because membership is keyed to a real auth user id. Sign-in is a six-digit
 * code emailed to the address, so a pre-created account is not a credential
 * sitting around: it does nothing until someone who reads that mailbox asks
 * for a code. Addresses are confirmed so the first code works.
 *
 * Idempotent. Safe to re-run.
 *
 * Requires the 20261124000000_org_members migration.
 *
 * Usage:
 *   npx tsx scripts/provision-weca-team.ts           # plan only, writes nothing
 *   npx tsx scripts/provision-weca-team.ts --apply
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mydemocracy.supabase.co';

const ORG_NAME = 'Wisconsin Early Childhood Association';
const ORG_SLUG = 'weca';
const ORG_URL = 'https://wisconsinearlychildhood.org/';

/** Kelly first: the first entry owns the organization. */
const TEAM = [
  { email: 'khook@wisconsinearlychildhood.org', name: 'Kelly Hook', role: 'owner' as const },
  { email: 'pdrew@wisconsinearlychildhood.org', name: 'Paula Drew', role: 'admin' as const },
  { email: 'dschmock@wisconsinearlychildhood.org', name: 'Dana Schmock', role: 'member' as const },
  { email: 'mshipley@wisconsinearlychildhood.org', name: 'Maia Shipley', role: 'member' as const },
];

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
    '  Fill SUPABASE_SECRET_KEY in .env.local, or prefix with SUPABASE_SERVICE_KEY=<key>.'
  );
}

/** The auth user for an address, created only when there is not one already. */
async function ensureUser(
  db: SupabaseClient,
  email: string,
  name: string,
  apply: boolean
): Promise<{ id: string | null; created: boolean }> {
  // listUsers has no address filter, so page until the address turns up.
  for (let page = 1; page <= 20; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
    const hit = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return { id: hit.id, created: false };
    if (!data?.users?.length || data.users.length < 200) break;
  }
  if (!apply) return { id: null, created: true };

  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  return { id: data.user!.id, created: true };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const db = createClient(SUPABASE_URL, serviceKey(), { auth: { persistSession: false } });

  console.log(`${ORG_NAME}  (slug: ${ORG_SLUG})\n`);

  const resolved: { email: string; name: string; role: string; id: string | null; created: boolean }[] = [];
  for (const person of TEAM) {
    const { id, created } = await ensureUser(db, person.email, person.name, apply);
    resolved.push({ ...person, id, created });
    console.log(`  ${person.role.padEnd(6)} ${person.email.padEnd(42)} ${created ? (apply ? 'account created' : 'account WOULD be created') : 'account exists'}`);
  }

  const owner = resolved[0];
  if (!apply) {
    console.log('\nWould then:');
    console.log(`  - mark ${owner.email} as the organization profile (${ORG_NAME})`);
    console.log(`  - add ${resolved.length} membership rows, ${owner.email} as owner`);
    console.log('\nDry run. Nothing written. Re-run with --apply.');
    return;
  }
  if (!owner.id) throw new Error('No owner id resolved.');

  // The owner's profile carries the organization: its name, slug and branding.
  const { error: profErr } = await db.from('profiles').upsert(
    {
      user_id: owner.id,
      name: owner.name,
      account_type: 'organization',
      org_name: ORG_NAME,
      org_slug: ORG_SLUG,
      org_url: ORG_URL,
    },
    { onConflict: 'user_id' }
  );
  if (profErr) throw new Error(`profile upsert: ${profErr.message}`);
  console.log(`\nOrganization profile set on ${owner.email}`);

  for (const person of resolved) {
    if (!person.id) throw new Error(`No id for ${person.email}`);
    const { error } = await db.from('org_members').upsert(
      {
        org_user_id: owner.id,
        member_user_id: person.id,
        role: person.role,
        invited_by: owner.id,
      },
      { onConflict: 'org_user_id,member_user_id' }
    );
    if (error) throw new Error(`org_members ${person.email}: ${error.message}`);
    console.log(`  member: ${person.email} (${person.role})`);
  }

  // Anything Kelly made before the team existed belongs to the organization.
  const { error: campErr } = await db
    .from('campaigns')
    .update({ org_user_id: owner.id })
    .eq('creator_id', owner.id)
    .is('org_user_id', null);
  if (campErr) throw new Error(`campaign backfill: ${campErr.message}`);

  console.log('\nAll four can now sign in at https://www.mydemocracy.app/login');
  console.log('with a code emailed to their own address, and see the same workspace.');
  console.log('\nVerify with: npx tsx scripts/check-org-access.ts wisconsinearlychildhood.org');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
