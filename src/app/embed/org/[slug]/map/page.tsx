import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { SupporterMap } from '@/components/org/SupporterMap';
import { EmbedAttribution } from '@/components/embed/EmbedAttribution';
import { EmbedAutoHeight } from '@/components/embed/EmbedAutoHeight';
import { verifyMapEmbedToken } from '@/lib/org-embed-token';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}

// Embeds live inside other sites' pages — never in a search index.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('org_name').eq('org_slug', slug).maybeSingle();
  return {
    title: data?.org_name ? `${data.org_name} supporters` : 'Supporters',
    robots: { index: false, follow: false },
  };
}

/**
 * The supporter map on its own, for an organization to iframe into their site.
 *
 * Gated on the signed token from the dashboard snippet rather than on a
 * session: the whole point is that the org's own visitors can see it. The
 * token is what distinguishes a map the org published from one a stranger
 * reached by guessing the handle.
 */
export default async function OrgMapEmbed({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { t } = await searchParams;

  const admin = createAdminClient();
  const { data: org } = await admin
    .from('profiles')
    .select('org_name, org_slug')
    .eq('org_slug', slug)
    .eq('account_type', 'organization')
    .maybeSingle();
  if (!org) notFound();
  if (!verifyMapEmbedToken(slug, t)) notFound();

  return (
    <EmbedAutoHeight>
      <div className="p-4">
        <SupporterMap slug={slug} token={t} publicView />
        <EmbedAttribution source="org-map" />
      </div>
    </EmbedAutoHeight>
  );
}
