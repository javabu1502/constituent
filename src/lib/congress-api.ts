let lastFetch = 0;
const MIN_GAP = 1100; // ms — Congress.gov rate limit is 1 req/sec

export async function congressFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, MIN_GAP - (now - lastFetch));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastFetch = Date.now();
  return fetch(url, { signal: AbortSignal.timeout(10000) });
}
