import { congressFetch } from '@/lib/congress-api';
import { openstatesRestFetch } from '@/lib/openstates-api';
import { US_STATES } from '@/lib/constants';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';

// Pure parsing lives in @/lib/bills (no server deps, client-safe).
// Re-exported here so existing importers keep working unchanged.
export { detectBillReferences } from '@/lib/bills';
export type { BillReference } from '@/lib/bills';

export interface BillDetails {
  billNumber: string;
  title: string;
  sponsors: string[];
  status: string;
  summary: string;
  level: 'federal' | 'state';
}

export async function fetchFederalBillDetails(billType: string, billNumber: string): Promise<BillDetails | null> {
  const congress = '119';
  const cacheKey = `bill-fed-${congress}-${billType}-${billNumber}`;
  const cached = cacheGet<BillDetails>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return null;

  try {
    const billUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}?api_key=${apiKey}`;
    const res = await congressFetch(billUrl);
    if (!res.ok) return null;

    const data = await res.json();
    const bill = data.bill;
    if (!bill) return null;

    // Fetch summaries
    let summary = '';
    try {
      const summaryUrl = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}/summaries?api_key=${apiKey}`;
      const sumRes = await congressFetch(summaryUrl);
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        const summaries = sumData.summaries;
        if (summaries && summaries.length > 0) {
          // Get the most recent summary, strip HTML
          const latest = summaries[summaries.length - 1];
          summary = (latest.text || '').replace(/<[^>]*>/g, '').slice(0, 500);
        }
      }
    } catch {
      // Summary fetch is best-effort
    }

    // Extract sponsors
    const sponsors: string[] = [];
    if (bill.sponsors) {
      for (const s of bill.sponsors) {
        if (s.fullName || s.firstName) {
          sponsors.push(s.fullName || `${s.firstName} ${s.lastName}`);
        }
      }
    }

    // Determine status from latest action
    const status = bill.latestAction?.text || bill.status || 'Unknown';

    const result: BillDetails = {
      billNumber: bill.number || `${billType.toUpperCase()} ${billNumber}`,
      title: bill.title || 'Untitled',
      sponsors,
      status: typeof status === 'string' ? status.slice(0, 200) : 'Unknown',
      summary,
      level: 'federal',
    };

    cacheSet(cacheKey, result, TTL.ONE_WEEK);
    return result;
  } catch (err) {
    console.warn(`[bill-detection] Federal bill fetch failed for ${billType} ${billNumber}:`, err);
    return null;
  }
}

export async function fetchStateBillDetails(identifier: string, state?: string): Promise<BillDetails | null> {
  if (!process.env.OPENSTATES_API_KEY) return null;
  // v3 REST needs a jurisdiction (full state name) to search bills.
  const jurisdiction = state
    ? US_STATES.find((s) => s.code === state.toUpperCase())?.name ?? null
    : null;
  if (!jurisdiction) return null;

  const cacheKey = `bill-state-${state}-${identifier}`;
  const cached = cacheGet<BillDetails>(cacheKey);
  if (cached) return cached;

  try {
    const res = await openstatesRestFetch('/bills', {
      jurisdiction,
      q: identifier,
      per_page: '1',
      include: ['sponsorships', 'abstracts'],
    });
    if (!res.ok) return null;

    const data = await res.json();
    const bill = Array.isArray(data.results) ? data.results[0] : null;
    if (!bill) return null;

    const result: BillDetails = {
      billNumber: bill.identifier || identifier,
      title: bill.title || 'Untitled',
      sponsors: (bill.sponsorships || []).map((s: { name?: string }) => s.name).filter(Boolean).slice(0, 5),
      status: bill.latest_action_description || 'Unknown',
      summary: (bill.abstracts?.[0]?.abstract || '').slice(0, 500),
      level: 'state',
    };

    cacheSet(cacheKey, result, TTL.ONE_DAY);
    return result;
  } catch (err) {
    console.warn(`[bill-detection] State bill fetch failed for ${identifier}:`, err);
    return null;
  }
}

export function buildBillDetailsBlock(bills: BillDetails[]): string {
  if (bills.length === 0) return '';

  const entries = bills.map(b => {
    const lines = [`${b.billNumber}: ${b.title}`];
    if (b.sponsors.length > 0) lines.push(`Sponsors: ${b.sponsors.join(', ')}`);
    if (b.status && b.status !== 'Unknown') lines.push(`Status: ${b.status}`);
    if (b.summary) lines.push(`Summary: ${b.summary}`);
    return lines.join('\n');
  });

  return `\nBILL DETAILS:\n${entries.join('\n\n')}`;
}
