import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { SupporterMap } from '@/components/org/SupporterMap';
import { EmbedSnippet } from '@/components/org/EmbedSnippet';
import { slugCandidates } from '@/lib/org-slug';
import { mapEmbedToken } from '@/lib/org-embed-token';

export const metadata: Metadata = { title: 'Your supporters | My Democracy', robots: { index: false } };

/**
 * The organization's own view of its supporters.
 *
 * Lives at /dashboard/supporters rather than /org/<slug>/supporters because
 * the dashboard is where an organization already is, and because a page you
 * can only reach by knowing your own slug is a page nobody reaches. The join
 * form and the supporter map shipped with no link from anywhere, and three of
 * the four organization accounts had no slug at all, so there was no URL for
 * them to live at either.
 *
 * The handle is created here, on first visit, from the organization's name.
 */
export default async function DashboardSupportersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('account_type, org_name, org_slug, name')
    .eq('user_id', user.id)
    .single();
  if (profile?.account_type !== 'organization') redirect('/dashboard');

  let slug = (profile?.org_slug as string | null) ?? null;
  if (!slug) {
    // org_slug is unique, so a clash is a real possibility on a common name.
    for (const candidate of slugCandidates(profile?.org_name as string | null, user.id)) {
      const { error } = await admin.from('profiles').update({ org_slug: candidate }).eq('user_id', user.id);
      if (!error) {
        slug = candidate;
        break;
      }
    }
  }

  const orgName = (profile?.org_name as string | null) ?? 'your organization';

  if (!slug) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your supporters</h1>
        <p className="text-gray-700 dark:text-gray-300">
          We could not create a public handle for {orgName}. Set an organization name in{' '}
          <Link href="/dashboard/settings" className="text-purple-700 dark:text-purple-300 hover:underline">
            settings
          </Link>{' '}
          and come back.
        </p>
      </div>
    );
  }

  const mapPath = `/embed/org/${slug}/map?t=${mapEmbedToken(slug)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <p className="label mb-3">Supporters</p>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-[0.98] text-gray-900 dark:text-white mb-4">
        Who you can call on, and where.
      </h1>
      <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 max-w-[62ch] mb-10">
        People who joined {orgName}, took an action on one of your campaigns, or shared their story with you.
      </p>

      <section className="mb-14">
        <SupporterMap slug={slug} />
      </section>

      <section className="mb-14">
        <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">Your join page</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 max-w-[62ch]">
          Share this link anywhere. Anyone who fills it in lands on the map above.
        </p>
        <Link
          href={`/org/${slug}`}
          className="label-lg inline-block px-4 py-3 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900 transition-colors"
        >
          mydemocracy.app/org/{slug}
        </Link>
      </section>

      <section className="mb-14">
        <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">Put the form on your own site</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 max-w-[62ch]">
          Paste this where you want the form to appear. It resizes itself to fit.
        </p>
        <EmbedSnippet slug={slug} />
      </section>

      <section>
        <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">Put the map on your own site</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 max-w-[62ch]">
          The same map as above, for a supporters or campaign page. It shows district and city counts. It does not
          show names or addresses. The link carries a key, so only people you give it to can open the map.
        </p>
        <EmbedSnippet slug={slug} path={mapPath} title={`${orgName} supporters`} minHeight={520} />
      </section>
    </div>
  );
}
