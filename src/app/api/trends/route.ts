import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const period = searchParams.get('period') || 'all';
  const level = searchParams.get('level') || 'all';

  const admin = createAdminClient();

  // Build filtered query for issue rankings
  let issueQuery = admin
    .from('messages')
    .select('issue_area');

  if (period === 'week') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    issueQuery = issueQuery.gte('created_at', since);
  } else if (period === 'month') {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    issueQuery = issueQuery.gte('created_at', since);
  }

  if (level !== 'all') {
    issueQuery = issueQuery.eq('legislator_level', level);
  }

  const { data: filteredMessages } = await issueQuery;

  // Aggregate issue counts
  const issueCounts: Record<string, number> = {};
  for (const msg of filteredMessages || []) {
    const area = msg.issue_area;
    if (area) {
      issueCounts[area] = (issueCounts[area] || 0) + 1;
    }
  }
  const issues = Object.entries(issueCounts)
    .map(([issue_area, count]) => ({ issue_area, count }))
    .sort((a, b) => b.count - a.count);

  // Stats — always unfiltered
  const { count: totalMessages } = await admin
    .from('messages')
    .select('*', { count: 'exact', head: true });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: messagesThisMonth } = await admin
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo);

  const { data: stateData } = await admin
    .from('messages')
    .select('advocate_state');

  const uniqueStates = new Set(
    (stateData || []).map((m) => m.advocate_state).filter(Boolean)
  );

  const stats = {
    totalMessages: totalMessages ?? 0,
    messagesThisMonth: messagesThisMonth ?? 0,
    statesRepresented: uniqueStates.size,
  };

  // State-specific data for authenticated users
  let stateIssues: { issue_area: string; count: number }[] | undefined;
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
          .select('issue_area')
          .eq('advocate_state', profile.state);

        if (period === 'week') {
          const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          stateQuery = stateQuery.gte('created_at', since);
        } else if (period === 'month') {
          const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          stateQuery = stateQuery.gte('created_at', since);
        }

        if (level !== 'all') {
          stateQuery = stateQuery.eq('legislator_level', level);
        }

        const { data: stateMessages } = await stateQuery;

        const stateCounts: Record<string, number> = {};
        for (const msg of stateMessages || []) {
          const area = msg.issue_area;
          if (area) {
            stateCounts[area] = (stateCounts[area] || 0) + 1;
          }
        }
        stateIssues = Object.entries(stateCounts)
          .map(([issue_area, count]) => ({ issue_area, count }))
          .sort((a, b) => b.count - a.count);
      }
    }
  } catch {
    // Anonymous user — no state data
  }

  return NextResponse.json({ issues, stats, stateIssues, userState });
}
