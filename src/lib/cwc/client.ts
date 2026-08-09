import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { CWC_ENDPOINTS, type Chamber } from './constants';
import { buildCwcXml } from './xml';
import type { CwcDelivery } from './types';

/**
 * Outbound CWC calls must exit from our fixed QuotaGuard IPs (the House
 * whitelists them). Vercel/Next `fetch` runs on undici and ignores HTTPS_PROXY,
 * so we attach a ProxyAgent explicitly — but SCOPED to CWC requests only, via a
 * per-request dispatcher, NOT setGlobalDispatcher. A global dispatcher would
 * route every outbound call (Supabase, Anthropic, Congress.gov) through the
 * metered proxy, burning quota and adding latency to everything.
 *
 * Must run in the Node.js runtime (not Edge). See vercel.json maxDuration.
 */
let cachedProxy: ProxyAgent | null | undefined;

function cwcDispatcher(): ProxyAgent | undefined {
  if (cachedProxy === undefined) {
    const url = process.env.QUOTAGUARDSTATIC_URL;
    cachedProxy = url ? new ProxyAgent(url) : null;
  }
  return cachedProxy ?? undefined;
}

export interface CwcResult {
  ok: boolean;
  status: number;
  /** Parsed <Error> messages from the CWC schema validator, when present. */
  errors?: string[];
  /** Raw response body, for logging/debugging. */
  raw?: string;
}

type Mode = 'uat' | 'production';

function houseBase(mode: Mode): string {
  return mode === 'production' ? CWC_ENDPOINTS.house.production : CWC_ENDPOINTS.house.uat;
}

function senateBase(mode: Mode): string {
  const base = mode === 'production' ? CWC_ENDPOINTS.senate.production : CWC_ENDPOINTS.senate.test;
  if (!base) throw new Error(`Senate ${mode} endpoint not configured (set SCWC_${mode === 'production' ? 'PRODUCTION' : 'TEST'}_URL)`);
  return base;
}

/**
 * POST XML to a House CWC endpoint. `path` is `/v2/validate` (checks only, does
 * NOT save) or `/v2/message` (queues for delivery). The API key goes in the
 * query string per the House docs, sourced from env.
 */
async function postHouse(path: '/v2/validate' | '/v2/message', xml: string, mode: Mode): Promise<CwcResult> {
  const apiKey = requireKey(mode === 'production' ? 'CWC_HOUSE_API_KEY' : 'CWC_HOUSE_UAT_API_KEY');
  const url = `${houseBase(mode)}${path}?apikey=${encodeURIComponent(apiKey)}`;
  const res = await undiciFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
    dispatcher: cwcDispatcher(),
  });
  const raw = await res.text();
  return { ok: res.status >= 200 && res.status < 300, status: res.status, errors: parseErrors(raw), raw };
}

/** Validate a delivery's XML against the House schema without sending it. */
export function validateHouse(delivery: CwcDelivery, mode: Mode = 'uat'): Promise<CwcResult> {
  return postHouse('/v2/validate', buildCwcXml(delivery), mode);
}

/** Queue a delivery for actual delivery to a House office. */
export function sendHouse(delivery: CwcDelivery, mode: Mode = 'uat'): Promise<CwcResult> {
  return postHouse('/v2/message', buildCwcXml(delivery), mode);
}

/**
 * Confirm outbound requests exit from our static IPs. Routes a call to
 * QuotaGuard's echo service THROUGH the proxy and returns the observed IP(s).
 * Expect one of the two whitelisted addresses (they load-balance across both).
 */
export async function checkEgressIp(): Promise<string> {
  const res = await undiciFetch('https://ip.quotaguard.com', { dispatcher: cwcDispatcher() });
  return (await res.text()).trim();
}

function requireKey(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

/** The CWC schema validator returns `<Errors><Error>…</Error></Errors>`. */
function parseErrors(body: string): string[] | undefined {
  if (!body || !body.includes('<Error')) return undefined;
  const out: string[] = [];
  const re = /<Error>([\s\S]*?)<\/Error>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body))) out.push(match[1].trim());
  return out.length ? out : undefined;
}

// Senate send/validate intentionally omitted until the Senate testing key +
// exact endpoints are issued (SCWC_TEST_URL / SCWC_PRODUCTION_URL). The XML
// builder already targets the Senate schema, so wiring is a small addition.
export type { Chamber };
export { senateBase };
