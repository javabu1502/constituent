import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { PrintReportButton } from '@/components/campaign/PrintReportButton';
import { emptyWhipTally, isSupportive, type WhipPosition } from '@/lib/whip';

export const metadata: Metadata = { title: 'Organization Impact Report | My Democracy', robots: { index: false } };

/**
 * The org-wide funder report — every campaign, one narrative: the record,
 * the grassroots reach, the direct advocacy (touchpoints + lobbying hours +
 * whip standing), per-campaign outcomes. Print-to-PDF for the grant renewal.
 */

const OUTCOME_LABELS: Record<string, string> = {
  passed: 'Passed', failed: 'Failed', died_committee: 'Died in committee', vetoed: 'Vetoed', withdrawn: 'Withdrawn',
};

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 print:border-gray-300">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function OrgReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('account_type, name').eq('user_id', user.id).single();
  if (profile?.account_type !== 'organization') redirect('/dashboard');

  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id, slug, headline, bill_ref, direction, outcome, action_count, story_count, parent_campaign_id, campaign_type, org_name, created_at')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: true });
  const all = campaigns ?? [];
  const topLevel = all.filter((c) => !c.parent_campaign_id && c.campaign_type !== 'storytelling');
  const storytelling = all.filter((c) => !c.parent_campaign_id && c.campaign_type === 'storytelling');
  const allIds = all.map((c) => c.id as string);
  const topOf = new Map(all.map((c) => [c.id as string, (c.parent_campaign_id as string | null) ?? (c.id as string)]));

  const [{ data: msgRows }, { data: noteRows }, { data: posRows }, { data: stakeRows }] = await Promise.all([
    allIds.length ? admin.from('messages').select('campaign_id, legislator_id').in('campaign_id', allIds).limit(10000) : Promise.resolve({ data: [] }),
    allIds.length ? admin.from('campaign_notes').select('campaign_id, hours').in('campaign_id', allIds).limit(5000) : Promise.resolve({ data: [] }),
    allIds.length ? admin.from('legislator_positions').select('campaign_id, position').in('campaign_id', allIds).limit(5000) : Promise.resolve({ data: [] }),
    allIds.length ? admin.from('campaign_stakeholders').select('campaign_id, side').in('campaign_id', allIds).limit(2000) : Promise.resolve({ data: [] }),
  ]);

  // Roll everything up to initiatives.
  const msgsByTop = new Map<string, number>();
  const officials = new Set<string>();
  for (const m of msgRows ?? []) {
    const top = topOf.get(m.campaign_id as string) ?? (m.campaign_id as string);
    msgsByTop.set(top, (msgsByTop.get(top) || 0) + 1);
    if (m.legislator_id) officials.add(m.legislator_id as string);
  }
  const meetingsByTop = new Map<string, number>();
  const hoursByTop = new Map<string, number>();
  for (const n of noteRows ?? []) {
    const top = topOf.get(n.campaign_id as string) ?? (n.campaign_id as string);
    meetingsByTop.set(top, (meetingsByTop.get(top) || 0) + 1);
    hoursByTop.set(top, (hoursByTop.get(top) || 0) + (Number(n.hours) || 0));
  }
  const whip = emptyWhipTally();
  let supportiveRelationships = 0;
  for (const p of posRows ?? []) {
    if ((p.position as string) in whip) whip[p.position as WhipPosition] += 1;
    if (isSupportive(p.position as string)) supportiveRelationships += 1;
  }
  const supporterOrgs = (stakeRows ?? []).filter((s) => s.side === 'support').length;
  const opponentOrgs = (stakeRows ?? []).filter((s) => s.side === 'oppose').length;

  let wins = 0;
  let losses = 0;
  let ongoing = 0;
  for (const c of topLevel) {
    if (!c.outcome) { ongoing += 1; continue; }
    const met = c.direction === 'oppose' ? c.outcome !== 'passed' : c.outcome === 'passed';
    if (met) wins += 1; else losses += 1;
  }
  const totalConstituents = topLevel.reduce((n, c) => n + (Number(c.action_count) || 0), 0);
  const totalMessages = [...msgsByTop.values()].reduce((a, b) => a + b, 0);
  const totalMeetings = (noteRows ?? []).length;
  const totalHours = Math.round((noteRows ?? []).reduce((n, r) => n + (Number(r.hours) || 0), 0) * 4) / 4;
  const orgName = (topLevel.find((c) => c.org_name)?.org_name as string) || (profile?.name as string) || 'Your organization';
  const generated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 print:py-0 print:max-w-none">
      <style>{`@media print { nav, header.sticky, .no-print { display: none !important; } body { background: #fff !important; } }`}</style>
      <div className="flex items-center justify-between gap-3 mb-6 no-print">
        <Link href="/dashboard" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">&larr; Back to Dashboard</Link>
        <PrintReportButton />
      </div>

      <div className="bg-white dark:bg-gray-800 print:bg-white rounded-xl border border-gray-200 dark:border-gray-700 print:border-0 shadow-sm print:shadow-none p-8 print:p-0 space-y-8 text-gray-900 dark:text-white print:text-black">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">{orgName} · Organization Impact Report</p>
          <h1 className="text-2xl font-bold mt-1">Legislative Advocacy Portfolio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {topLevel.length} campaigns · Report generated {generated}
          </p>
        </div>

        {/* The record */}
        <section>
          <h2 className="text-base font-semibold mb-3">The record</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Goals achieved" value={wins} sub="passed our bills / stopped bad ones" />
            <Stat label="Losses" value={losses} />
            <Stat label="Ongoing" value={ongoing} />
          </div>
        </section>

        {/* Grassroots + direct advocacy */}
        <section>
          <h2 className="text-base font-semibold mb-3">The work behind it</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Constituents mobilized" value={totalConstituents.toLocaleString()} />
            <Stat label="Messages to legislators" value={totalMessages.toLocaleString()} sub={`${officials.size} distinct officials reached`} />
            <Stat label="Lawmaker & stakeholder touchpoints" value={totalMeetings.toLocaleString()} sub={totalHours > 0 ? `${totalHours.toLocaleString()} lobbying hours logged` : undefined} />
            <Stat label="Supportive legislator relationships" value={supportiveRelationships.toLocaleString()} sub={`${whip.yes} yes · ${whip.leaning_yes} leaning yes across all bills`} />
            <Stat label="Coalition partners" value={supporterOrgs.toLocaleString()} sub={`${opponentOrgs} opposing orgs tracked`} />
          </div>
        </section>

        {/* Story collection — the qualitative arm of the portfolio */}
        {storytelling.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3">Story collection</h2>
            <div className="space-y-1.5">
              {storytelling.map((c) => (
                <div key={c.id as string} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 dark:border-gray-700 pb-1.5">
                  <span className="font-medium min-w-0">{c.headline}</span>
                  <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {Number(c.story_count || 0).toLocaleString()} stories collected
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Per-campaign table */}
        <section>
          <h2 className="text-base font-semibold mb-3">Campaign by campaign</h2>
          <div className="space-y-1.5">
            {topLevel.map((c) => {
              const met = c.outcome ? (c.direction === 'oppose' ? c.outcome !== 'passed' : c.outcome === 'passed') : null;
              return (
                <div key={c.id as string} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 dark:border-gray-700 pb-1.5">
                  <span className="min-w-0">
                    <span className="font-medium">{c.bill_ref ? `${c.bill_ref} — ` : ''}{c.headline}</span>
                  </span>
                  <span className="shrink-0 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{Number(c.action_count).toLocaleString()} constituents</span>
                    <span>{(msgsByTop.get(c.id as string) ?? 0).toLocaleString()} msgs</span>
                    <span>{(meetingsByTop.get(c.id as string) ?? 0).toLocaleString()} mtgs</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      met === null
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        : met
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                    }`}>
                      {c.outcome ? OUTCOME_LABELS[c.outcome as string] ?? c.outcome : 'Ongoing'}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 no-print">
            Need depth on one campaign? Each has its own printable report from its analytics page.
          </p>
        </section>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4">
          Generated by My Democracy. Constituent figures reflect recorded participation; whip positions and touchpoints
          are the organization&apos;s own records.
        </p>
      </div>
    </div>
  );
}
