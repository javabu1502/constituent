import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { isGatedPath, isUsRequest, isMonitoringProbe, GEO_BLOCKED_BODY } from '@/lib/geo-gate';

/**
 * Content-Security-Policy.
 *
 * script-src carries 'unsafe-inline' because Next.js inlines its hydration
 * payload and nothing here mints a nonce for it yet. That is the honest
 * state: this policy does NOT stop script injection, and anyone reading it
 * should not believe it does. What it does stop is the rest of the family,
 * which is free to close and which an injected tag needs just as much:
 * rewriting relative URLs with a <base> tag, posting a form to somewhere
 * else, loading a plugin, or framing the site.
 *
 * Tightening script-src to a nonce plus 'strict-dynamic' is the real fix and
 * is a separate piece of work, because every inline script has to carry the
 * nonce or the page stops rendering.
 *
 * The allowed hosts are the ones the app actually loads: Turnstile for the
 * bot check, Google Maps for the supporter map, Supabase for data and for
 * campaign logos, Vercel for analytics. img-src stays broad: legislator
 * photos come from congress.gov, unitedstates.io, state legislature sites
 * and a long tail of others.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://maps.googleapis.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://maps.googleapis.com https://*.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src https://challenges.cloudflare.com https://www.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': CSP,
};

function applySecurityHeaders(response: NextResponse, pathname?: string): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  // /embed/* exists to be iframed on third-party sites — every other route
  // keeps the DENY above.
  if (pathname?.startsWith('/embed/')) {
    response.headers.delete('X-Frame-Options');
    // Keep the rest of the policy; only the framing rule differs. Replacing
    // the whole header here would have dropped base-uri and form-action on
    // the one set of pages that renders inside somebody else's site.
    response.headers.set(
      'Content-Security-Policy',
      CSP.replace("frame-ancestors 'none'", 'frame-ancestors *'),
    );
  }
  return response;
}

// --- White-label custom domains ---
// An org's domain (CNAME'd to us and attached to the Vercel project) serves
// its campaign page at "/", keeping the org's domain in the address bar.
// Everything else on that host (assets, /api/*) passes through unchanged so
// the campaign page's relative calls keep working.

const PLATFORM_HOSTS = new Set(['www.mydemocracy.app', 'mydemocracy.app']);
const DOMAIN_TTL_MS = 5 * 60 * 1000;
const domainCache = new Map<string, { slug: string | null; expires: number }>();

function isPlatformHost(rawHost: string): boolean {
  const host = rawHost.split(':')[0].toLowerCase();
  return (
    PLATFORM_HOSTS.has(host) ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.vercel.app')
  );
}

async function resolveCustomDomain(host: string): Promise<string | null> {
  const cached = domainCache.get(host);
  if (cached && cached.expires > Date.now()) return cached.slug;

  let slug: string | null = null;
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (base && key) {
      const res = await fetch(
        `${base}/rest/v1/campaigns?custom_domain=eq.${encodeURIComponent(host)}&approval_status=eq.approved&status=eq.active&select=slug&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{ slug?: string }>;
        slug = rows?.[0]?.slug ?? null;
      }
    }
  } catch {
    // Fail open to normal routing.
  }
  domainCache.set(host, { slug, expires: Date.now() + DOMAIN_TTL_MS });
  return slug;
}

export async function middleware(request: NextRequest) {
  // Skip session refresh for auth callback — the route handler
  // needs the PKCE code verifier cookie untouched.
  if (request.nextUrl.pathname === '/auth/callback') {
    return applySecurityHeaders(NextResponse.next(), request.nextUrl.pathname);
  }

  // Acting costs money and ends at a congressional office, so it is gated to
  // the United States. Reading is not. See src/lib/geo-gate.ts for why, and
  // for which paths count as acting.
  if (
    isGatedPath(request.nextUrl.pathname) &&
    !isUsRequest(request) &&
    !isMonitoringProbe(request)
  ) {
    return applySecurityHeaders(
      NextResponse.json(GEO_BLOCKED_BODY, { status: 403 }),
      request.nextUrl.pathname,
    );
  }

  // Custom domain root → that org's campaign page.
  const host = request.headers.get('host') || '';
  if (host && !isPlatformHost(host) && request.nextUrl.pathname === '/') {
    const slug = await resolveCustomDomain(host.split(':')[0].toLowerCase());
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/campaign/${slug}`;
      return applySecurityHeaders(NextResponse.rewrite(url), request.nextUrl.pathname);
    }
  }

  const response = await updateSession(request);
  return applySecurityHeaders(response, request.nextUrl.pathname);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
