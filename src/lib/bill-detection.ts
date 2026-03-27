import { congressFetch } from '@/lib/congress-api';
import { openstatesFetch } from '@/lib/openstates-api';
import { cacheGet, cacheSet, TTL } from '@/lib/cache';

export interface BillReference {
  raw: string;
  level: 'federal' | 'state';
  type: string;
  number: string;
}

export interface BillDetails {
  billNumber: string;
  title: string;
  sponsors: string[];
  status: string;
  summary: string;
  level: 'federal' | 'state';
}

// Federal bill prefixes → Congress.gov type codes
const FEDERAL_TYPE_MAP: Record<string, string> = {
  'H.R.': 'hr',
  'S.': 's',
  'H.Res.': 'hres',
  'S.Res.': 'sres',
  'H.J.Res.': 'hjres',
  'S.J.Res.': 'sjres',
  'H.Con.Res.': 'hconres',
  'S.Con.Res.': 'sconres',
};

// Build federal regex: match prefixes followed by optional space and digits
// Sort by length descending so longer prefixes match first (e.g. "H.J.Res." before "H.R.")
const federalPrefixes = Object.keys(FEDERAL_TYPE_MAP).sort((a, b) => b.length - a.length);
const federalPattern = new RegExp(
  `(${federalPrefixes.map(p => p.replace(/\./g, '\\.')).join('|')})\\s*(\\d+)`,
  'gi'
);

// State bill pattern
const statePattern = /\b(HB|SB|AB|HF|SF|HJR|SJR|HR|SR|SCR|HCR)\s*(\d+)\b/gi;

export function detectBillReferences(text: string): BillReference[] {
  const refs: BillReference[] = [];
  const seen = new Set<string>();

  // Federal
  let match: RegExpExecArray | null;
  federalPattern.lastIndex = 0;
  while ((match = federalPattern.exec(text)) !== null) {
    const prefix = match[1];
    const num = match[2];
    // Normalize prefix to canonical form
    const canonical = federalPrefixes.find(p => p.toLowerCase() === prefix.toLowerCase()) || prefix;
    const key = `federal-${canonical}-${num}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({
        raw: `${canonical} ${num}`,
        level: 'federal',
        type: FEDERAL_TYPE_MAP[canonical] || 'hr',
        number: num,
      });
    }
  }

  // State
  statePattern.lastIndex = 0;
  while ((match = statePattern.exec(text)) !== null) {
    const prefix = match[1].toUpperCase();
    const num = match[2];
    const key = `state-${prefix}-${num}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({
        raw: `${prefix} ${num}`,
        level: 'state',
        type: prefix,
        number: num,
      });
    }
  }

  return refs;
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

  const cacheKey = `bill-state-${state || 'any'}-${identifier}`;
  const cached = cacheGet<BillDetails>(cacheKey);
  if (cached) return cached;

  try {
    const query = `
      query($search: String!, $jurisdiction: String, $first: Int) {
        bills(searchQuery: $search, jurisdiction: $jurisdiction, first: $first) {
          edges {
            node {
              identifier
              title
              latestAction { description }
              sponsorships { name }
              abstracts { abstract }
            }
          }
        }
      }
    `;

    const jurisdiction = state ? `ocd-jurisdiction/country:us/state:${state.toLowerCase()}/government` : undefined;
    const res = await openstatesFetch(query, { search: identifier, jurisdiction, first: 1 });
    if (!res.ok) return null;

    const data = await res.json();
    const edges = data.data?.bills?.edges;
    if (!edges || edges.length === 0) return null;

    const bill = edges[0].node;

    const result: BillDetails = {
      billNumber: bill.identifier || identifier,
      title: bill.title || 'Untitled',
      sponsors: (bill.sponsorships || []).map((s: { name: string }) => s.name).slice(0, 5),
      status: bill.latestAction?.description || 'Unknown',
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
