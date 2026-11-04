import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { JoinForm } from '@/components/org/JoinForm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) return { title: 'Organization Not Found' };
  const name = org.org_name ?? 'This organization';
  return {
    title: `Join ${name} | My Democracy`,
    description: `Sign up to hear from ${name} when a bill moves and it is time to act.`,
    alternates: { canonical: `https://www.mydemocracy.app/org/${slug}` },
  };
}

export default async function OrgPage({ params }: PageProps) {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) notFound();

  const name = org.org_name ?? 'This organization';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        {org.org_logo_url && (
          // Org logos are uploaded to arbitrary hosts, same reasoning as the
          // officials' photos on /representatives.
          <img src={org.org_logo_url} alt="" className="h-16 w-auto mx-auto mb-4 object-contain" />
        )}
        <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">Join the campaign</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{name}</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-3">
          Add your name so {name} can reach you when a bill moves and there is something concrete to do.
        </p>
        {org.org_url && (
          <a
            href={org.org_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            Visit their website
          </a>
        )}
      </div>

      <JoinForm slug={slug} orgName={name} />

      <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
        {name} receives your name, email and address. My Democracy stores it on their behalf and never sells it. See our{' '}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
