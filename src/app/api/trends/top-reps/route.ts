import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface RepCount {
  legislatorId: string;
  name: string;
  party: string;
  chamber: string;
  count: number;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: messages, error } = await supabase
      .from('messages')
      .select('legislator_id, legislator_name, legislator_party, legislator_chamber')
      .eq('legislator_level', 'federal');

    if (error) {
      console.error('[top-reps] Error fetching messages:', error);
      return NextResponse.json({ senate: [], house: [] });
    }

    // Aggregate counts by legislator
    const counts = new Map<string, { name: string; party: string; chamber: string; count: number }>();
    for (const msg of messages || []) {
      if (!msg.legislator_id) continue;
      const existing = counts.get(msg.legislator_id);
      if (existing) {
        existing.count++;
      } else {
        counts.set(msg.legislator_id, {
          name: msg.legislator_name || 'Unknown',
          party: msg.legislator_party || '',
          chamber: msg.legislator_chamber || '',
          count: 1,
        });
      }
    }

    // Split into Senate and House, sort by count, take top 10 each
    const allReps: RepCount[] = [...counts.entries()].map(([id, data]) => ({
      legislatorId: id,
      ...data,
    }));

    const senate = allReps
      .filter((r) => r.chamber.toLowerCase() === 'senate')
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const house = allReps
      .filter((r) => r.chamber.toLowerCase() === 'house')
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json(
      { senate, house },
      {
        headers: {
          // Short CDN window so newly-sent messages surface within a minute
          // (the previous 1h s-maxage made the list read as "not updating").
          // SWR still absorbs traffic spikes without hammering the DB.
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('[top-reps] Unexpected error:', error);
    return NextResponse.json({ senate: [], house: [] });
  }
}
