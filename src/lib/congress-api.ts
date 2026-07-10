import { cacheGet, cacheSet, TTL } from '@/lib/cache';
import { callClaude, stripTags } from '@/lib/claude';

let lastFetch = 0;
const MIN_GAP = 1100; // ms — Congress.gov rate limit is 1 req/sec

export async function congressFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, MIN_GAP - (now - lastFetch));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastFetch = Date.now();
  return fetch(url, { signal: AbortSignal.timeout(10000) });
}

// --- Rich bill detail for bill-specific campaigns ---

const BILL_TYPE_LABELS: Record<string, string> = {
  hr: 'H.R.',
  s: 'S.',
  hres: 'H.Res.',
  sres: 'S.Res.',
  hjres: 'H.J.Res.',
  sjres: 'S.J.Res.',
  hconres: 'H.Con.Res.',
  sconres: 'S.Con.Res.',
};

const CONGRESS_URL_SEGMENTS: Record<string, string> = {
  hr: 'house-bill',
  s: 'senate-bill',
  hres: 'house-resolution',
  sres: 'senate-resolution',
  hjres: 'house-joint-resolution',
  sjres: 'senate-joint-resolution',
  hconres: 'house-concurrent-resolution',
  sconres: 'senate-concurrent-resolution',
};

export function formatBillRef(billType: string, billNumber: string): string {
  return `${BILL_TYPE_LABELS[billType.toLowerCase()] ?? billType.toUpperCase()} ${billNumber}`;
}

export function congressGovBillUrl(congress: number, billType: string, billNumber: string): string {
  const seg = CONGRESS_URL_SEGMENTS[billType.toLowerCase()] ?? 'house-bill';
  const suffix = congress % 10 === 1 && congress % 100 !== 11 ? 'st' : congress % 10 === 2 && congress % 100 !== 12 ? 'nd' : congress % 10 === 3 && congress % 100 !== 13 ? 'rd' : 'th';
  return `https://www.congress.gov/bill/${congress}${suffix}-congress/${seg}/${billNumber}`;
}

export interface BillCard {
  ref: string; // e.g. "H.R. 4890"
  title: string;
  url: string;
  summary: string | null; // plain-language "what it does"
  sponsor: { name: string; party: string | null; state: string | null } | null;
  cosponsorCount: number | null;
  latestAction: string | null;
  latestActionDate: string | null;
}

/**
 * Fetch rich bill detail from Congress.gov for a bill-specific campaign:
 * title, sponsor, cosponsor count, latest action, and a plain-language
 * summary (CRS summary when available, otherwise a one-off Claude gloss of
 * the official title). Cached for a day — this data changes slowly.
 */
export async function fetchBillCard(congress: number, billType: string, billNumber: string): Promise<BillCard | null> {
  const type = billType.toLowerCase();
  const cacheKey = `bill-card-${congress}-${type}-${billNumber}`;
  const cached = cacheGet<BillCard>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await congressFetch(
      `https://api.congress.gov/v3/bill/${congress}/${type}/${billNumber}?api_key=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const bill = data.bill;
    if (!bill) return null;

    const sponsorRaw = Array.isArray(bill.sponsors) ? bill.sponsors[0] : null;
    const sponsor = sponsorRaw
      ? {
          name: sponsorRaw.fullName || [sponsorRaw.firstName, sponsorRaw.lastName].filter(Boolean).join(' '),
          party: sponsorRaw.party || null,
          state: sponsorRaw.state || null,
        }
      : null;

    // Plain-language summary: prefer the CRS summary.
    let summary: string | null = null;
    try {
      const sumRes = await congressFetch(
        `https://api.congress.gov/v3/bill/${congress}/${type}/${billNumber}/summaries?api_key=${apiKey}`
      );
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        const summaries = sumData.summaries;
        if (Array.isArray(summaries) && summaries.length > 0) {
          const latest = summaries[summaries.length - 1];
          summary = stripTags(latest.text || '').trim().slice(0, 600) || null;
        }
      }
    } catch {
      // best-effort
    }

    // Fallback: a short neutral gloss of the official title.
    if (!summary && bill.title) {
      try {
        const gloss = await callClaude(
          'You explain US legislation in one plain, strictly neutral sentence for everyday readers. No advocacy, no adjectives of judgment. Respond with ONLY the sentence.',
          `Official bill title: "${bill.title}". In one sentence, what would this bill do?`,
          120
        );
        summary = gloss.trim().slice(0, 400) || null;
      } catch {
        // fine without
      }
    }

    const card: BillCard = {
      ref: formatBillRef(type, String(billNumber)),
      title: bill.title || 'Untitled',
      url: congressGovBillUrl(congress, type, String(billNumber)),
      summary,
      sponsor,
      cosponsorCount: typeof bill.cosponsors?.count === 'number' ? bill.cosponsors.count : null,
      latestAction: bill.latestAction?.text ? String(bill.latestAction.text).slice(0, 300) : null,
      latestActionDate: bill.latestAction?.actionDate || null,
    };

    cacheSet(cacheKey, card, TTL.ONE_DAY);
    return card;
  } catch (err) {
    console.warn(`[congress-api] bill card fetch failed for ${congress}/${type}/${billNumber}:`, err);
    return null;
  }
}
