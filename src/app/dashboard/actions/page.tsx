import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { isCampaignClosed } from '@/lib/campaign-close';
import { STAGE_GOAL_LABELS, stageOrder, type StageGoal } from '@/lib/stages';
import { resolveBillPositions } from '@/lib/card-bill-position';

export const metadata: Metadata = { title: 'Your advocacy actions | My Democracy', robots: { index: false } };

type Row = Record<string, string | number | null>;

/**
 * Every advocacy action an organization is running, on one page.
 *
 * Until now each view was scoped to one campaign. An organization with a
 * dozen campaigns and twenty actions could see any single one of them and
 * could not answer the question they actually open the dashboard with on a
 * Monday: what is live, what is quiet, and what needs me today.
 *
 * The order is the point. Actions whose bill has moved past what they ask
 * for come first, because that is the one thing here nobody can see any
 * other way and the one thing that goes stale on its own. Live actions
 * follow, quietest first: an action collecting nothing is either finished or
 * forgotten, and both deserve a look. Closed actions sit at the bottom as a
 * record.
 */
export default async function DashboardActionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('account_type')
    .eq('user_id', user.id)
    .single();
  if (profile?.account_type !== 'organization') redirect('/dashboard');

  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id, slug, headline, status, action_count, created_at, parent_campaign_id, stage_goal, bill_ref, bill_level, bill_state, bill_congress, bill_type, bill_number, campaign_type')
    .eq('creator_id', user.id);

  const all = (campaigns ?? []) as Row[];
  const parents = new Map(all.filter((c) => !c.parent_campaign_id).map((c) => [String(c.id), c]));
  const actions = all.filter((c) => c.parent_campaign_id);

  const positions = await resolveBillPositions(
    [...parents.values()].map((c) => ({
      id: String(c.id),
      bill_level: (c.bill_level as string | null) ?? null,
      bill_state: (c.bill_state as string | null) ?? null,
      bill_ref: (c.bill_ref as string | null) ?? null,
      bill_congress: (c.bill_congress as number | null) ?? null,
      bill_type: (c.bill_type as string | null) ?? null,
      bill_number: (c.bill_number as string | null) ?? null,
    })),
    all.map((c) => ({
      parent_campaign_id: (c.parent_campaign_id as string | null) ?? null,
      stage_goal: (c.stage_goal as string | null) ?? null,
      created_at: (c.created_at as string | null) ?? null,
    })),
  );

  // An action is "behind" when its own goal sits earlier on the journey than
  // where the parent's bill has got to. The parent's warning already knows
  // this; here it is attributed to the action that is actually stale.
  const rows = actions.map((a) => {
    const parent = parents.get(String(a.parent_campaign_id));
    const pos = parent ? positions.get(String(parent.id)) : undefined;
    const closed = isCampaignClosed(a.status as string | null);
    const goal = (a.stage_goal ?? '') as StageGoal;

    let behind: string | null = null;
    if (!closed && pos?.behind && parent) {
      // Only the newest action carries the parent's warning; an older one
      // being behind is expected, not a problem.
      const newest = actions
        .filter((x) => x.parent_campaign_id === a.parent_campaign_id)
        .sort((x, y) => stageOrder((y.stage_goal as string) || null) - stageOrder((x.stage_goal as string) || null))[0];
      if (newest && newest.id === a.id) behind = pos.behind;
    }

    return {
      id: String(a.id),
      slug: String(a.slug),
      headline: String(a.headline ?? ''),
      goalLabel: STAGE_GOAL_LABELS[goal] ?? 'Custom action',
      messages: Number(a.action_count) || 0,
      closed,
      behind,
      parentSlug: parent ? String(parent.slug) : null,
      parentName: parent ? String(parent.bill_ref || parent.headline || '') : 'Campaign removed',
    };
  });

  const needsAttention = rows.filter((r) => r.behind);
  const live = rows.filter((r) => !r.closed && !r.behind).sort((a, b) => a.messages - b.messages);
  const closed = rows.filter((r) => r.closed).sort((a, b) => b.messages - a.messages);

  const Row = ({ r, dim = false }: { r: (typeof rows)[number]; dim?: boolean }) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 border-t border-rule dark:border-gray-700">
      <div className="flex-1 min-w-0" style={{ flexBasis: '220px' }}>
        <Link
          href={`/campaign/${r.slug}/analytics`}
          className={`block text-[15px] font-semibold hover:text-purple-700 dark:hover:text-purple-300 ${dim ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}
        >
          {r.headline}
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {r.goalLabel}
          {r.parentSlug ? ' · ' : ''}
          {r.parentSlug && (
            <Link href={`/campaign/${r.parentSlug}/analytics`} className="hover:underline">
              {r.parentName}
            </Link>
          )}
        </p>
      </div>
      <div className="text-right" style={{ minWidth: '86px' }}>
        <p className={`text-base font-bold ${dim ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {r.messages.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">message{r.messages === 1 ? '' : 's'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your advocacy actions</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Every action across every campaign. {live.length} live, {closed.length} closed.
      </p>

      {rows.length === 0 && (
        <div className="mt-6 bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            An action is one ask inside a campaign: recruit cosponsors, pass committee, win the floor vote. You add
            them from a campaign&rsquo;s page.
          </p>
          <Link href="/dashboard" className="inline-block mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg">
            Go to your campaigns
          </Link>
        </div>
      )}

      {needsAttention.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-800 dark:text-orange-400">
            The bill has moved on
          </h2>
          <div className="mt-2 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/20 px-5 py-1">
            {needsAttention.map((r) => (
              <div key={r.id}>
                <Row r={r} />
                <p className="pb-3 text-xs text-orange-800 dark:text-orange-300">{r.behind}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {live.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Live, quietest first
          </h2>
          <div className="mt-2 bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 px-5 py-1">
            {live.map((r) => <Row key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Closed</h2>
          <div className="mt-2 bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 px-5 py-1">
            {closed.map((r) => <Row key={r.id} r={r} dim />)}
          </div>
        </section>
      )}
    </div>
  );
}
