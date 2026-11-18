/**
 * Give the public demo a stop for every feature shipped on 2026-11-17.
 *
 * The demo had eleven campaigns and none of them exercised the new fields, so
 * a walkthrough could show the dashboard and the hub but not the ask, the
 * redirect, the story questions, or what an action looks like on a campaign
 * that has no bill. This fills those gaps and nothing else.
 *
 * It does NOT fabricate participation. Counts on a demo campaign come from
 * real rows in campaign_actions seeded by the earlier scripts; inventing
 * numbers here would put figures on screen that no row supports, which is the
 * one thing a demo must not do when it is being shown to a prospect.
 *
 * Idempotent: every write is keyed on a demo- slug and re-running changes
 * nothing that is already correct.
 *
 * Usage: npx tsx scripts/enrich-demo-walkthrough.ts
 * Reads the service key from .env.local (SUPABASE_SECRET_KEY), or from
 * SUPABASE_SERVICE_KEY in the environment.
 */

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { DEMO_ORG_USER_ID } from '../src/lib/demo';
import { checkRedirectTarget } from '../src/lib/redirect-target';

const SUPABASE_URL = 'https://mydemocracy.supabase.co';

// Accept either name, and fall back to .env.local, so the key need not be
// typed onto the command line where it lands in shell history.
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
    // no .env.local to read; fall through to the message
  }
  throw new Error(
    'No service key.\n' +
    '  Either fill SUPABASE_SECRET_KEY in .env.local (it is there but empty),\n' +
    '  or prefix the command with SUPABASE_SERVICE_KEY=<the key>.\n' +
    '  Supabase dashboard, Project Settings, API keys, service_role.'
  );
}
const key = serviceKey();
const db = createClient(SUPABASE_URL, key, { auth: { persistSession: false } });

/** One sentence an organisation would write and the goal alone cannot say. */
const ASKS: Record<string, string> = {
  'demo-fed-hr2184-school-meals':
    'Vote yes on H.R. 2184 when it reaches the floor, and say so publicly before the markup.',
  'demo-ab156-breakfast': 'Vote yes on AB 156 and ask leadership to schedule it this session.',
};

/** Asked after a story is written, and every one is skippable. */
const STORY_QUESTIONS = [
  { id: 'q-county', text: 'Which county do you live in?' },
  { id: 'q-children', text: 'Roughly how many children in your household does this affect?' },
  { id: 'q-months', text: 'How long have you been waiting for a child care slot?' },
];

async function main() {
  const { data: profile } = await db
    .from('profiles')
    .select('org_url, org_about')
    .eq('user_id', DEMO_ORG_USER_ID)
    .maybeSingle();

  const { data: campaigns, error } = await db
    .from('campaigns')
    .select('id, slug, headline, campaign_type, bill_ref, parent_campaign_id, target_level, bill_state, status')
    .eq('creator_id', DEMO_ORG_USER_ID)
    .like('slug', 'demo-%');
  if (error) throw error;
  const all = campaigns ?? [];
  const parents = all.filter((c) => !c.parent_campaign_id);
  const childrenOf = new Set(all.filter((c) => c.parent_campaign_id).map((c) => c.parent_campaign_id));

  // 1. An About for the demo org. The public org page shows it and had
  //    nothing to show.
  if (!profile?.org_about) {
    await db
      .from('profiles')
      .update({
        org_about:
          'Silver State Families Alliance works with Nevada parents, providers and educators on child care, early education and school nutrition. We are a fictional coalition used for this demo.',
      })
      .eq('user_id', DEMO_ORG_USER_ID);
    console.log('set org_about');
  }

  // 2. A redirect, on a host the organisation owns. Run through the same
  //    check the API uses so the demo cannot hold a value the product would
  //    refuse.
  const orgUrl = profile?.org_url ?? null;
  if (orgUrl) {
    const target = `${orgUrl.replace(/\/+$/, '')}/thank-you`;
    const check = checkRedirectTarget(target, { orgUrl, customDomain: null });
    if (check.ok) {
      const { error: e } = await db
        .from('campaigns')
        .update({ redirect_url: check.url })
        .eq('slug', 'demo-fed-hr2184-school-meals')
        .is('redirect_url', null);
      if (!e) console.log('set redirect_url ->', check.url);
    } else {
      console.log('redirect skipped:', check.reason);
    }
  } else {
    console.log('redirect skipped: the demo org has no org_url to anchor it to');
  }

  // 3. The ask, where an organisation would plainly have written one.
  for (const [slug, ask] of Object.entries(ASKS)) {
    const { error: e } = await db.from('campaigns').update({ ask }).eq('slug', slug).is('ask', null);
    if (!e) console.log('set ask on', slug);
  }

  // 4. Questions on the storytelling campaign.
  const story = parents.find((c) => c.campaign_type === 'storytelling');
  if (story) {
    await db
      .from('campaigns')
      .update({ story_questions: STORY_QUESTIONS })
      .eq('id', story.id)
      .is('story_questions', null);
    console.log('set story_questions on', story.slug);
  }

  // 5. An action on every campaign that has none. A campaign with no bill is
  //    only its actions, so one with zero of them is the emptiest page in the
  //    product and exactly what a walkthrough should not open on.
  for (const p of parents) {
    if (p.campaign_type === 'storytelling' || childrenOf.has(p.id)) continue;
    const slug = `${p.slug}-action-1`;
    const { data: exists } = await db.from('campaigns').select('id').eq('slug', slug).maybeSingle();
    if (exists) continue;

    const { error: e } = await db.from('campaigns').insert({
      creator_id: DEMO_ORG_USER_ID,
      parent_campaign_id: p.id,
      slug,
      // No bill means no legislative stage to aim at, so the goal is custom
      // and the headline carries the ask.
      stage_goal: p.bill_ref ? 'committee' : 'custom',
      campaign_type: 'advocacy',
      headline: p.bill_ref
        ? `Ask the committee to hear ${p.bill_ref}`
        : `Write to your state legislators about ${p.headline?.toLowerCase() ?? 'this'}`,
      description: p.headline ?? '',
      issue_area: 'Families & Children',
      target_level: p.target_level ?? 'state',
      bill_state: p.bill_state ?? null,
      direction: 'support',
      visibility: 'unlisted',
      status: 'active',
      approval_status: 'approved',
      action_count: 0,
      story_count: 0,
    });
    if (e) console.log('action insert failed for', p.slug, e.message);
    else console.log('added an action to', p.slug);
  }

  console.log('\ndone. Nothing above invents participation: counts still come from real campaign_actions rows.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
