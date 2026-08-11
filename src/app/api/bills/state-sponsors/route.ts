import { NextRequest, NextResponse } from 'next/server';
import { openstatesRestFetch } from '@/lib/openstates-api';

/**
 * GET /api/bills/state-sponsors?state=NV&ref=AB%20123
 * ocd-person ids of a state bill's sponsors (primary + cosponsors), from the
 * Open States v3 API. The state-level counterpart of /api/bills/cosponsors:
 * cosponsor-stage campaigns thank legislators already on the bill and
 * persuade the rest. Cached for an hour; callers fail open without intent.
 */

const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { memberIds: string[]; expires: number }>();

type Sponsorship = { person?: { id?: string } | null };

export async function GET(request: NextRequest) {
  const state = (request.nextUrl.searchParams.get('state') || '').toUpperCase();
  const ref = (request.nextUrl.searchParams.get('ref') || '').trim();

  if (!/^[A-Z]{2}$/.test(state) || !/^[A-Za-z.]{1,10}\s?\d{1,6}$/.test(ref)) {
    return NextResponse.json({ error: 'Invalid bill reference' }, { status: 400 });
  }
  if (!process.env.OPENSTATES_API_KEY) {
    return NextResponse.json({ error: 'Bill data unavailable' }, { status: 503 });
  }

  const key = `${state}/${ref.toUpperCase()}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json({ memberIds: hit.memberIds });
  }

  try {
    // Newest session first — an identifier like "AB 123" recurs across
    // sessions, and campaigns are about the current bill.
    const res = await openstatesRestFetch('/bills', {
      jurisdiction: state,
      identifier: ref,
      sort: 'updated_desc',
      include: 'sponsorships',
      per_page: '1',
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Bill data unavailable' }, { status: 502 });
    }
    const data = await res.json();
    const bill = data?.results?.[0];
    const memberIds = [
      ...new Set(
        ((bill?.sponsorships ?? []) as Sponsorship[])
          .map((s) => s.person?.id)
          .filter((id): id is string => !!id && id.startsWith('ocd-person/'))
      ),
    ];
    cache.set(key, { memberIds, expires: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ memberIds });
  } catch (err) {
    console.error('[state-sponsors] fetch failed:', err);
    return NextResponse.json({ error: 'Bill data unavailable' }, { status: 502 });
  }
}
