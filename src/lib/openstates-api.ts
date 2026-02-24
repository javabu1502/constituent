let lastFetch = 0;
const MIN_GAP = 1100; // ms — Open States rate limit is 1 req/sec

export async function openstatesFetch(query: string, variables: Record<string, unknown>): Promise<Response> {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) throw new Error('OPENSTATES_API_KEY not configured');
  const now = Date.now();
  const wait = Math.max(0, MIN_GAP - (now - lastFetch));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastFetch = Date.now();
  return fetch('https://openstates.org/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000),
  });
}
