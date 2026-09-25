import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { OrgReportView } from '@/components/dashboard/OrgReportView';

export const metadata: Metadata = { title: 'Organization Impact Report | My Democracy', robots: { index: false } };

/**
 * Auth + org gate for the org-wide funder report; the report itself lives in
 * OrgReportView (shared with the public read-only demo).
 */
export default async function OrgReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('account_type, name').eq('user_id', user.id).single();
  if (profile?.account_type !== 'organization') redirect('/dashboard');

  return <OrgReportView orgUserId={user.id} fallbackOrgName={(profile?.name as string) ?? null} />;
}
