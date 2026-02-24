import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import type { FeedBill, Official } from '@/lib/types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchFederalBills(rep: Official): Promise<FeedBill[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.congress.gov/v3/member/${rep.id}/sponsored-legislation?limit=5&api_key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];

  const data = await res.json();
  const legislation = data.sponsoredLegislation ?? [];

  return legislation.map((bill: Record<string, unknown>) => ({
    bill_number: (bill.number as string) ?? '',
    title: (bill.title as string) ?? '',
    sponsor_name: rep.name,
    date: (bill.latestAction as Record<string, string>)?.actionDate ?? '',
    status: (bill.latestAction as Record<string, string>)?.text ?? '',
    rep_id: rep.id,
    level: 'federal' as const,
  }));
}

async function fetchStateBills(rep: Official): Promise<FeedBill[]> {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) return [];

  const query = `
    query($personId: String!) {
      bills(first: 5, sort: "updated_desc", sponsoredBy: $personId) {
        edges {
          node {
            identifier
            title
            updatedAt
            latestAction {
              description
            }
          }
        }
      }
    }
  `;

  const res = await fetch('https://v3.openstates.org/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({ query, variables: { personId: rep.id } }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const edges = data?.data?.bills?.edges ?? [];

  return edges.map((edge: Record<string, Record<string, unknown>>) => {
    const node = edge.node;
    return {
      bill_number: (node.identifier as string) ?? '',
      title: (node.title as string) ?? '',
      sponsor_name: rep.name,
      date: (node.updatedAt as string) ?? '',
      status: (node.latestAction as Record<string, string>)?.description ?? '',
      rep_id: rep.id,
      level: 'state' as const,
    };
  });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', user.id)
    .eq('feed_type', 'representatives')
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ bills: cached.data });
  }

  // Get cached reps from profile
  const { data: profile } = await admin
    .from('profiles')
    .select('representatives')
    .eq('user_id', user.id)
    .single();

  const reps: Official[] = profile?.representatives ?? [];

  if (reps.length === 0) {
    return NextResponse.json({ bills: [] });
  }

  // Fetch bills from both federal and state reps in parallel
  const billPromises = reps.map(async (rep) => {
    try {
      if (rep.level === 'federal') {
        return await fetchFederalBills(rep);
      } else if (rep.level === 'state') {
        return await fetchStateBills(rep);
      }
      return [];
    } catch {
      return [];
    }
  });

  const results = await Promise.all(billPromises);
  const allBills = results.flat();

  // Sort by date desc, deduplicate by bill_number
  allBills.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  const seen = new Set<string>();
  const deduplicated = allBills.filter((b) => {
    if (seen.has(b.bill_number)) return false;
    seen.add(b.bill_number);
    return true;
  });

  // Upsert into feed_cache
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: user.id, feed_type: 'representatives', data: deduplicated, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json({ bills: deduplicated });
}
