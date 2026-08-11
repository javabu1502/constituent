import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { listStateCommittees } from '@/lib/state-committees';
import { getCommitteesForMember } from '@/lib/legislators';

export const metadata: Metadata = { title: 'Legislator Intel | My Democracy', robots: { index: false } };

/**
 * Legislator intel — everything the org knows about ONE lawmaker, across all
 * of its campaigns: committees, whip status per bill (with outcomes),
 * constituent pressure, and the meeting-note timeline. The "walk into the
 * meeting prepared" page.
 */

const POSITION_LABELS: Record<string, string> = {
  for: 'Leaning yes', committed: 'Committed', uncommitted: 'Uncommitted', against: 'Opposed',
};
const POSITION_STYLES: Record<string, string> = {
  for: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  committed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  uncommitted: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  against: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};
const OUTCOME_LABELS: Record<string, string> = {
  passed: 'Passed', failed: 'Failed', died_committee: 'Died in committee', vetoed: 'Vetoed', withdrawn: 'Withdrawn',
};

export default async function LegislatorIntelPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('account_type').eq('user_id', user.id).single();
  if (profile?.account_type !== 'organization') redirect('/dashboard');

  // Everything scopes to this org's campaigns.
  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id, slug, headline, bill_ref, bill_state, direction, outcome, parent_campaign_id')
    .eq('creator_id', user.id);
  const campaignById = new Map((campaigns ?? []).map((c) => [c.id as string, c]));
  const campaignIds = [...campaignById.keys()];

  const [{ data: positions }, { data: notes }, { data: messages }] = await Promise.all([
    admin
      .from('legislator_positions')
      .select('campaign_id, legislator_name, legislator_party, legislator_chamber, position, updated_at')
      .eq('creator_id', user.id)
      .eq('legislator_id', id),
    admin
      .from('campaign_notes')
      .select('campaign_id, body, created_at')
      .eq('creator_id', user.id)
      .eq('legislator_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
    campaignIds.length
      ? admin
          .from('messages')
          .select('campaign_id, advocate_name, advocate_city, message_intent, created_at')
          .in('campaign_id', campaignIds)
          .eq('legislator_id', id)
          .order('created_at', { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as { campaign_id: string; advocate_name: string | null; advocate_city: string | null; message_intent: string | null; created_at: string }[] }),
  ]);

  // Identity: whip rows first, message rows as fallback.
  const first = positions?.[0];
  const name = first?.legislator_name ?? 'Legislator';
  const party = first?.legislator_party ?? null;
  const chamber = first?.legislator_chamber ?? null;

  // Committee memberships: federal ids resolve directly; state ids scan the
  // states this org campaigns in.
  let committees: string[] = [];
  if (id.startsWith('ocd-person/')) {
    const states = [...new Set((campaigns ?? []).map((c) => c.bill_state as string | null).filter(Boolean))] as string[];
    for (const st of states) {
      for (const c of listStateCommittees(st)) {
        if (c.members.includes(id)) committees.push(`${c.name} (${c.chamber === 'lower' ? 'Assembly' : c.chamber === 'upper' ? 'Senate' : 'Joint'})`);
      }
    }
  } else {
    committees = getCommitteesForMember(id);
  }

  const msgs = messages ?? [];
  const thankCount = msgs.filter((m) => m.message_intent === 'thank').length;
  const msgByCampaign = new Map<string, number>();
  for (const m of msgs) msgByCampaign.set(m.campaign_id, (msgByCampaign.get(m.campaign_id) || 0) + 1);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const chamberLabel = chamber === 'lower' ? 'Assembly / House' : chamber === 'upper' ? 'Senate' : chamber;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
        &larr; Back to Dashboard
      </Link>

      {/* Identity */}
      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {[party, chamberLabel].filter(Boolean).join(' · ')}
        </p>
        {committees.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {committees.map((c) => (
              <span key={c} className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Your bills, their status */}
      <section className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Your campaigns &amp; where they stand</h2>
        {(positions ?? []).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No whip positions recorded yet — set one from a campaign&apos;s whip board.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {(positions ?? []).map((p) => {
              const c = campaignById.get(p.campaign_id as string);
              if (!c) return null;
              return (
                <li key={p.campaign_id as string} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/campaign/${c.slug}/analytics`} className="text-sm font-medium text-gray-900 dark:text-white hover:underline">
                      {c.bill_ref ? `${c.bill_ref} — ` : ''}{c.headline}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {c.outcome ? OUTCOME_LABELS[c.outcome as string] ?? c.outcome : 'Ongoing'}
                      {msgByCampaign.get(p.campaign_id as string) ? ` · ${msgByCampaign.get(p.campaign_id as string)} constituent message${msgByCampaign.get(p.campaign_id as string) !== 1 ? 's' : ''} to them` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${POSITION_STYLES[p.position as string] ?? ''}`}>
                    {POSITION_LABELS[p.position as string] ?? p.position}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Constituent pressure */}
      <section className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Constituent pressure</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {msgs.length.toLocaleString()} message{msgs.length !== 1 ? 's' : ''} from constituents across your campaigns
          {thankCount > 0 ? ` (${thankCount} thank-you${thankCount !== 1 ? 's' : ''})` : ''} — your &ldquo;mention it in the
          meeting&rdquo; number.
        </p>
        {msgs.length > 0 && (
          <ul className="space-y-1 max-h-56 overflow-y-auto">
            {msgs.slice(0, 30).map((m, i) => (
              <li key={i} className="text-xs text-gray-600 dark:text-gray-400">
                <span className="text-gray-400 dark:text-gray-500 mr-1.5">{fmt(m.created_at)}</span>
                {m.advocate_name || 'A constituent'}
                {m.advocate_city ? ` (${m.advocate_city})` : ''}
                {m.message_intent === 'thank' ? ' — thank-you' : ''}
                {campaignById.get(m.campaign_id) ? ` · ${campaignById.get(m.campaign_id)!.bill_ref ?? ''}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Meeting notes */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Meeting notes</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Every conversation your team has logged with this lawmaker. Add new notes from the campaign whip board.
        </p>
        {(notes ?? []).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {(notes ?? []).map((n, i) => (
              <li key={i} className="border-l-2 border-purple-300 dark:border-purple-700 pl-3">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {fmt(n.created_at)}
                  {campaignById.get(n.campaign_id) ? ` · ${campaignById.get(n.campaign_id)!.bill_ref ?? campaignById.get(n.campaign_id)!.headline}` : ''}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
