import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/spending?state=NV&district=3
 *
 * Fetches federal spending data from USAspending.gov API.
 * No API key required.
 */

interface SpendingResult {
  totalObligations: number;
  awardCount: number;
  byCategory: { name: string; amount: number; count: number }[];
  topRecipients: { name: string; amount: number; count: number }[];
  topAgencies: { name: string; amount: number; count: number }[];
  fiscalYear: number;
}

const USASPENDING_API = 'https://api.usaspending.gov/api/v2';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const state = searchParams.get('state')?.toUpperCase();
  const district = searchParams.get('district');

  if (!state) {
    return NextResponse.json({ error: 'State parameter is required' }, { status: 400 });
  }

  const currentYear = new Date().getFullYear();
  const fiscalYear = new Date().getMonth() >= 9 ? currentYear + 1 : currentYear;

  try {
    // Build location filters
    const locationFilter: Record<string, unknown> = {
      country: 'USA',
      state: state,
    };
    if (district) {
      locationFilter.district_current = district;
    }

    // Fetch spending by award type (category breakdown)
    const spendingByTypeRes = await fetch(`${USASPENDING_API}/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          time_period: [{ start_date: `${fiscalYear - 1}-10-01`, end_date: `${fiscalYear}-09-30` }],
          place_of_performance_locations: [locationFilter],
        },
        fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Agency', 'Award Type'],
        limit: 100,
        page: 1,
        sort: 'Award Amount',
        order: 'desc',
        subawards: false,
      }),
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    // Also fetch aggregate by category
    const spendingByCatRes = await fetch(`${USASPENDING_API}/search/spending_by_category/awarding_agency/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          time_period: [{ start_date: `${fiscalYear - 1}-10-01`, end_date: `${fiscalYear}-09-30` }],
          place_of_performance_locations: [locationFilter],
        },
        limit: 10,
        page: 1,
      }),
      next: { revalidate: 86400 },
    });

    // Parse individual awards
    let topRecipients: { name: string; amount: number; count: number }[] = [];
    let topAgencies: { name: string; amount: number; count: number }[] = [];
    let totalObligations = 0;
    let awardCount = 0;

    if (spendingByTypeRes.ok) {
      const awardsData = await spendingByTypeRes.json();
      awardCount = awardsData.page_metadata?.total || 0;

      // Aggregate by recipient
      const recipientMap = new Map<string, { amount: number; count: number }>();
      const agencyMap = new Map<string, { amount: number; count: number }>();

      for (const award of (awardsData.results || [])) {
        const amount = parseFloat(award['Award Amount']) || 0;
        totalObligations += amount;

        const recipient = award['Recipient Name'] || 'Unknown';
        const prev = recipientMap.get(recipient) || { amount: 0, count: 0 };
        recipientMap.set(recipient, { amount: prev.amount + amount, count: prev.count + 1 });

        const agency = award['Awarding Agency'] || 'Unknown';
        const prevAgency = agencyMap.get(agency) || { amount: 0, count: 0 };
        agencyMap.set(agency, { amount: prevAgency.amount + amount, count: prevAgency.count + 1 });
      }

      topRecipients = [...recipientMap.entries()]
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      topAgencies = [...agencyMap.entries()]
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
    }

    // Parse category spending (by awarding agency)
    let byCategory: { name: string; amount: number; count: number }[] = [];
    if (spendingByCatRes.ok) {
      const catData = await spendingByCatRes.json();
      byCategory = (catData.results || []).map((r: { name: string; amount: number; count: number }) => ({
        name: r.name || 'Unknown',
        amount: r.amount || 0,
        count: r.count || 0,
      }));

      // Use category total if it's larger (more accurate)
      const catTotal = byCategory.reduce((sum, c) => sum + c.amount, 0);
      if (catTotal > totalObligations) {
        totalObligations = catTotal;
      }
    }

    const result: SpendingResult = {
      totalObligations,
      awardCount,
      byCategory,
      topRecipients,
      topAgencies,
      fiscalYear,
    };

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' },
    });
  } catch (err) {
    console.error('[spending] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch spending data' }, { status: 500 });
  }
}
