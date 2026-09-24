import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { LegislatorIntelView } from '@/components/dashboard/LegislatorIntelView';

export const metadata: Metadata = { title: 'Legislator Intel | My Democracy', robots: { index: false } };

/**
 * Auth + org gate for the legislator intel page; the view itself lives in
 * LegislatorIntelView (shared with the public read-only demo).
 */
export default async function LegislatorIntelPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('account_type').eq('user_id', user.id).single();
  if (profile?.account_type !== 'organization') redirect('/dashboard');

  return <LegislatorIntelView orgUserId={user.id} legislatorId={id} />;
}
