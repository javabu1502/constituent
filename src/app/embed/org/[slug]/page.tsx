import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { JoinForm } from '@/components/org/JoinForm';
import { EmbedAttribution } from '@/components/embed/EmbedAttribution';
import { EmbedAutoHeight } from '@/components/embed/EmbedAutoHeight';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Embeds live inside other sites' pages — never in a search index.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('org_name').eq('org_slug', slug).maybeSingle();
  return {
    title: data?.org_name ? `Join ${data.org_name}` : 'Join the campaign',
    robots: { index: false, follow: false },
  };
}

/**
 * The join form on its own, for an organization to iframe into their site.
 * Chrome-free on purpose: it sits inside their page, under their header.
 */
export default async function OrgJoinEmbed({ params }: PageProps) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: org } = await admin
    .from('profiles')
    .select('org_name, org_slug')
    .eq('org_slug', slug)
    .eq('account_type', 'organization')
    .maybeSingle();
  if (!org) notFound();

  return (
    <EmbedAutoHeight>
      <div className="p-4">
        <JoinForm slug={slug} orgName={org.org_name ?? 'This organization'} compact />
        <EmbedAttribution source="org-join" />
      </div>
    </EmbedAutoHeight>
  );
}
