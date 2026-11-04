import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { SupporterMap } from '@/components/org/SupporterMap';
import { EmbedSnippet } from '@/components/org/EmbedSnippet';

export const metadata: Metadata = {
  title: 'Your supporters | My Democracy',
  robots: { index: false, follow: false },
};

/**
 * The organization's own view of its supporter list: where they are, by
 * legislative district, and the snippet to put the join form on their site.
 * Owner only — the list is the thing they are building.
 */
export default async function OrgSupportersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: org } = await admin
    .from('profiles')
    .select('user_id, org_name, org_slug')
    .eq('org_slug', slug)
    .eq('account_type', 'organization')
    .maybeSingle();
  if (!org) notFound();
  if (org.user_id !== user.id) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your supporters</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-1 mb-6">
        Where the people who joined {org.org_name ?? 'your campaign'} live, by legislative district.
      </p>

      <section className="mb-10">
        <SupporterMap slug={slug} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Put the form on your site</h2>
        <EmbedSnippet slug={slug} />
      </section>
    </div>
  );
}
