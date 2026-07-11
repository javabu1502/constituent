import { NextRequest, NextResponse } from 'next/server';
import { openstatesRestFetch } from '@/lib/openstates-api';
import { US_STATES } from '@/lib/constants';

/**
 * GET /api/bills?state=NV&query=housing&page=1
 *
 * Searches state legislation via the Open States v3 REST API (GraphQL was
 * retired). Requires OPENSTATES_API_KEY. Page-based pagination.
 * Returns simplified bill objects: id, title, identifier, session, subjects,
 * status, url, sponsor, latest action.
 */

interface BillResult {
  id: string;
  identifier: string;
  title: string;
  session: string;
  subjects: string[];
  updatedAt: string;
  url: string;
  sponsor: string | null;
  latestAction: string | null;
  latestActionDate: string | null;
}

interface OpenStatesBill {
  id: string;
  identifier: string;
  title: string;
  session: string;
  subject: string[] | null;
  updated_at: string;
  openstates_url: string;
  latest_action_description: string | null;
  latest_action_date: string | null;
  sponsorships?: Array<{ name?: string }> | null;
}

/** v3 REST wants the full jurisdiction name ("Nevada"), not a 2-letter code. */
function jurisdictionName(state: string): string | null {
  const s = state.trim();
  if (/^[A-Za-z]{2}$/.test(s)) {
    return US_STATES.find((x) => x.code === s.toUpperCase())?.name ?? null;
  }
  return US_STATES.find((x) => x.name.toLowerCase() === s.toLowerCase())?.name ?? s;
}

export async function GET(request: NextRequest) {
  if (!process.env.OPENSTATES_API_KEY) {
    return NextResponse.json(
      { error: 'Bill search is not configured. Missing OPENSTATES_API_KEY.' },
      { status: 503 }
    );
  }

  const { searchParams } = request.nextUrl;
  const state = searchParams.get('state');
  const query = searchParams.get('query');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  if (!state || !query) {
    return NextResponse.json(
      { error: 'Both state and query parameters are required' },
      { status: 400 }
    );
  }

  const jurisdiction = jurisdictionName(state);
  if (!jurisdiction) {
    return NextResponse.json({ error: 'Unknown state' }, { status: 400 });
  }

  try {
    const response = await openstatesRestFetch('/bills', {
      jurisdiction,
      q: query,
      sort: 'latest_action_desc',
      per_page: '10',
      page: String(page),
      include: 'sponsorships',
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[bills] Open States API error:', response.status, errText.slice(0, 300));
      return NextResponse.json(
        { error: 'Failed to search bills' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const results: OpenStatesBill[] = Array.isArray(data.results) ? data.results : [];
    const pagination = data.pagination ?? { page, max_page: page, total_items: results.length };

    const bills: BillResult[] = results.map((b) => ({
      id: b.id,
      identifier: b.identifier,
      title: b.title,
      session: b.session || '',
      subjects: b.subject || [],
      updatedAt: b.updated_at,
      url: b.openstates_url,
      sponsor: b.sponsorships?.[0]?.name || null,
      latestAction: b.latest_action_description || null,
      latestActionDate: b.latest_action_date || null,
    }));

    return NextResponse.json({
      bills,
      totalCount: pagination.total_items ?? bills.length,
      hasNextPage: (pagination.page ?? page) < (pagination.max_page ?? page),
      page: pagination.page ?? page,
    });
  } catch (err) {
    console.error('[bills] Error:', err);
    return NextResponse.json(
      { error: 'Failed to search bills' },
      { status: 500 }
    );
  }
}
