import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { CWC_ENDPOINTS, MAX_MESSAGES_PER_SECOND, isInScwcMaintenanceWindow, type Chamber } from './constants';
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
    // QuotaGuard Shield HTTPS proxy (TLS to the proxy on :9294). undici's
    // ProxyAgent handles the CONNECT tunnel for HTTPS destinations.
    const url = process.env.QUOTAGUARD_URL;
    cachedProxy = url ? new ProxyAgent(url) : null;
  }
  return cachedProxy ?? undefined;
}

/**
 * FAIL-CLOSED egress guard: production CWC traffic must exit from the
 * whitelisted static IPs. Without QUOTAGUARD_URL the request would silently go
 * out from an ephemeral serverless IP — at best rejected by the whitelist, at
 * worst accepted and eroding the IP-trust story we gave the SAA. Refuse
 * instead. CWC_ALLOW_DIRECT_EGRESS=true is the explicit, documented override
 * for local diagnostics only.
 */
export function assertProxiedEgress(mode: Mode): void {
  if (mode !== 'production') return;
  if (process.env.QUOTAGUARD_URL) return;
  if (process.env.CWC_ALLOW_DIRECT_EGRESS === 'true') return;
  throw new Error(
    'QUOTAGUARD_URL is not set — refusing to send production CWC traffic from an ephemeral IP. Set QUOTAGUARD_URL (QuotaGuard Shield), or CWC_ALLOW_DIRECT_EGRESS=true to knowingly bypass for diagnostics.',
  );
}

// Env-overridable endpoints (the Senate URLs) must never be able to point CWC
// traffic — constituent PII plus our API key — anywhere but congressional
// infrastructure over TLS. A typo'd or tampered env var fails loudly here.
const ALLOWED_CWC_HOST = /(^|\.)house\.gov$|(^|\.)senate\.gov$/i;

export function assertCwcUrl(url: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label} is not a valid URL: ${JSON.stringify(url)}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${label} must be https:// — got ${parsed.protocol}//`);
  }
  if (!ALLOWED_CWC_HOST.test(parsed.hostname)) {
    throw new Error(`${label} host ${parsed.hostname} is not a house.gov/senate.gov host — refusing to send CWC traffic there`);
  }
  return url;
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
  return assertCwcUrl(mode === 'production' ? CWC_ENDPOINTS.house.production : CWC_ENDPOINTS.house.uat, `House ${mode} endpoint`);
}

function senateBase(mode: Mode): string {
  const base = mode === 'production' ? CWC_ENDPOINTS.senate.production : CWC_ENDPOINTS.senate.test;
  if (!base) throw new Error(`Senate ${mode} endpoint not configured (set SCWC_${mode === 'production' ? 'PRODUCTION' : 'TEST'}_URL)`);
  return assertCwcUrl(base, `Senate ${mode} endpoint (SCWC_${mode === 'production' ? 'PRODUCTION' : 'TEST'}_URL)`);
}

/**
 * POST XML to a House CWC endpoint. `path` is `/v2/validate` (checks only, does
 * NOT save) or `/v2/message` (queues for delivery). The API key goes in the
 * query string per the House docs, sourced from env.
 */
async function postHouse(path: '/v2/validate' | '/v2/message', xml: string, mode: Mode): Promise<CwcResult> {
  assertProxiedEgress(mode);
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
 * Fetch the list of offices currently accepting CWC mail. George requires this
 * be run before campaigns and that we only send to listed offices — Senate
 * participation is voluntary (~half of offices), and sending to a
 * non-participating office errors. Routed through the static-IP proxy.
 * Returns the raw JSON array from the House `/v2/offices` endpoint.
 */
export async function getActiveOffices(mode: Mode = 'uat'): Promise<unknown> {
  assertProxiedEgress(mode);
  const apiKey = requireKey(mode === 'production' ? 'CWC_HOUSE_API_KEY' : 'CWC_HOUSE_UAT_API_KEY');
  const url = `${houseBase(mode)}/v2/offices?apikey=${encodeURIComponent(apiKey)}`;
  const res = await undiciFetch(url, { dispatcher: cwcDispatcher() });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`getActiveOffices failed: HTTP ${res.status}`);
  }
  return res.json();
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

// --- Senate ---
// Fully env-driven so that when George issues the testing key + endpoints, we
// only set SCWC_TEST_URL / SCWC_TEST_API_KEY (and the prod pair) — no code
// change. The XML builder already targets the Senate RNG.

function requireSenateKey(mode: Mode): string {
  return requireKey(mode === 'production' ? 'SCWC_API_KEY' : 'SCWC_TEST_API_KEY');
}

/**
 * POST XML to the Senate CWC endpoint. The Senate has separate test and prod
 * hosts (test messages stay in the SAA sandbox for review, they don't reach
 * offices). The full endpoint URL comes from env; the apikey is appended as a
 * query param per the Senate technical docs. Senate returns 201 Created on
 * success. Routed through the static-IP proxy like the House path.
 */
async function postSenate(xml: string, mode: Mode): Promise<CwcResult> {
  assertProxiedEgress(mode);
  const base = senateBase(mode); // throws if SCWC_*_URL not configured or not a senate.gov https URL
  const apiKey = requireSenateKey(mode);
  const sep = base.includes('?') ? '&' : '?';
  const res = await undiciFetch(`${base}${sep}apikey=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
    dispatcher: cwcDispatcher(),
  });
  const raw = await res.text();
  return { ok: res.status >= 200 && res.status < 300, status: res.status, errors: parseErrors(raw), raw };
}

/**
 * Send a delivery to the Senate. mode 'uat' posts to the TEST endpoint (stays in
 * the SAA sandbox — safe; email saacwc@saa.senate.gov when a batch is ready for
 * review). There is no separate Senate validate endpoint — the test env IS the
 * validation path.
 */
export function sendSenate(delivery: CwcDelivery, mode: Mode = 'uat'): Promise<CwcResult> {
  return postSenate(buildCwcXml(delivery), mode);
}

/** Senate active offices (voluntary participation, ~half). Endpoint from env
 *  (SCWC_OFFICES_URL); George also provides a downloadable JSON in SOAPBox. */
export async function getActiveOfficesSenate(mode: Mode = 'uat'): Promise<unknown> {
  assertProxiedEgress(mode);
  const url = CWC_ENDPOINTS.senate.activeOffices;
  if (!url) throw new Error('SCWC_OFFICES_URL not set (Senate Get Active Offices endpoint)');
  assertCwcUrl(url, 'Senate active-offices endpoint (SCWC_OFFICES_URL)');
  const apiKey = process.env.SCWC_TEST_API_KEY || process.env.SCWC_API_KEY || '';
  const full = apiKey ? `${url}${url.includes('?') ? '&' : '?'}apikey=${encodeURIComponent(apiKey)}` : url;
  const res = await undiciFetch(full, { dispatcher: cwcDispatcher() });
  if (res.status < 200 || res.status >= 300) throw new Error(`getActiveOfficesSenate failed: HTTP ${res.status}`);
  return res.json();
}

// --- George's operational rules: active-offices filter + rate-limited batch ---

/** Parse an active-offices API response (shape varies) into a Set of codes. */
function parseOfficeCodes(data: unknown): Set<string> {
  const codes = new Set<string>();
  const add = (v: unknown) => { if (typeof v === 'string' && v.trim()) codes.add(v.trim()); };
  const arr = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { offices?: unknown[] }).offices)
      ? (data as { offices: unknown[] }).offices
      : [];
  for (const item of arr) {
    if (typeof item === 'string') add(item);
    else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      add(o.code ?? o.officeCode ?? o.office_code ?? o.id ?? o.MemberOffice ?? o.member_office);
    }
  }
  return codes;
}

/**
 * Fetch the currently-participating offices as a Set of codes, ready to hand to
 * the delivery router. George requires running this before campaigns and only
 * sending to listed offices. (Needs live API access to actually fetch.)
 */
export async function loadActiveOfficeCodes(chamber: 'house' | 'senate', mode: Mode = 'uat'): Promise<Set<string>> {
  const data = chamber === 'house' ? await getActiveOffices(mode) : await getActiveOfficesSenate(mode);
  return parseOfficeCodes(data);
}

/**
 * Send many deliveries while honoring George's 5–10 messages/second ceiling.
 * Sequential with fixed spacing (default 5/sec) so we never spike the endpoint;
 * one failure never aborts the batch — it's captured per-item.
 *
 * NOTE: this spacing is per-process COURTESY pacing only — it cannot hold the
 * ceiling across concurrent serverless instances. The authoritative limiter is
 * the Postgres rate-permit allocator inside sendCwcDelivery (rate-permit.ts);
 * pass a `send` that goes through sendCwcDelivery for any real batch.
 *
 * Refuses to START during an SCWC maintenance window (Sun 12a–6a, Wed 5a–7a
 * ET) — sends there hit intermittent outages and burn DeliveryIds on retries.
 * Pass `ignoreMaintenanceWindow: true` only for House-only batches (the
 * windows are Senate infrastructure); `now` is injectable for tests.
 */
export async function sendBatch<T extends CwcDelivery>(
  deliveries: T[],
  send: (d: T) => Promise<CwcResult>,
  opts: { maxPerSecond?: number; ignoreMaintenanceWindow?: boolean; now?: Date } = {},
): Promise<Array<{ delivery: T; result?: CwcResult; error?: string }>> {
  if (!opts.ignoreMaintenanceWindow && isInScwcMaintenanceWindow(opts.now ?? new Date())) {
    throw new Error(
      'SCWC maintenance window in progress (Sun 12a–6a / Wed 5a–7a US Eastern) — batch aborted; retry after the window',
    );
  }
  const rate = Math.max(1, Math.min(10, opts.maxPerSecond ?? MAX_MESSAGES_PER_SECOND));
  const gapMs = Math.ceil(1000 / rate);
  const out: Array<{ delivery: T; result?: CwcResult; error?: string }> = [];
  for (let i = 0; i < deliveries.length; i++) {
    const d = deliveries[i];
    try {
      out.push({ delivery: d, result: await send(d) });
    } catch (e) {
      out.push({ delivery: d, error: (e as Error).message });
    }
    if (i < deliveries.length - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
  return out;
}

export type { Chamber };
export { senateBase };
