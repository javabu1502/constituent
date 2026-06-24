import { NextRequest, NextResponse } from 'next/server';
import { fetchFederalBillDetails } from '@/lib/bill-detection';
import { buildCongressBillUrl, SLUG_TO_TYPE } from '@/lib/research';
import { resolveLegiscanBill } from '@/lib/legiscan-api';
import { lookupLimiter, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/bills/resolve
 * Resolve a bill number (or a congress.gov / LegiScan URL) to its official
 * title and link, for the optional "related bill" on a campaign.
 *
 * Input: { level: 'federal' | 'state', state?: string, query: string }
 * Output: { found: true, level, ref, title, url } | { found: false }
 */

// Normalized federal prefix → Congress.gov API type code
const FED_PREFIX_TO_TYPE: Record<string, string> = {
  HR: 'hr',
  S: 's',
  HRES: 'hres',
  SRES: 'sres',
  HJRES: 'hjres',
  SJRES: 'sjres',
  HCONRES: 'hconres',
  SCONRES: 'sconres',
};

// API type code → display reference
const FED_TYPE_TO_DISPLAY: Record<string, string> = {
  hr: 'H.R.',
  s: 'S.',
  hres: 'H.Res.',
  sres: 'S.Res.',
  hjres: 'H.J.Res.',
  sjres: 'S.J.Res.',
  hconres: 'H.Con.Res.',
  sconres: 'S.Con.Res.',
};

function parseFederalQuery(
  query: string
): { type: string; number: string; congress: string } | null {
  // congress.gov URL, e.g. .../bill/119th-congress/house-bill/22
  const urlMatch = query.match(
    /congress\.gov\/bill\/(\d+)(?:th|st|nd|rd)-congress\/([a-z-]+)\/(\d+)/i
  );
  if (urlMatch) {
    const type = SLUG_TO_TYPE[urlMatch[2].toLowerCase()];
    if (!type) return null;
    return { type, number: urlMatch[3], congress: urlMatch[1] };
  }

  // Plain reference, e.g. "HR 22", "H.R.22", "S 1234", "H.J.Res. 5"
  const m = query.trim().match(/^([a-z][a-z.\s]*?)\s*(\d+)$/i);
  if (!m) return null;
  const prefix = m[1].replace(/[.\s]/g, '').toUpperCase();
  const type = FED_PREFIX_TO_TYPE[prefix];
  if (!type) return null;
  return { type, number: m[2], congress: '119' };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = lookupLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  let body: { level?: string; state?: string; query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const level = body.level;
  const query = (body.query || '').trim();
  if ((level !== 'federal' && level !== 'state') || !query) {
    return NextResponse.json({ error: 'level (federal|state) and query are required' }, { status: 400 });
  }

  if (level === 'federal') {
    const parsed = parseFederalQuery(query);
    if (!parsed) return NextResponse.json({ found: false });

    const details = await fetchFederalBillDetails(parsed.type, parsed.number);
    if (!details) return NextResponse.json({ found: false });

    const url = buildCongressBillUrl(parsed.type, parsed.number, parsed.congress);
    const display = FED_TYPE_TO_DISPLAY[parsed.type] || parsed.type.toUpperCase();
    return NextResponse.json({
      found: true,
      level: 'federal' as const,
      ref: `${display} ${parsed.number}`,
      title: details.title,
      url: url || `https://www.congress.gov/search?q=${encodeURIComponent(query)}`,
    });
  }

  // state
  const state = (body.state || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json({ error: 'A 2-letter state is required for state bills' }, { status: 400 });
  }

  const resolved = await resolveLegiscanBill(state, query);
  if (!resolved) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    level: 'state' as const,
    state,
    ref: resolved.ref,
    title: resolved.title,
    url: resolved.url,
  });
}
