// Sliding window rate limiter using in-memory Map
// Works per-instance on Vercel — not globally distributed, but still effective

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  windowMs: number;     // e.g. 60_000 (1 minute)
  maxRequests: number;  // e.g. 10
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export function rateLimit(config: RateLimitConfig) {
  return {
    check(ip: string): { success: boolean; retryAfter?: number } {
      cleanup(config.windowMs);
      const now = Date.now();
      const entry = store.get(ip) ?? { timestamps: [] };

      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter(t => now - t < config.windowMs);

      if (entry.timestamps.length >= config.maxRequests) {
        const oldestInWindow = entry.timestamps[0];
        const retryAfter = Math.ceil((oldestInWindow + config.windowMs - now) / 1000);
        return { success: false, retryAfter };
      }

      entry.timestamps.push(now);
      store.set(ip, entry);
      return { success: true };
    },
  };
}

// Helper to extract client IP on Vercel
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '127.0.0.1';
}

// Pre-configured limiters for different route tiers
export const chatLimiter = rateLimit({ windowMs: 60_000, maxRequests: 20 });       // streaming, called frequently
export const researchLimiter = rateLimit({ windowMs: 60_000, maxRequests: 10 });    // streaming research
export const generateLimiter = rateLimit({ windowMs: 60_000, maxRequests: 5 });     // expensive generation
export const summaryLimiter = rateLimit({ windowMs: 60_000, maxRequests: 15 });     // has Supabase cache
