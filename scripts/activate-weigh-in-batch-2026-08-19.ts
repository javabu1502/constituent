/**
 * Activate (approve + set live) the 6 pending weigh-ins from the 2026-08-19
 * batch, on Jared's explicit go 2026-08-19 (incl. the partisan-charged NDAA
 * row, which passed its second adversarial neutrality pass pre-insert).
 * Mirrors PATCH /api/admin/campaigns: approval_status='approved',
 * status='active', approved_at=now. Targets exact slugs only.
 * Run: npx tsx scripts/activate-weigh-in-batch-2026-08-19.ts
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error('Missing env'); process.exit(1); }
const admin = createClient(url, key);

const SLUGS = [
  'fy2027-ndaa-senate-passage',
  'cr-fund-government-december-11',
  'fisa-section-702-revival',
  'hemp-thc-ban-repeal-regulate',
  'nfip-long-term-reauthorization',
  'build-america-250-surface-transportation',
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
