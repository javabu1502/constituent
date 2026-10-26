#!/usr/bin/env node
/**
 * check-external-links.mjs
 *
 * Fetches every external URL found in the voter / civic data files and reports
 * the ones that are genuinely broken. Run it before shipping changes to those
 * files, and on a schedule in the run-up to an election: the "Register to
 * Vote", "Check Registration" and "Election Office" buttons on the state hub
 * pages come straight out of this data, so a dead URL here is a dead end for a
 * real voter.
 *
 * Usage:
 *   npm run check-links
 *   node scripts/check-external-links.mjs --verbose        # list every URL, not just problems
 *   node scripts/check-external-links.mjs --concurrency 4 --timeout 30000
 *   node scripts/check-external-links.mjs src/data/foo.json # check specific files instead
 *
 * Exit codes:
 *   0  no genuine failures (bot-blocked and known-issue URLs are reported but tolerated)
 *   1  at least one URL genuinely failed
 *   2  the checker itself could not run (bad file, bad argument)
 *
 * Dependency-free on purpose: node builtins only.
 *
 * NOTE ON HEADERS: several of these hosts behave differently for non-browser
 * clients. registertovoteflorida.gov returns a bare 404 to a request with no
 * Accept header and a normal 200 to a browser, so we always send a full set of
 * browser headers and use GET rather than HEAD. Some ASP.NET portals (New
 * Mexico) bounce through an `AspxAutoDetectCookieSupport` redirect and will
 * loop forever unless cookies are carried across the redirect chain, so we
 * follow redirects manually with a per-URL cookie jar.
 */

import { readFile } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

const DEFAULT_FILES = [
  'src/data/voter-info.json',
  'src/data/state-meta.json',
  'src/data/advocacy-orgs.json',
  'src/data/local/nv.json',
];

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

/**
 * Statuses that mean "a bot was turned away", not "this link is broken".
 * A real browser gets through these, so they are reported but do not fail.
 */
const BOT_BLOCK_STATUSES = new Set([401, 403, 429]);

/**
 * URLs that are correct but do not currently return 2xx, with the reason.
 * These are reported separately and do not fail the run. Keep the list short
 * and delete entries as soon as they resolve: every line here is a link no
 * longer being checked.
 */
const KNOWN_ISSUES = new Map([
  [
    'https://voterservices.elections.maryland.gov/OnlineVoterRegistration/',
    'Maryland serves its own "Voter Registration is currently closed" page with HTTP 503 once the online registration deadline passes. The URL is the canonical one linked from elections.maryland.gov. Re-check after the election.',
  ],
  [
    'https://apps.legislature.ky.gov/record/public-input',
    'Kentucky 404. The replacement Testimony Request Form app (apps.legislature.ky.gov/committees/TestimonyRequestForm) 308-redirects to the legislature homepage out of session, so there is no verifiable target yet. Re-check when the General Assembly reconvenes.',
  ],
]);

function parseArgs(argv) {
  const opts = { verbose: false, concurrency: 6, timeout: 20000, files: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--verbose' || arg === '-v') opts.verbose = true;
    else if (arg === '--concurrency') opts.concurrency = Number(argv[++i]);
    else if (arg === '--timeout') opts.timeout = Number(argv[++i]);
    else if (arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}`);
    } else opts.files.push(arg);
  }
  if (!Number.isFinite(opts.concurrency) || opts.concurrency < 1) {
    throw new Error('--concurrency must be a positive number');
  }
  if (!Number.isFinite(opts.timeout) || opts.timeout < 1000) {
    throw new Error('--timeout must be at least 1000 (ms)');
  }
  if (opts.files.length === 0) opts.files = DEFAULT_FILES;
  return opts;
}

/** Walk a parsed JSON value and yield [jsonPath, url] for every http(s) string. */
function* collectUrls(node, trail = []) {
  if (typeof node === 'string') {
    if (/^https?:\/\//i.test(node.trim())) yield [trail.join('.'), node.trim()];
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* collectUrls(node[i], [...trail, i]);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) yield* collectUrls(v, [...trail, k]);
  }
}

function cookieHeader(jar) {
  if (jar.size === 0) return {};
  return { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') };
}

function storeCookies(jar, res) {
  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  for (const line of raw) {
    const pair = line.split(';', 1)[0];
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/**
 * GET a URL, following redirects by hand so that cookies set mid-chain are
 * carried forward (see the header note at the top of this file).
 */
async function probe(url, timeout, maxRedirects = 12) {
  const jar = new Map();
  let current = url;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    let res;
    try {
      res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: { ...BROWSER_HEADERS, ...cookieHeader(jar) },
        signal: AbortSignal.timeout(timeout),
      });
    } catch (err) {
      const cause = err?.cause?.code || err?.cause?.message || err?.name || '';
      return { status: 0, finalUrl: current, error: `${err.message}${cause ? ` (${cause})` : ''}` };
    }

    storeCookies(jar, res);

    const location = res.headers.get('location');
    if (REDIRECT_STATUSES.has(res.status) && location) {
      let next;
      try {
        next = new URL(location, current).toString();
      } catch {
        return { status: res.status, finalUrl: current, error: `bad Location header: ${location}` };
      }
      // Drain the body so the socket can be reused.
      await res.arrayBuffer().catch(() => {});
      current = next;
      continue;
    }

    let bytes = 0;
    try {
      bytes = (await res.arrayBuffer()).byteLength;
    } catch {
      /* body already consumed or truncated; status is what we care about */
    }
    return { status: res.status, finalUrl: current, bytes };
  }

  return { status: 0, finalUrl: current, error: `more than ${maxRedirects} redirects` };
}

/**
 * Node's bundled CA store is stricter than a browser's. Several state election
 * sites (Alaska, New Mexico, Connecticut, Illinois) serve an incomplete
 * certificate chain, omitting the intermediate; browsers recover by fetching
 * the missing intermediate from the AIA extension, Node's fetch does not and
 * throws UNABLE_TO_VERIFY_LEAF_SIGNATURE. Those sites load fine for a voter,
 * so reporting them as dead would be a false positive of exactly the kind this
 * script exists to avoid.
 *
 * This re-probe therefore skips verification *for diagnosis only*: we read the
 * HTTP status and nothing else, never the body, and the result is reported as a
 * TLS warning rather than a pass. Normal probes always verify.
 */
const TLS_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'CERT_UNTRUSTED',
  'ECONNRESET',
  'EPROTO',
]);

function diagnoseInsecure(url, timeout, hops = 0) {
  return new Promise((resolve) => {
    let target;
    try {
      target = new URL(url);
    } catch {
      resolve(null);
      return;
    }
    const req = https.request(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: 'GET',
        servername: target.hostname,
        rejectUnauthorized: false,
        headers: { ...BROWSER_HEADERS, Host: target.hostname },
        timeout,
      },
      (res) => {
        res.resume(); // discard the body; only the status matters here
        const location = res.headers.location;
        if (REDIRECT_STATUSES.has(res.status ?? res.statusCode) && location && hops < 5) {
          let next;
          try {
            next = new URL(location, url).toString();
          } catch {
            resolve({ status: res.statusCode, finalUrl: url });
            return;
          }
          resolve(diagnoseInsecure(next, timeout, hops + 1));
          return;
        }
        resolve({ status: res.statusCode, finalUrl: url });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

/** One retry on a network error or 5xx, since both are often transient. */
async function probeWithRetry(url, timeout) {
  let result = await probe(url, timeout);

  if (result.status === 0 || result.status >= 500) {
    await new Promise((r) => setTimeout(r, 1500));
    result = await probe(url, timeout);
  }

  // Distinguish "bad certificate chain, but the site is up" from "site is down".
  if (result.status === 0 && [...TLS_ERROR_CODES].some((c) => result.error?.includes(c))) {
    const insecure = await diagnoseInsecure(url, timeout);
    if (insecure && insecure.status >= 200 && insecure.status < 400) {
      return {
        ...result,
        tlsChainIssue: true,
        reachableStatus: insecure.status,
      };
    }
  }

  return result;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

function classify({ url, status, tlsChainIssue }) {
  if (KNOWN_ISSUES.has(url) && !(status >= 200 && status < 300)) return 'known';
  if (status >= 200 && status < 300) return 'ok';
  if (tlsChainIssue) return 'tls';
  if (BOT_BLOCK_STATUSES.has(status)) return 'blocked';
  return 'fail';
}

function describe(r) {
  const where = r.finalUrl && r.finalUrl !== r.url ? ` -> ${r.finalUrl}` : '';
  if (r.status === 0) return `ERR ${r.error}`;
  return `${r.status}${where}`;
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`check-external-links: ${err.message}`);
    return 2;
  }

  /** @type {{file: string, jsonPath: string, url: string}[]} */
  const targets = [];
  for (const rel of opts.files) {
    const abs = path.resolve(REPO_ROOT, rel);
    let parsed;
    try {
      parsed = JSON.parse(await readFile(abs, 'utf8'));
    } catch (err) {
      console.error(`check-external-links: cannot read ${rel}: ${err.message}`);
      return 2;
    }
    for (const [jsonPath, url] of collectUrls(parsed)) {
      targets.push({ file: rel, jsonPath, url });
    }
  }

  // Dedupe: the same URL often appears under many keys. Check it once, report
  // every place it is used.
  const byUrl = new Map();
  for (const t of targets) {
    if (!byUrl.has(t.url)) byUrl.set(t.url, []);
    byUrl.get(t.url).push(`${t.file}:${t.jsonPath}`);
  }
  const unique = [...byUrl.keys()];

  console.log(
    `Checking ${unique.length} unique URLs (${targets.length} references) across ${opts.files.length} files, concurrency ${opts.concurrency}, timeout ${opts.timeout}ms\n`
  );

  const results = await mapWithConcurrency(unique, opts.concurrency, async (url) => {
    const r = await probeWithRetry(url, opts.timeout);
    return { url, ...r, uses: byUrl.get(url) };
  });

  const groups = { ok: [], blocked: [], known: [], tls: [], fail: [] };
  for (const r of results) groups[classify(r)].push(r);

  if (opts.verbose) {
    console.log('--- all URLs ---');
    for (const r of [...results].sort((a, b) => a.url.localeCompare(b.url))) {
      console.log(`  [${classify(r).toUpperCase().padEnd(7)}] ${describe(r).padEnd(10)} ${r.url}`);
    }
    console.log('');
  }

  if (groups.blocked.length) {
    console.log(`--- ${groups.blocked.length} bot-blocked (a real browser gets through; not a failure) ---`);
    for (const r of groups.blocked) {
      console.log(`  ${String(r.status)}  ${r.url}`);
      console.log(`        used by: ${r.uses.join(', ')}`);
    }
    console.log('');
  }

  if (groups.tls.length) {
    console.log(
      `--- ${groups.tls.length} incomplete TLS certificate chain (site is up; browsers recover, Node does not; not a failure) ---`
    );
    for (const r of groups.tls) {
      console.log(`  reachable with verification off: HTTP ${r.reachableStatus}  ${r.url}`);
      console.log(`        used by: ${r.uses.join(', ')}`);
    }
    console.log('');
  }

  if (groups.known.length) {
    console.log(`--- ${groups.known.length} known issue(s), tolerated ---`);
    for (const r of groups.known) {
      console.log(`  ${describe(r)}  ${r.url}`);
      console.log(`        ${KNOWN_ISSUES.get(r.url)}`);
    }
    console.log('');
  }

  if (groups.fail.length) {
    console.log(`--- ${groups.fail.length} DEAD LINK(S) ---`);
    for (const r of groups.fail) {
      console.log(`  ${describe(r)}`);
      console.log(`        ${r.url}`);
      console.log(`        used by: ${r.uses.join(', ')}`);
    }
    console.log('');
  }

  console.log(
    `Summary: ${groups.ok.length} ok, ${groups.blocked.length} bot-blocked, ${groups.tls.length} tls-chain, ${groups.known.length} known, ${groups.fail.length} dead`
  );

  if (groups.fail.length) {
    console.error(`\ncheck-external-links FAILED: ${groups.fail.length} dead link(s).`);
    return 1;
  }
  console.log('\ncheck-external-links passed.');
  return 0;
}

process.exitCode = await main();
