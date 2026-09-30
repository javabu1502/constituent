import { US_STATES } from './constants';

let lastFetch = 0;
const MIN_GAP = 1100; // ms — Open States rate limit is 1 req/sec

async function rateGate() {
  const now = Date.now();
  const wait = Math.max(0, MIN_GAP - (now - lastFetch));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastFetch = Date.now();
}

/**
 * Open States v3 REST fetch (the GraphQL API was retired — v3 is REST-only).
 * `path` like '/bills'; params are query-string values. Shares the 1 req/sec
 * rate gate across all Open States calls.
 */
export async function openstatesRestFetch(path: string, params: Record<string, string | string[]>): Promise<Response> {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) throw new Error('OPENSTATES_API_KEY not configured');
  await rateGate();
  const url = new URL(`https://v3.openstates.org${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, item));
    else url.searchParams.set(k, v);
  }
  return fetch(url.toString(), {
    headers: { 'X-API-KEY': apiKey },
    signal: AbortSignal.timeout(15000),
  });
}


/**
 * Open States v3 wants the full jurisdiction name ("Nevada"), not the
 * 2-letter code. Accepts either; returns null for an unknown code.
 */
export function jurisdictionName(state: string): string | null {
  const s = state.trim();
  if (/^[A-Za-z]{2}$/.test(s)) {
    return US_STATES.find((x) => x.code === s.toUpperCase())?.name ?? null;
  }
  return US_STATES.find((x) => x.name.toLowerCase() === s.toLowerCase())?.name ?? s;
}
