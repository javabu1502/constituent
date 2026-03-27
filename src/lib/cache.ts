/**
 * Simple in-memory TTL cache for enrichment data.
 *
 * On Vercel serverless, module-level state persists across warm invocations
 * of the same function instance, so this cache reduces redundant API calls
 * for data that doesn't change frequently (votes, demographics, bills).
 *
 * Cache is bounded by MAX_ENTRIES to prevent unbounded memory growth.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MAX_ENTRIES = 500;

const store = new Map<string, CacheEntry<unknown>>();

/** Get a cached value, or null if missing/expired. */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

/** Store a value with a TTL in milliseconds. */
export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  // Evict oldest entries if at capacity
  if (store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value;
    if (firstKey !== undefined) store.delete(firstKey);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** TTL constants */
export const TTL = {
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
} as const;
