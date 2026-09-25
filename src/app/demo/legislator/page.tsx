import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LegislatorIntelView } from '@/components/dashboard/LegislatorIntelView';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { DEMO_ORG_USER_ID } from '@/lib/demo';

export const metadata: Metadata = { title: 'Live Demo — Legislator Intel | My Democracy', robots: { index: false } };

export const dynamic = 'force-dynamic';

/**
 * Public read-only demo of the legislator intel page, scoped to the demo
 * org's campaigns. The meeting logger is hidden; writes stay owner-only.
 */
export default async function DemoLegislatorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect('/demo/dashboard');

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <DemoBanner />
      </div>
      <LegislatorIntelView orgUserId={DEMO_ORG_USER_ID} legislatorId={id} isDemo backHref="/demo/dashboard" />
    </div>
  );
}
