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

  // Build filtered query for issue rankings
  let issueQuery = admin
    .from('messages')
    .select('issue_area, issue_subtopic');

  if (since) issueQuery = issueQuery.gte('created_at', since);
  if (level !== 'all') issueQuery = issueQuery.eq('legislator_level', level);
  if (stateParam) issueQuery = issueQuery.eq('advocate_state', stateParam);

  // Stats queries — run all in parallel with the issues query
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: filteredMessages },
    { count: totalMessages },
    { count: messagesThisMonth },
    { data: stateData },
  ] = await Promise.all([
    issueQuery,
    admin.from('messages').select('*', { count: 'exact', head: true }),
    admin.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    admin.from('messages').select('advocate_state').limit(10000),
  ]);

  const issues = aggregateIssues(filteredMessages || []);

  const uniqueStates = new Set(
    (stateData || []).map((m) => m.advocate_state).filter(Boolean)
  );

  const stats = {
    totalMessages: totalMessages ?? 0,
    messagesThisMonth: messagesThisMonth ?? 0,
    statesRepresented: uniqueStates.size,
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

        let stateQuery = admin
          .from('messages')
          .select('issue_area, issue_subtopic')
          .eq('advocate_state', profile.state);

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
    { issues, stats, stateIssues, userState },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    }
  );
}
