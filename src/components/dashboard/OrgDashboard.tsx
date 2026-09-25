import Link from 'next/link';
import { stageOrder } from '@/lib/stages';
import { LegislatorSearch } from '@/components/dashboard/LegislatorSearch';
import { CampaignCard, type CampaignRow } from '@/components/dashboard/CampaignCard';
import { getStateLegislators } from '@/lib/state-legislators';
import { getAllFederalLegislators } from '@/lib/legislators';

/**
 * The org-shaped dashboard: the org's campaigns and the reach those campaigns
 * earned. Orgs have no elected officials of their own and never send
 * constituent messages, so none of those sections render. Shared by the
 * authenticated /dashboard org branch and the public read-only /demo/dashboard
 * (isDemo hides every mutating control and reroutes intel links).
 */
export function OrgDashboard({
  displayName,
  campaigns,
  isDemo = false,
}: {
  displayName: string;
  campaigns: CampaignRow[];
  isDemo?: boolean;
}) {
  // Stage campaigns nest under their parent so each initiative reads as ONE
  // narrative — the parent card carries the whole journey, not six siblings.
  const stagesByParent = new Map<string, CampaignRow[]>();
  for (const c of campaigns) {
    const pid = c.parent_campaign_id as string | null;
    if (pid) {
      if (!stagesByParent.has(pid)) stagesByParent.set(pid, []);
      stagesByParent.get(pid)!.push(c);
    }
  }
  for (const list of stagesByParent.values()) {
    list.sort(
      (a, b) =>
        stageOrder((a.stage_goal as string) || null) - stageOrder((b.stage_goal as string) || null) ||
        String(a.created_at).localeCompare(String(b.created_at))
    );
  }
  const topLevelCampaigns = campaigns.filter((c) => !c.parent_campaign_id);

  // Member lookup roster: every legislator in the states this org works,
  // plus all of Congress when it runs federal campaigns. Most orgs live in
  // one world or the other — the roster follows their portfolio.
  const rosterStates = [...new Set(campaigns.map((c) => c.bill_state as string | null).filter(Boolean))] as string[];
  const hasFederal = topLevelCampaigns.some(
    (c) => c.campaign_type !== 'storytelling' && !c.bill_state && (c.bill_level === 'federal' || c.target_level === 'federal' || c.target_level === 'both' || !c.target_level)
  );
  const legislatorRoster = [
    ...rosterStates.flatMap((st) =>
      getStateLegislators(st).map((l) => ({ id: l.id, name: l.name, party: l.party ?? null, chamber: l.chamber ?? null, state: st }))
    ),
    ...(hasFederal
      ? getAllFederalLegislators().map((l) => ({ id: l.id, name: l.name, party: l.party ?? null, chamber: l.chamber ?? null, state: 'US' }))
      : []),
  ];
  // Federal and state portfolios render as separate sections.
  const federalCampaigns = topLevelCampaigns.filter((c) => c.campaign_type !== 'storytelling' && !c.bill_state);
  const stateGroups = new Map<string, CampaignRow[]>();
  for (const c of topLevelCampaigns) {
    if (c.campaign_type === 'storytelling' || !c.bill_state) continue;
    const st = c.bill_state as string;
    if (!stateGroups.has(st)) stateGroups.set(st, []);
    stateGroups.get(st)!.push(c);
  }
  const storytellingCampaigns = topLevelCampaigns.filter((c) => c.campaign_type === 'storytelling');
  // Sum initiative totals only (parents already include their stages).
  const totalActions = topLevelCampaigns.reduce((n, c) => n + (Number(c.action_count) || 0), 0);
  const totalStories = topLevelCampaigns.reduce((n, c) => n + (Number(c.story_count) || 0), 0);
  // Portfolio scoreboard: outcomes judged against each campaign's goal.
  let wins = 0;
  let losses = 0;
  let ongoing = 0;
  for (const c of topLevelCampaigns) {
    if (!c.outcome) { ongoing += 1; continue; }
    const met = c.direction === 'oppose' ? c.outcome !== 'passed' : c.outcome === 'passed';
    if (met) wins += 1; else losses += 1;
  }

  const renderCampaignCard = (campaign: CampaignRow) => (
    <CampaignCard
      key={campaign.id}
      campaign={campaign}
      stages={stagesByParent.get(campaign.id as string) ?? []}
      isDemo={isDemo}
    />
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {displayName} · advocacy account
            {(wins + losses > 0) && (
              <span className="ml-2 text-sm">
                · record: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{wins} won</span>
                {losses > 0 && <> · <span className="font-semibold text-gray-500">{losses} lost</span></>}
                {ongoing > 0 && <> · {ongoing} ongoing</>}
              </span>
            )}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {!isDemo && (
            <Link href="/dashboard/settings" className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Settings
            </Link>
          )}
          <Link href={isDemo ? '/demo/report' : '/dashboard/report'} className="text-sm font-medium px-4 py-2 rounded-lg border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
            Organization report
          </Link>
          {!isDemo && (
            <Link href="/campaign/create" className="text-sm font-medium px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors">
              + New campaign
            </Link>
          )}
        </div>
      </div>

      <LegislatorSearch roster={legislatorRoster} intelBasePath={isDemo ? '/demo/legislator' : '/dashboard/legislator'} />

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Campaigns</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{topLevelCampaigns.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Constituent actions</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalActions.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Stories collected</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalStories.toLocaleString()}</p>
        </div>
      </div>

      {topLevelCampaigns.length === 0 ? (
        // First run: a new org lands here with no guidance otherwise. This
        // card disappears forever once the first campaign exists.
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Welcome to your advocacy dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Here&rsquo;s how campaigns work on My Democracy:</p>
          <ol className="space-y-4 mb-8">
            {[
              ['Create a campaign', 'Set the ask, link a bill, and add talking points. We review every campaign before it goes live.'],
              ['Share your link', 'Supporters open it and write to their own representatives. It takes them about two minutes.'],
              ['Track results', 'Actions, analytics, a whip board for legislator positions, and funder-ready reports all live on this dashboard.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-medium text-gray-900 dark:text-white">{title}</span>
                  <span className="block text-sm text-gray-600 dark:text-gray-400">{body}</span>
                </span>
              </li>
            ))}
          </ol>
          {!isDemo && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/campaign/create" className="text-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg">
                Create your first campaign
              </Link>
              <Link href="/dashboard/settings" className="text-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg">
                Set up your organization
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {federalCampaigns.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Federal campaigns</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{federalCampaigns.map(renderCampaignCard)}</div>
            </section>
          )}
          {[...stateGroups.entries()].map(([st, list]) => (
            <section key={st} className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">State campaigns · {st}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{list.map(renderCampaignCard)}</div>
            </section>
          ))}
          {storytellingCampaigns.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Storytelling campaigns</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{storytellingCampaigns.map(renderCampaignCard)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
