/**
 * Activate (approve + set live) the 39 pending weigh-ins from the 2026-08-09
 * batch. Mirrors PATCH /api/admin/campaigns: approval_status='approved',
 * status='active', approved_at=now. Targets exact slugs only.
 * Run: npx tsx scripts/activate-weigh-in-batch-2026-08-09.ts
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error('Missing env'); process.exit(1); }
const admin = createClient(url, key);

const SLUGS = [
  'raise-federal-minimum-wage', 'gig-worker-classification', 'pro-act-union-organizing',
  'assault-weapons-ban', 'concealed-carry-reciprocity', 'universal-background-checks',
  'red-flag-erpo-grants', 'marijuana-descheduling-more-act', 'police-accountability-floyd-act',
  'veteran-suicide-overmedication-review', 'veterans-pfas-va-care', 'salt-deduction-cap',
  'ultra-millionaire-wealth-tax', 'student-loan-interest-elimination', 'expand-pell-loan-forgiveness',
  'abolish-department-of-education', 'right-to-contraception', 'federal-right-to-ivf',
  'pfas-forever-chemical-phaseout', 'limit-offshore-drilling-withdrawals', 'no-fakes-ai-likeness',
  'app-store-age-verification', 'kids-off-social-media', 'ukraine-support-act',
  'russia-sanctions-graham-act', 'iran-war-powers-resolution', 'close-de-minimis-loophole',
  'taiwan-conflict-deterrence', 'national-paid-family-leave', 'ssi-savings-penalty-elimination',
  'phase-out-subminimum-wage-disabilities', 'medicaid-hcbs-access', 'restore-nursing-home-staffing',
  'elder-justice-reauthorization', 'improving-seniors-timely-access', 'redistricting-reform-commissions',
  'john-lewis-voting-rights', 'disclose-act-dark-money', 'farmer-right-to-repair',
];

async function run() {
  const { data, error } = await admin
    .from('campaigns')
    .update({ approval_status: 'approved', status: 'active', approved_at: new Date().toISOString() })
    .in('slug', SLUGS)
    .eq('approval_status', 'pending') // only flip ones still pending, never touch others
    .select('slug');
  if (error) { console.error('FAILED:', error.message); process.exit(1); }
  console.log(`Activated ${data?.length ?? 0} of ${SLUGS.length} campaigns.`);
  for (const c of data ?? []) console.log(`  LIVE  ${c.slug}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
