import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Everything an organization is currently asking people to do.
 *
 * An org's campaigns are unlisted, which keeps them off the platform's own
 * index at /issues. That is a rule about who gets to publish on our front
 * page, not a rule about the org publishing its own work, so this page lists
 * them for the org that created them.
 *
 * It exists because a social account has one link and many campaigns. Posting
 * a different campaign URL each week and leaving the old one in the bio is
 * how a follower ends up at a closed action.
 */
async function getOrg(slug: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('user_id, org_name, org_url, org_logo_url, brand_color, org_slug')
    .eq('org_slug', slug)
    .eq('account_type', 'organization')
    .maybeSingle();
  return data;
}

async function getActions(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('campaigns')
    .select('slug, headline, description, action_count, story_count, campaign_type, created_at, target_level')
    .eq('creator_id', userId)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .is('parent_campaign_id', null)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) return { title: 'Organization Not Found' };
  const name = org.org_name ?? 'This organization';
  return {
    title: `${name}: what you can do now | My Democracy`,
    description: `The actions ${name} is running right now, and how to take part.`,
    alternates: { canonical: `https://www.mydemocracy.app/org/${slug}/actions` },
    openGraph: { title: `${name}: what you can do now` },
  };
}

export default async function OrgActionsPage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) notFound();

  const name = org.org_name ?? 'This organization';
  const actions = await getActions(org.user_id);
  const [current, ...rest] = actions;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <p className="label mb-3">{name}</p>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-[0.98] text-gray-900 dark:text-white mb-5">
        What you can do right now.
      </h1>

      {actions.length === 0 ? (
        <>
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 max-w-[62ch] mb-8">
            Nothing is open at the moment. Add your name and {name} will tell you when the next one starts.
          </p>
          <Link
            href={`/org/${slug}`}
            className="label-lg inline-block px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            Hear about the next one
          </Link>
        </>
      ) : (
        <>
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 max-w-[62ch] mb-10">
            {name} supports people taking action on the policies we care about. Each one takes a few minutes, and
            what you send is your own words.
          </p>

          <Link
            href={`/campaign/${current.slug}`}
            className="block p-6 border border-gray-900 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <p className="label mb-2">Start here</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{current.headline}</h2>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 max-w-[66ch]">
              {current.description}
            </p>
            <p className="mt-4 text-sm text-purple-700 dark:text-purple-300">
              {current.campaign_type === 'storytelling' ? 'Share your story' : 'Write your message'} &rarr;
            </p>
          </Link>

          {rest.length > 0 && (
            <section className="mt-10">
              <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">Also open</h2>
              <ul className="space-y-4">
                {rest.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/campaign/${a.slug}`}
                      className="block p-4 border border-rule dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-colors"
                    >
                      <p className="font-semibold text-gray-900 dark:text-white">{a.headline}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-[66ch]">
                        {a.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-12">
            <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">Stay in it</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 max-w-[62ch]">
              Add your name and {name} can reach you when the next action opens, instead of you having to check.
            </p>
            <Link
              href={`/org/${slug}`}
              className="label-lg inline-block px-5 py-3 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900 transition-colors"
            >
              Add your name
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
