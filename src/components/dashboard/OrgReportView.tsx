import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { PrintReportButton } from '@/components/campaign/PrintReportButton';
import { emptyWhipTally, isSupportive, type WhipPosition } from '@/lib/whip';

/**
 * The org-wide funder report — every campaign, one narrative: the record,
 * the grassroots reach, the direct advocacy (touchpoints + lobbying hours +
 * whip standing), per-campaign outcomes. Print-to-PDF for the grant renewal.
 * Rendered by the authenticated /dashboard/report page and the public
 * read-only /demo/report page; access control is the page's job.
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

export async function OrgReportView({
  orgUserId,
  fallbackOrgName,
  backHref = '/dashboard',
}: {
  orgUserId: string;
  fallbackOrgName: string | null;
  backHref?: string;
}) {
  const admin = createAdminClient();

  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id, slug, headline, bill_ref, direction, outcome, action_count, story_count, parent_campaign_id, campaign_type, org_name, created_at')
    .eq('creator_id', orgUserId)
    .order('created_at', { ascending: true });
  const all = campaigns ?? [];
  const topLevel = all.filter((c) => !c.parent_campaign_id && c.campaign_type !== 'storytelling');
  const storytelling = all.filter((c) => !c.parent_campaign_id && c.campaign_type === 'storytelling');
  const allIds = all.map((c) => c.id as string);
  const topOf = new Map(all.map((c) => [c.id as string, (c.parent_campaign_id as string | null) ?? (c.id as string)]));

  const [{ data: msgRows }, { data: noteRows }, { data: posRows }, { data: stakeRows }, { data: storyRows }] = await Promise.all([
    allIds.length ? admin.from('messages').select('campaign_id, legislator_id').in('campaign_id', allIds).limit(10000) : Promise.resolve({ data: [] }),
    allIds.length ? admin.from('campaign_notes').select('campaign_id, hours').in('campaign_id', allIds).limit(5000) : Promise.resolve({ data: [] }),
    allIds.length ? admin.from('legislator_positions').select('campaign_id, position').in('campaign_id', allIds).limit(5000) : Promise.resolve({ data: [] }),
    allIds.length ? admin.from('campaign_stakeholders').select('campaign_id, side').in('campaign_id', allIds).limit(2000) : Promise.resolve({ data: [] }),
    allIds.length
      ? admin.from('stories').select('campaign_id, attribution_level, consent_usage_snapshot, state, language, storyteller_email').in('campaign_id', allIds).eq('status', 'active').limit(5000)
      : Promise.resolve({ data: [] }),
  ]);

  // A storytelling organization's portfolio is its stories. Counting only
  // bill campaigns meant the one customer who ran a bilingual storytelling
  // campaign opened their funder report and read "0 campaigns" with zeros
  // across every tile, with their eight stories listed in two lines at the
  // bottom. These are the figures that describe that work.
  const stories = (storyRows ?? []) as Array<{
    campaign_id?: string | null;
    attribution_level?: string | null;
    consent_usage_snapshot?: { granted_uses?: string[] } | null;
    state?: string | null;
    language?: string | null;
    storyteller_email?: string | null;
  }>;
  const grantedOf = (s: { consent_usage_snapshot?: { granted_uses?: string[] } | null }) =>
    s.consent_usage_snapshot?.granted_uses ?? [];
  // Real rows per initiative, so the per-campaign line and the totals above
  // it come from the same place. Rolled up to the parent the way messages and
  // meetings are, or a story collected on a step would not appear at all.
  const storiesByCampaign = new Map<string, number>();
  for (const st of stories) {
    const cid = st.campaign_id ?? '';
    if (!cid) continue;
    const top = topOf.get(cid) ?? cid;
    storiesByCampaign.set(top, (storiesByCampaign.get(top) ?? 0) + 1);
  }
  const storyStats = {
    total: stories.length,
    named: stories.filter((s) => s.attribution_level === 'named').length,
    firstNameOnly: stories.filter((s) => s.attribution_level === 'first_name_only').length,
    anonymous: stories.filter((s) => s.attribution_level === 'anonymous').length,
    quotableInReports: stories.filter((s) => grantedOf(s).includes('included_in_reports')).length,
    shareableWithOfficials: stories.filter((s) => grantedOf(s).includes('shared_with_legislators')).length,
    pressReady: stories.filter((s) => grantedOf(s).includes('shared_with_media')).length,
    openToFollowUp: stories.filter((s) => grantedOf(s).includes('contact_me_followup') && !!s.storyteller_email).length,
    // Every story that HAS a state counts, anonymous included. An anonymous
    // story is unattributed, not placeless, and many carry one. Excluding
    // them here disagreed with report.ts, which counts them, so the same
    // organization saw two different reach figures. A state is not
    // identifying on its own; the row carries no name either way.
    states: new Set(stories.map((s) => s.state).filter(Boolean)).size,
    languages: new Set(stories.map((s) => s.language || 'en')).size,
  };

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
  // A caller-supplied name wins, so the demo cannot borrow a real
  // organization's name out of a seeded row.
  const orgName = fallbackOrgName || (all.find((c) => c.org_name)?.org_name as string) || 'Your organization';
  const campaignWord = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const portfolioLabel = [
    topLevel.length ? campaignWord(topLevel.length, 'legislative campaign') : null,
    storytelling.length ? campaignWord(storytelling.length, 'story collection') : null,
  ].filter(Boolean).join(' · ') || 'No campaigns yet';
  // An organization that only collects stories has no bills to win or lose,
  // so the record and the legislative tiles would be five zeros.
  const hasLegislative = topLevel.length > 0;
  const generated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 print:py-0 print:max-w-none">
      <style>{`@media print { nav, header.sticky, .no-print { display: none !important; } body { background: #fff !important; } }`}</style>
      <div className="flex items-center justify-between gap-3 mb-6 no-print">
        <Link href={backHref} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">&larr; Back to Dashboard</Link>
        <PrintReportButton />
      </div>

      <div className="bg-white dark:bg-gray-800 print:bg-white rounded-xl border border-gray-200 dark:border-gray-700 print:border-0 shadow-sm print:shadow-none p-8 print:p-0 space-y-8 text-gray-900 dark:text-white print:text-black">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">{orgName} · Organization Impact Report</p>
          <h1 className="text-2xl font-bold mt-1">Legislative Advocacy Portfolio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {portfolioLabel} · Report generated {generated}
          </p>
        </div>

        {/* The record */}
        {hasLegislative && (
        <section>
          <h2 className="text-base font-semibold mb-3">The record</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Goals achieved" value={wins} sub="passed our bills / stopped bad ones" />
            <Stat label="Losses" value={losses} />
            <Stat label="Ongoing" value={ongoing} />
          </div>
        </section>
        )}

        {/* Grassroots + direct advocacy */}
        {hasLegislative && (
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
        )}

        {/* Story collection — the qualitative arm of the portfolio.
            Gated on the stories themselves. Gating on a storytelling campaign
            hid stories collected through an advocacy campaign: those rows
            were counted into the figures above and then never shown. */}
        {(storyStats.total > 0 || storytelling.length > 0) && (
          <section>
            <h2 className="text-base font-semibold mb-3">Stories collected</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Stat
                label="Stories shared"
                value={storyStats.total.toLocaleString()}
                sub={storyStats.languages > 1 ? `in ${storyStats.languages} languages` : undefined}
              />
              <Stat
                label="People who gave their name"
                value={storyStats.named.toLocaleString()}
                sub={`${storyStats.firstNameOnly} first name only · ${storyStats.anonymous} anonymous`}
              />
              <Stat
                label="Cleared for reports"
                value={storyStats.quotableInReports.toLocaleString()}
                sub="storytellers who allowed this use"
              />
              <Stat
                label="Cleared to share with officials"
                value={storyStats.shareableWithOfficials.toLocaleString()}
              />
              <Stat label="Cleared for press" value={storyStats.pressReady.toLocaleString()} />
              <Stat
                label="Open to follow-up"
                value={storyStats.openToFollowUp.toLocaleString()}
                sub="gave a contact address"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Every figure above counts only what each storyteller agreed to. A story may be read
              here and still not be cleared to quote.
            </p>
            <div className="space-y-1.5">
              {storytelling.map((c) => (
                <div key={c.id as string} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 dark:border-gray-700 pb-1.5">
                  <span className="font-medium min-w-0">{c.headline}</span>
                  <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {/* Live rows, not `campaigns.story_count`. The two
                        disagreed in the same block of the same page: one
                        campaign read 3 against 1 real story, because the
                        counter was bumped before the insert was confirmed. */}
                    {(storiesByCampaign.get(c.id as string) ?? 0).toLocaleString()} stories collected
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Per-campaign table */}
        {hasLegislative && (
        <section>
          <h2 className="text-base font-semibold mb-3">Campaign by campaign</h2>
          <div className="space-y-1.5">
            {topLevel.map((c) => {
              const met = c.outcome ? (c.direction === 'oppose' ? c.outcome !== 'passed' : c.outcome === 'passed') : null;
              return (
                <div key={c.id as string} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 dark:border-gray-700 pb-1.5">
                  <span className="min-w-0">
                    <span className="font-medium">{c.bill_ref ? `${c.bill_ref}: ` : ''}{c.headline}</span>
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
        )}

        <p className="text-[11px] text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4">
          Generated by My Democracy. Constituent figures reflect recorded participation; whip positions and touchpoints
          are the organization&apos;s own records.
        </p>
      </div>
    </div>
  );
}
