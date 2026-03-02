/**
 * Seed script for pre-built campaign pages.
 *
 * Inserts 5 curated campaigns covering hot political topics into Supabase.
 * Uses the admin (service-role) client to bypass RLS. A dedicated
 * "system" creator_id is used so the campaigns are not tied to any
 * individual user account.
 *
 * Usage:
 *   npx tsx scripts/seed-campaigns.ts
 *
 * Environment variables required (reads from .env.local automatically):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 */

import * as path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ---------------------------------------------------------------------------
// Supabase admin client
// ---------------------------------------------------------------------------

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.\n' +
    'Make sure your .env.local (or .env) file contains both variables.'
  );
  process.exit(1);
}

const admin = createClient(url, key);

// ---------------------------------------------------------------------------
// System creator UUID
// ---------------------------------------------------------------------------
// This is a deterministic UUID used as the creator_id for all pre-built
// campaigns. It does not correspond to a real auth user; it simply marks
// these campaigns as system-created so they are easy to identify.
const SYSTEM_CREATOR_ID = '00000000-0000-0000-0000-000000000000';

// ---------------------------------------------------------------------------
// Campaign definitions
// ---------------------------------------------------------------------------

interface SeedCampaign {
  slug: string;
  headline: string;
  description: string;
  issue_area: string;
  issue_subtopic: string | null;
  target_level: 'federal' | 'state' | 'both';
  message_template: string;
}

const CAMPAIGNS: SeedCampaign[] = [
  {
    slug: 'authorize-military-force-demand-congress-vote-on-iran',
    headline: 'Authorize Military Force: Demand Congress Vote on Iran',
    description:
      'The Constitution gives Congress — not the President — the power to declare war. ' +
      'Before any expansion of military operations in Iran, demand that your representatives ' +
      'hold a formal vote under the War Powers Act. No more blank checks for open-ended conflict.',
    issue_area: 'Armed Forces and National Security',
    issue_subtopic: 'Military Funding',
    target_level: 'federal',
    message_template:
      'I urge you to reassert congressional war powers authority by requiring a full floor vote ' +
      'before any expansion of military operations in Iran. The American people deserve a say ' +
      'through their elected representatives before our nation commits to further military engagement.',
  },
  {
    slug: 'protect-healthcare-restore-aca-subsidies',
    headline: 'Protect Healthcare: Restore ACA Subsidies',
    description:
      'Millions of Americans are at risk of losing affordable health coverage as enhanced ' +
      'Affordable Care Act subsidies expire. Without action, premiums could spike by hundreds ' +
      'of dollars per month. Tell Congress to restore and extend ACA subsidies before families are priced out.',
    issue_area: 'Health',
    issue_subtopic: 'ACA/Obamacare',
    target_level: 'federal',
    message_template:
      'I urge you to act immediately to restore and extend enhanced ACA subsidies. Letting them ' +
      'expire will cause premium spikes that price millions of Americans out of health coverage. ' +
      'Affordable healthcare should not be a partisan issue — families in our district depend on it.',
  },
  {
    slug: 'end-the-shutdown-cycle-pass-a-real-budget',
    headline: 'End the Shutdown Cycle: Pass a Real Budget',
    description:
      'Government shutdowns hurt federal workers, delay critical services, and cost taxpayers ' +
      'billions. After the longest shutdown in U.S. history, Congress must stop governing by ' +
      'crisis. Demand they pass full-year appropriations bills and end the cycle of continuing resolutions.',
    issue_area: 'Economics and Public Finance',
    issue_subtopic: 'Federal Budget',
    target_level: 'federal',
    message_template:
      'I am calling on you to pass full-year appropriations bills and end the destructive cycle of ' +
      'government shutdowns and short-term continuing resolutions. Federal workers, small businesses, ' +
      'and the communities that depend on government services deserve stable, predictable funding.',
  },
  {
    slug: 'humane-immigration-reform',
    headline: 'Humane Immigration Reform',
    description:
      'Our immigration system is broken, and neither enforcement-only nor open-border approaches ' +
      'serve the country well. Tell your representatives to pursue comprehensive immigration reform ' +
      'that secures the border while treating migrants with dignity and creating fair legal pathways.',
    issue_area: 'Immigration',
    issue_subtopic: 'Border Security',
    target_level: 'federal',
    message_template:
      'I urge you to support comprehensive immigration reform that balances strong border security ' +
      'with humane treatment of migrants and asylum seekers. We need real solutions — a pathway for ' +
      'those already contributing to our communities, efficient processing of asylum claims, and ' +
      'enforcement that reflects American values.',
  },
  {
    slug: 'protect-fed-independence',
    headline: 'Protect Fed Independence',
    description:
      'The Federal Reserve must be free to make monetary policy based on economic data, not ' +
      'political pressure from the White House. When politicians try to influence interest rates ' +
      'for short-term gain, it risks inflation and long-term economic instability. Tell Congress to defend Fed independence.',
    issue_area: 'Economics and Public Finance',
    issue_subtopic: 'Inflation',
    target_level: 'federal',
    message_template:
      'I urge you to publicly defend the Federal Reserve\'s independence from White House political ' +
      'pressure. Monetary policy must be guided by economic data, not election cycles. Please support ' +
      'legislation that strengthens institutional safeguards for the Fed\'s autonomy.',
  },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding 5 pre-built campaigns...\n');

  let inserted = 0;
  let skipped = 0;

  for (const campaign of CAMPAIGNS) {
    // Check if a campaign with this slug already exists
    const { data: existing } = await admin
      .from('campaigns')
      .select('id')
      .eq('slug', campaign.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  SKIP  "${campaign.headline}" (slug already exists)`);
      skipped++;
      continue;
    }

    const { error } = await admin.from('campaigns').insert({
      creator_id: SYSTEM_CREATOR_ID,
      slug: campaign.slug,
      headline: campaign.headline,
      description: campaign.description,
      issue_area: campaign.issue_area,
      issue_subtopic: campaign.issue_subtopic,
      target_level: campaign.target_level,
      message_template: campaign.message_template,
      status: 'active',
      action_count: 0,
    });

    if (error) {
      console.error(`  FAIL  "${campaign.headline}":`, error.message);
    } else {
      console.log(`  OK    "${campaign.headline}"`);
      inserted++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
