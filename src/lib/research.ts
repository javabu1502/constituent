/**
 * Shared research utilities for fetching current legislative data.
 * Used by both the research-assist route and the interview chat.
 */

import { congressFetch } from './congress-api';
import { cacheGet, cacheSet, TTL } from './cache';

interface Bill {
  title?: string;
  type?: string;
  number?: string;
  congress?: number;
  latestAction?: { text?: string; actionDate?: string };
}

const TYPE_TO_SLUG: Record<string, string> = {
  hr: 'house-bill',
  s: 'senate-bill',
  hjres: 'house-joint-resolution',
  sjres: 'senate-joint-resolution',
  hconres: 'house-concurrent-resolution',
  sconres: 'senate-concurrent-resolution',
  hres: 'house-resolution',
  sres: 'senate-resolution',
};

/**
 * Fetch recent bills from the Congress API for a given policy area.
 * Results are cached for 1 day.
 */
export async function fetchRecentBills(policyArea: string): Promise<string> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return '';

  const cacheKey = `research-bills-${policyArea}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached !== null) return cached;

  try {
    const url = `https://api.congress.gov/v3/bill?policyArea=${encodeURIComponent(policyArea)}&sort=updateDate+desc&limit=5&api_key=${apiKey}`;
    const res = await congressFetch(url);
    if (!res.ok) return '';

    const data = await res.json();
    const bills: Bill[] = data.bills ?? [];
    if (bills.length === 0) return '';

    const lines = bills.map((b) => {
      const num = b.type && b.number ? `${b.type.toUpperCase()} ${b.number}` : '';
      const action = b.latestAction?.text ?? '';
      const slug = b.type ? TYPE_TO_SLUG[b.type.toLowerCase()] : null;
      const congress = b.congress ?? 119;
      const billUrl = slug && b.number
        ? `https://www.congress.gov/bill/${congress}th-congress/${slug}/${b.number}`
        : '';
      const urlPart = billUrl ? ` [View on Congress.gov](${billUrl})` : '';
      return `- ${num ? num + ': ' : ''}${b.title ?? 'Untitled'}${action ? ' (Latest: ' + action + ')' : ''}${urlPart}`;
    });

    const result = `\n\nRecent bills in Congress related to "${policyArea}":\n${lines.join('\n')}`;
    cacheSet(cacheKey, result, TTL.ONE_DAY);
    return result;
  } catch {
    return '';
  }
}

/**
 * Build a compact research context string for injection into prompts.
 */
export async function buildResearchContext(issueCategory: string, issue: string): Promise<string> {
  const billContext = await fetchRecentBills(issueCategory);
  if (!billContext) return '';

  return `\n\n--- CURRENT LEGISLATIVE CONTEXT (for your reference when helping the user) ---
The following are real, current bills in Congress related to the user's issue. You may reference these when helping the user formulate their ask. Only mention bills that are clearly relevant.
${billContext}
--- END LEGISLATIVE CONTEXT ---`;
}
