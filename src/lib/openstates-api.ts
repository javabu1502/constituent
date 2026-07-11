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
 * @deprecated Open States retired the GraphQL endpoint; every call fails.
 * Remaining callers (rep feed + legislator activity person queries) need
 * migration to REST — kept only so they compile until then.
 */
export async function openstatesFetch(query: string, variables: Record<string, unknown>): Promise<Response> {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) throw new Error('OPENSTATES_API_KEY not configured');
  await rateGate();
  return fetch('https://v3.openstates.org/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000),
  });
}
