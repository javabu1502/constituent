import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
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
    return applySecurityHeaders(NextResponse.next());
  }

  // Custom domain root → that org's campaign page.
  const host = request.headers.get('host') || '';
  if (host && !isPlatformHost(host) && request.nextUrl.pathname === '/') {
    const slug = await resolveCustomDomain(host.split(':')[0].toLowerCase());
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/campaign/${slug}`;
      return applySecurityHeaders(NextResponse.rewrite(url));
    }
  }

  const response = await updateSession(request);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
