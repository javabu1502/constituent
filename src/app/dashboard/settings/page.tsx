import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { OrgSettingsForm } from '@/components/dashboard/OrgSettingsForm';

export const metadata: Metadata = {
  title: 'Organization Settings | My Democracy',
  description: 'Manage your organization name, logo, and branding.',
};

export default async function OrgSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('account_type, org_name, org_url, org_logo_url, brand_color')
    .eq('user_id', user.id)
    .single();

  // Constituent accounts have no org identity to manage.
  if (profile?.account_type !== 'organization') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Organization Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Your identity across My Democracy. Campaigns you create automatically carry this name, logo, and color on their pages.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        <OrgSettingsForm
          initial={{
            org_name: profile.org_name ?? null,
            org_url: profile.org_url ?? null,
            org_logo_url: profile.org_logo_url ?? null,
            brand_color: profile.brand_color ?? null,
          }}
        />
      </div>
    </div>
  );
}
