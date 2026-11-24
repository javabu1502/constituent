import type { Metadata } from 'next';
import { resolveBillPositions } from '@/lib/card-bill-position';
import { createAdminClient } from '@/lib/supabase';
import { OrgDashboard } from '@/components/dashboard/OrgDashboard';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { DEMO_ORG_USER_ID, DEMO_ORG_NAME } from '@/lib/demo';
import { getPortfolioCounts } from '@/lib/campaign-counts';

export const metadata: Metadata = {
  title: 'Live demo: organization dashboard | My Democracy',
  description: 'Explore the My Democracy organization dashboard with sample data. Whip boards, legislator intel, coalition tracking, and funder reports.',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

/**
 * Public read-only demo of the org dashboard. No login. Only demo- prefixed
 * campaigns owned by the demo org are shown; every write path stays behind
 * the owner check, so nothing here can be edited.
 */
export default async function DemoDashboardPage() {
  const admin = createAdminClient();
  const { data: campaigns } = await admin
    .from('campaigns')
    .select('*')
    .eq('org_user_id', DEMO_ORG_USER_ID)
    .like('slug', 'demo-%')
    .order('created_at', { ascending: false });

  const all = campaigns ?? [];
  const orgName = DEMO_ORG_NAME;
  const portfolio = await getPortfolioCounts(admin, all.map((c) => c.id as string));

  // The demo is where this gets walked through, so the tracks have to be
  // there: without positions every card renders flat and the whole point of
  // a bill-first dashboard is invisible.
  const billPositions = await resolveBillPositions(
    all.filter((c) => !c.parent_campaign_id).map((c) => ({
      id: String(c.id),
      bill_level: (c.bill_level as string | null) ?? null,
      bill_state: (c.bill_state as string | null) ?? null,
      bill_ref: (c.bill_ref as string | null) ?? null,
      bill_congress: (c.bill_congress as number | null) ?? null,
      bill_type: (c.bill_type as string | null) ?? null,
      bill_number: (c.bill_number as string | null) ?? null,
    })),
    all.map((c) => ({
      parent_campaign_id: (c.parent_campaign_id as string | null) ?? null,
      stage_goal: (c.stage_goal as string | null) ?? null,
      created_at: (c.created_at as string | null) ?? null,
    })),
  );

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <DemoBanner />
      </div>
      <OrgDashboard displayName={orgName} campaigns={all} portfolio={portfolio} billPositions={billPositions} isDemo />
    </>
  );
}
