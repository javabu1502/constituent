import { NextRequest, NextResponse } from 'next/server';
import { congressFetch } from '@/lib/congress-api';

/**
 * GET /api/bills/cosponsors?congress=119&type=hr&number=1234
 * Bioguide IDs of a federal bill's sponsor + current cosponsors, from
 * Congress.gov. Used by cosponsor-stage campaigns to map thank-you vs
 * persuade per official: a rep already on the bill gets gratitude, not a
 * pitch. Cached in-memory for an hour — cosponsor lists move slowly.
 */

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { bioguides: string[]; expires: number }>();

const BILL_TYPES = new Set(['hr', 's', 'hres', 'sres', 'hjres', 'sjres', 'hconres', 'sconres']);

export async function GET(request: NextRequest) {
  const congress = request.nextUrl.searchParams.get('congress') || '';
  const type = (request.nextUrl.searchParams.get('type') || '').toLowerCase();
  const number = request.nextUrl.searchParams.get('number') || '';

  if (!/^\d{2,3}$/.test(congress) || !BILL_TYPES.has(type) || !/^\d{1,5}$/.test(number)) {
    return NextResponse.json({ error: 'Invalid bill reference' }, { status: 400 });
  }

  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Bill data unavailable' }, { status: 503 });
  }

  const key = `${congress}/${type}/${number}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json({ bioguides: hit.bioguides });
  }

  try {
    const bioguides = new Set<string>();

    // Sponsor comes from the bill detail; they obviously back their own bill.
    const detailRes = await congressFetch(`https://api.congress.gov/v3/bill/${key}?api_key=${apiKey}`);
    if (detailRes.ok) {
      const detail = await detailRes.json();
      for (const s of detail?.bill?.sponsors ?? []) {
        if (s?.bioguideId) bioguides.add(s.bioguideId);
      }
    }

    // Cosponsors, paged. 250 is Congress.gov's max page size; two pages cover
    // every bill (House membership is 435).
    let url: string | null = `https://api.congress.gov/v3/bill/${key}/cosponsors?limit=250&api_key=${apiKey}`;
    for (let page = 0; url && page < 3; page++) {
      const res: Response = await congressFetch(url);
      if (!res.ok) break;
      const data = await res.json();
      for (const c of data?.cosponsors ?? []) {
        // Skip withdrawn cosponsors — thanking someone who pulled their name
        // off the bill would read as sarcasm.
        if (c?.bioguideId && !c?.sponsorshipWithdrawnDate) bioguides.add(c.bioguideId);
      }
      const next = data?.pagination?.next as string | undefined;
      url = next ? `${next}&api_key=${apiKey}` : null;
    }

    const list = [...bioguides];
    cache.set(key, { bioguides: list, expires: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ bioguides: list });
  } catch (err) {
    console.error('[cosponsors] fetch failed:', err);
    return NextResponse.json({ error: 'Bill data unavailable' }, { status: 502 });
  }
}
