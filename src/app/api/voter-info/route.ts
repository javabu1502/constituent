import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * GET /api/voter-info
 * Fetches address-specific voter info from Google Civic Information API.
 * Only returns data near elections. Returns { available: false } otherwise.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');

  if (!address) {
    // Try to get address from user profile
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ available: false, reason: 'No address provided' });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('street, city, state, zip')
      .eq('user_id', user.id)
      .single();

    if (!profile?.street || !profile?.city || !profile?.state || !profile?.zip) {
      return NextResponse.json({ available: false, reason: 'No address in profile' });
    }

    const fullAddress = `${profile.street}, ${profile.city}, ${profile.state} ${profile.zip}`;
    return fetchVoterInfo(fullAddress);
  }

  return fetchVoterInfo(address);
}

async function fetchVoterInfo(address: string) {
  // Check cache
  const cacheKey = `voterinfo:${address}`;
  const admin = createAdminClient();
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', 'public')
    .eq('feed_type', cacheKey)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  // Fetch from Google Civic Information API
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ available: false, reason: 'API key not configured' });
  }

  try {
    const url = `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      // 400 = no election data available (normal between elections)
      const result = { available: false, reason: 'No election data available for this address' };
      // Cache the "no data" result too (shorter TTL)
      try {
        await admin
          .from('feed_cache')
          .upsert(
            { user_id: 'public', feed_type: cacheKey, data: result, fetched_at: new Date().toISOString() },
            { onConflict: 'user_id,feed_type' }
          );
      } catch { /* ignore */ }
      return NextResponse.json(result);
    }

    const data = await res.json();

    const result = {
      available: true,
      election: data.election || null,
      pollingLocations: (data.pollingLocations || []).map(mapLocation),
      earlyVoteSites: (data.earlyVoteSites || []).map(mapLocation),
      dropOffLocations: (data.dropOffLocations || []).map(mapLocation),
      contests: (data.contests || []).map(mapContest),
    };

    // Cache result
    try {
      await admin
        .from('feed_cache')
        .upsert(
          { user_id: 'public', feed_type: cacheKey, data: result, fetched_at: new Date().toISOString() },
          { onConflict: 'user_id,feed_type' }
        );
    } catch { /* ignore */ }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ available: false, reason: 'Unable to fetch voter info' });
  }
}

function mapLocation(loc: Record<string, unknown>) {
  const addr = loc.address as Record<string, string> | undefined;
  return {
    name: (loc.name as string) || (loc.locationName as string) || '',
    address: addr
      ? [addr.line1, addr.city, addr.state, addr.zip].filter(Boolean).join(', ')
      : '',
    hours: (loc.pollingHours as string) || '',
    startDate: (loc.startDate as string) || '',
    endDate: (loc.endDate as string) || '',
    notes: (loc.notes as string) || '',
  };
}

function mapContest(contest: Record<string, unknown>) {
  return {
    type: (contest.type as string) || '',
    office: (contest.office as string) || '',
    district: contest.district ? (contest.district as Record<string, string>).name : '',
    candidates: ((contest.candidates as Record<string, string>[]) || []).map((c) => ({
      name: c.name || '',
      party: c.party || '',
    })),
  };
}
