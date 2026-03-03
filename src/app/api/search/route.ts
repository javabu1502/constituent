import { NextRequest, NextResponse } from 'next/server';
import { getAllFederalLegislators } from '@/lib/legislators';
import { createAdminClient } from '@/lib/supabase';
import { US_STATES } from '@/lib/constants';

// Build state name → code lookup for search expansion
const STATE_NAME_TO_CODE: Record<string, string> = {};
for (const s of US_STATES) {
  STATE_NAME_TO_CODE[s.name.toLowerCase()] = s.code.toLowerCase();
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json({ legislators: [], campaigns: [] });
  }

  // Expand state names to codes for better matching
  // e.g. "nevada senator" → also match "nv"
  const expandedTerms = q.split(/\s+/).map((term) => {
    const code = STATE_NAME_TO_CODE[term];
    return code ? [term, code] : [term];
  });

  // Search federal legislators (in-memory, fast)
  const allLegislators = getAllFederalLegislators();
  const matchedLegislators = allLegislators
    .filter((leg) => {
      const haystack = `${leg.name} ${leg.state} ${leg.party} ${leg.title}`.toLowerCase();
      return expandedTerms.every((alts) => alts.some((term) => haystack.includes(term)));
    })
    .slice(0, 8);

  // Search campaigns (Supabase ilike)
  let campaigns: { slug: string; headline: string; issue_area: string }[] = [];
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data } = await admin
        .from('campaigns')
        .select('slug, headline, issue_area')
        .eq('status', 'active')
        .or(`headline.ilike.%${q}%,description.ilike.%${q}%,issue_area.ilike.%${q}%`)
        .limit(5);
      campaigns = data ?? [];
    }
  } catch {
    // Supabase may not be configured; degrade gracefully
  }

  return NextResponse.json({
    legislators: matchedLegislators.map((l) => ({
      id: l.id,
      name: l.name,
      title: l.title,
      party: l.party,
      state: l.state,
      photoUrl: l.photoUrl,
    })),
    campaigns,
  });
}
