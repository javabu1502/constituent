import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

function aggregateIssues(messages: { issue_area: string; issue_subtopic: string | null }[]) {
  const issueCounts: Record<string, number> = {};
  const subtopicCounts: Record<string, Record<string, number>> = {};
  for (const msg of messages) {
    const area = msg.issue_area;
    if (area) {
      issueCounts[area] = (issueCounts[area] || 0) + 1;
      const sub = msg.issue_subtopic;
      if (sub) {
        if (!subtopicCounts[area]) subtopicCounts[area] = {};
        subtopicCounts[area][sub] = (subtopicCounts[area][sub] || 0) + 1;
      }
    }
  }
  return Object.entries(issueCounts)
    .map(([issue_area, count]) => ({
      issue_area,
      count,
      subtopics: subtopicCounts[issue_area]
        ? Object.entries(subtopicCounts[issue_area])
            .map(([name, cnt]) => ({ name, count: cnt }))
            .sort((a, b) => b.count - a.count)
        : [],
    }))
    .sort((a, b) => b.count - a.count);
}

function buildTimeFilter(period: string): string | null {
  if (period === 'week') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (period === 'month') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const period = searchParams.get('period') || 'all';
  const level = searchParams.get('level') || 'all';
  const stateParam = searchParams.get('state');

  const admin = createAdminClient();
  const since = buildTimeFilter(period);

  // Demo/sandbox campaigns (slug prefix "demo-") must NEVER count toward
  // public trends — these numbers imply real constituents contacted real
  // officials, and that claim has to stay true.
  const { data: demoCampaigns } = await admin.from('campaigns').select('id').like('slug', 'demo-%');
  const demoIds = (demoCampaigns ?? []).map((c) => c.id as string);
  const demoFilter = demoIds.length ? `campaign_id.is.null,campaign_id.not.in.(${demoIds.join(',')})` : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excludeDemo = <T,>(q: T): T => (demoFilter ? (q as any).or(demoFilter) : q);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inPeriod = <T,>(q: T): T => (since ? (q as any).gte('created_at', since) : q);

  // Trends tells visitors what people around the country are writing about,
  // so it should not count us testing the form or a row where someone typed
  // "a" into the email box. Checked against the data rather than assumed:
  // these two rules remove 14 of 70, leaving 56 across 14 people.
  //
  // Seeded demo traffic is already gone: it lives in demo- campaigns and
  // excludeDemo drops all 759 rows of it.
  const OPERATOR_EMAILS = ['jvbusker@gmail.com', 'jared@mydemocracy.app', 'advocacy@mydemocracy.app'];
  const TEST_NAMES = ['Test Verification', 'Jane doe'];
  const realTraffic = <T,>(q: T): T =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      // An anonymous send has no address, and that is a real send.
      .or(`advocate_email.is.null,advocate_email.not.in.(${OPERATOR_EMAILS.join(',')})`)
      .or('advocate_email.is.null,advocate_email.like.*@*')
      .or(`advocate_name.is.null,advocate_name.not.in.(${TEST_NAMES.map((n) => `"${n}"`).join(',')})`);

  // Build filtered query for issue rankings
  let issueQuery = excludeDemo(
    admin
      .from('messages')
      .select('issue_area, issue_subtopic')
  );

  issueQuery = realTraffic(issueQuery);
  if (since) issueQuery = issueQuery.gte('created_at', since);
  if (level !== 'all') issueQuery = issueQuery.eq('legislator_level', level);
  if (stateParam) issueQuery = issueQuery.eq('advocate_state', stateParam);

  // Stats queries — run all in parallel with the issues query
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // The activity chart covers the period on screen. It used to be fixed at
  // thirty days, so All Time and This Month drew the same bars and moving
  // between them looked like nothing had happened.
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const chartSince = since ?? ninetyDaysAgo;

  // Recent messages respect the level/state filters (like the issue list) so
  // the activity chart and rising/cooling badges match what's on screen.
  let recentQuery = realTraffic(excludeDemo(
    admin
      .from('messages')
      .select('issue_area, created_at')
      .gte('created_at', chartSince)
      .limit(10000)
  ));
  if (level !== 'all') recentQuery = recentQuery.eq('legislator_level', level);
  if (stateParam) recentQuery = recentQuery.eq('advocate_state', stateParam);

  const [
    { data: filteredMessages },
    { count: totalMessages },
    { count: messagesThisMonth },
    { data: stateData },
    { data: recentMessages },
    { data: officialData },
    { data: campaignData },
  ] = await Promise.all([
    issueQuery,
    // Messages sent, states represented and officials contacted are counts of
    // the selected period. They ignored it before, so the six cards held the
    // same numbers whichever button was pressed. "This month" keeps its own
    // fixed window, because that is what it says.
    inPeriod(realTraffic(excludeDemo(admin.from('messages').select('*', { count: 'exact', head: true })))),
    realTraffic(excludeDemo(admin.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo))),
    inPeriod(realTraffic(excludeDemo(admin.from('messages').select('advocate_state').limit(10000)))),
    recentQuery,
    inPeriod(realTraffic(excludeDemo(admin.from('messages').select('legislator_name').limit(10000)))),
    admin.from('campaigns').select('story_count').eq('approval_status', 'approved').eq('is_official', true),
  ]);

  const issues = aggregateIssues(filteredMessages || []);

  // Reach: how activity is spread across the country.
  const stateCounts: Record<string, number> = {};
  for (const m of stateData || []) {
    if (m.advocate_state) stateCounts[m.advocate_state] = (stateCounts[m.advocate_state] || 0) + 1;
  }
  const topStates = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Use: messages per day for the 30-day activity chart.
  const dailyCounts: Record<string, number> = {};
  // Impact: per-issue momentum — last 7 days vs the 7 before that.
  const issueTrends: Record<string, { recent: number; previous: number }> = {};
  for (const m of recentMessages || []) {
    const ts = new Date(m.created_at).getTime();
    const day = new Date(m.created_at).toISOString().split('T')[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    if (m.issue_area && m.created_at >= fourteenDaysAgo) {
      const t = issueTrends[m.issue_area] ?? { recent: 0, previous: 0 };
      if (ts >= sevenDaysAgo) t.recent += 1;
      else t.previous += 1;
      issueTrends[m.issue_area] = t;
    }
  }

  const uniqueOfficials = new Set(
    (officialData || []).map((m) => m.legislator_name).filter(Boolean)
  );

  const storiesShared = (campaignData || []).reduce(
    (sum, c) => sum + (Number(c.story_count) || 0),
    0
  );

  const stats = {
    totalMessages: totalMessages ?? 0,
    messagesThisMonth: messagesThisMonth ?? 0,
    statesRepresented: Object.keys(stateCounts).length,
    officialsContacted: uniqueOfficials.size,
    storiesShared,
    activeCampaigns: campaignData?.length ?? 0,
  };

  // State-specific data for authenticated users
  let stateIssues: ReturnType<typeof aggregateIssues> | undefined;
  let userState: string | undefined;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await admin
        .from('profiles')
        .select('state')
        .eq('user_id', user.id)
        .single();

      if (profile?.state) {
        userState = profile.state;

        let stateQuery = excludeDemo(
          admin
            .from('messages')
            .select('issue_area, issue_subtopic')
            .eq('advocate_state', profile.state)
        );

        if (since) stateQuery = stateQuery.gte('created_at', since);
        if (level !== 'all') stateQuery = stateQuery.eq('legislator_level', level);

        const { data: stateMessages } = await stateQuery;
        stateIssues = aggregateIssues(stateMessages || []);
      }
    }
  } catch {
    // Anonymous user — no state data
  }

  return NextResponse.json(
    { issues, stats, stateIssues, userState, dailyCounts, issueTrends, topStates, period, chartSince },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    }
  );
}
