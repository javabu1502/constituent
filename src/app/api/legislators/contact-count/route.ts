import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repId = searchParams.get('repId');

  if (!repId) {
    return NextResponse.json({ error: 'repId is required' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Get total count of messages for this legislator
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('legislator_id', repId);

    if (countError) {
      console.error('[contact-count] Error fetching count:', countError);
      return NextResponse.json({ count: 0, topIssues: [] });
    }

    // Get top 3 issue areas by frequency (from last 200 messages)
    const { data: recentMessages, error: issuesError } = await supabase
      .from('messages')
      .select('issue_area')
      .eq('legislator_id', repId)
      .order('created_at', { ascending: false })
      .limit(200);

    let topIssues: string[] = [];
    if (!issuesError && recentMessages && recentMessages.length > 0) {
      const issueCounts = new Map<string, number>();
      for (const msg of recentMessages) {
        if (msg.issue_area) {
          issueCounts.set(msg.issue_area, (issueCounts.get(msg.issue_area) || 0) + 1);
        }
      }
      topIssues = [...issueCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([issue]) => issue);
    }

    return NextResponse.json(
      { count: count ?? 0, topIssues },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[contact-count] Unexpected error:', error);
    return NextResponse.json({ count: 0, topIssues: [] });
  }
}
