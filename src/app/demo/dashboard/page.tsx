import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase';
import { OrgDashboard } from '@/components/dashboard/OrgDashboard';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { DEMO_ORG_USER_ID } from '@/lib/demo';

export const metadata: Metadata = {
  title: 'Live Demo — Organization Dashboard | My Democracy',
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
    .eq('creator_id', DEMO_ORG_USER_ID)
    .like('slug', 'demo-%')
    .order('created_at', { ascending: false });

  const all = campaigns ?? [];
  const orgName = (all.find((c) => c.org_name)?.org_name as string) || 'Demo organization';

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <DemoBanner />
      </div>
      <OrgDashboard displayName={orgName} campaigns={all} isDemo />
    </>
  );
}
