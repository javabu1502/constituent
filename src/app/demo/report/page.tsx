import type { Metadata } from 'next';
import { OrgReportView } from '@/components/dashboard/OrgReportView';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { DEMO_ORG_USER_ID } from '@/lib/demo';

export const metadata: Metadata = { title: 'Live Demo — Organization Impact Report | My Democracy', robots: { index: false } };

export const dynamic = 'force-dynamic';

/**
 * Public read-only demo of the org-wide funder report, built from the demo
 * org's sample portfolio.
 */
export default async function DemoOrgReportPage() {
  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 pt-6 no-print">
        <DemoBanner />
      </div>
      <OrgReportView orgUserId={DEMO_ORG_USER_ID} fallbackOrgName={null} backHref="/demo/dashboard" />
    </div>
  );
}
