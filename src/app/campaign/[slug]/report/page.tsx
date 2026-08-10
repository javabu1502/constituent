import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { buildCampaignReport } from '@/lib/report';
import { PrintReportButton } from '@/components/campaign/PrintReportButton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from('campaigns').select('headline').eq('slug', slug).single();
  return { title: data ? `Impact Report — ${data.headline}` : 'Impact Report', robots: { index: false } };
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 print:border-gray-300">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function CampaignReportPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, slug, headline, org_name, brand_color, is_official, direction, campaign_type, support_count, oppose_count, created_at, creator_id')
    .eq('slug', slug)
    .single();
  if (!campaign) notFound();
  if (campaign.creator_id !== user.id) redirect(`/campaign/${slug}`);

  const report = await buildCampaignReport(campaign, Date.now());
  const accent = (campaign.brand_color as string) || '#7C3AED';
  const started = new Date(report.campaign.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const generated = new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const maxMomentum = Math.max(1, ...report.momentum.map((d) => d.count));
  const stanceTotal = report.stance ? report.stance.support + report.stance.oppose : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 print:py-0 print:max-w-none">
      {/* Print rules: drop site chrome + the toolbar, force light. */}
      <style>{`@media print { nav, header.sticky, .no-print { display: none !important; } body { background: #fff !important; } }`}</style>

      <div className="flex items-center justify-between gap-3 mb-6 no-print">
        <Link href={`/campaign/${slug}/analytics`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
          &larr; Back to Analytics
        </Link>
        <PrintReportButton />
      </div>

      <div className="bg-white dark:bg-gray-800 print:bg-white rounded-xl border border-gray-200 dark:border-gray-700 print:border-0 shadow-sm print:shadow-none p-8 print:p-0 space-y-8 text-gray-900 dark:text-white print:text-black">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-5" style={{ borderTopColor: accent, borderTopWidth: 4 }}>
          <p className="text-sm font-semibold" style={{ color: accent }}>
            {report.campaign.orgName || 'My Democracy'} · Campaign Impact Report
          </p>
          <h1 className="text-2xl font-bold mt-1">{report.campaign.headline}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {report.campaign.direction && (
              <span className="uppercase font-semibold mr-2" style={{ color: accent }}>
                {report.campaign.direction === 'oppose' ? 'Oppose' : 'Support'} campaign
              </span>
            )}
            Active since {started} · Report generated {generated}
          </p>
        </div>

        {/* Reach */}
        <section>
          <h2 className="text-base font-semibold mb-3">Reach &amp; mobilization</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Constituents mobilized" value={report.reach.constituents.toLocaleString()} />
            <Stat label="Messages to officials" value={report.reach.messages.toLocaleString()} />
            <Stat label="Officials contacted" value={report.reach.officialsContacted.toLocaleString()} />
            <Stat label="States reached" value={report.reach.statesReached.toLocaleString()} />
            <Stat label="Cities reached" value={report.reach.citiesReached.toLocaleString()} />
            <Stat
              label="Last 30 days"
              value={report.reach.last30Days.toLocaleString()}
              sub={report.reach.weekOverWeekPct !== null ? `${report.reach.weekOverWeekPct >= 0 ? '+' : ''}${report.reach.weekOverWeekPct}% vs prior week` : undefined}
            />
          </div>
        </section>

        {/* Momentum */}
        <section>
          <h2 className="text-base font-semibold mb-3">Momentum (last 30 days)</h2>
          <div className="flex items-end gap-0.5 h-24">
            {report.momentum.map((d) => (
              <div key={d.date} className="flex-1 rounded-t" style={{ height: `${(d.count / maxMomentum) * 100}%`, minHeight: d.count > 0 ? 2 : 0, backgroundColor: accent, opacity: d.count > 0 ? 1 : 0.15 }} title={`${d.date}: ${d.count}`} />
            ))}
          </div>
        </section>

        {/* Stance (neutral campaigns only) */}
        {report.stance && (
          <section>
            <h2 className="text-base font-semibold mb-3">Where participants stand</h2>
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              <div className="bg-emerald-500" style={{ width: `${Math.round((report.stance.support / stanceTotal) * 100)}%` }} />
              <div className="bg-rose-500" style={{ width: `${100 - Math.round((report.stance.support / stanceTotal) * 100)}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>Support {report.stance.support.toLocaleString()} ({Math.round((report.stance.support / stanceTotal) * 100)}%)</span>
              <span>Oppose {report.stance.oppose.toLocaleString()} ({100 - Math.round((report.stance.support / stanceTotal) * 100)}%)</span>
            </div>
          </section>
        )}

        {/* AI insights — the qualitative narrative */}
        {report.insights && (
          <section>
            <h2 className="text-base font-semibold mb-1">What constituents are saying</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">AI-summarized from {report.insights.sourceCount} submissions · themes only, de-identified</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{report.insights.summary}</p>
            <div className="space-y-2">
              {report.insights.themes.map((t, i) => (
                <div key={i} className="border-l-2 pl-3" style={{ borderColor: accent }}>
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-semibold">{t.label}</span>
                    {t.prevalence > 0 && <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">~{t.prevalence} of {report.insights!.sourceCount}</span>}
                  </div>
                  {t.quote && <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-0.5">&ldquo;{t.quote}&rdquo;</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pressure map */}
        {report.topOfficials.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">Officials under the most pressure</h2>
            <div className="space-y-1.5">
              {report.topOfficials.map((o) => (
                <div key={o.name} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-1.5">
                  <span className="font-medium">{o.name}{o.party ? ` (${o.party})` : ''}</span>
                  <span className="text-gray-500 dark:text-gray-400">{o.messages.toLocaleString()} messages</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Geographic reach */}
        {report.topStates.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">Top states</h2>
            <div className="flex flex-wrap gap-2">
              {report.topStates.map((s) => (
                <span key={s.state} className="text-sm px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                  {s.state} · {s.count.toLocaleString()}
                </span>
              ))}
            </div>
          </section>
        )}

        <p className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4">
          Generated by My Democracy. Figures reflect activity recorded through {generated}. Qualitative themes are AI-summarized and de-identified; verify against source before public quotation.
        </p>
      </div>
    </div>
  );
}
