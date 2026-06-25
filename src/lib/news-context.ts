/**
 * Recent-news retrieval for grounding AI output in timely, sourced facts.
 *
 * Queries Google News RSS (free, no key) for an issue, returns a compact block
 * of "[date] — headline (source)" lines from roughly the last few weeks. Cached
 * per normalized query (~45 min) in feed_cache, rate-limited, and fails open
 * (returns '') so a news outage can never block message/chat generation.
 *
 * The returned block is FACTUAL GROUNDING only — callers frame it with
 * instructions to use only the facts present, attributed to source/date.
 */

import { createAdminClient } from '@/lib/supabase';

const NEWS_CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes
const MIN_FETCH_INTERVAL_MS = 1000; // ~1s between live RSS fetches (per instance)
const MAX_AGE_DAYS = 28;

let lastLiveFetch = 0;

interface RssItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

// Reuses the RSS parsing pattern used by the news feed routes.
function parseRssItems(xml: string): RssItem[] {
  const articles: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? '';
    const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() ?? '';
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';
    if (title && link) articles.push({ title, link, source, pubDate });
  }
  return articles;
}

function isRecent(pubDate: string): boolean {
  if (!pubDate) return false; // require a date so we can label recency honestly
  const age = Date.now() - new Date(pubDate).getTime();
  return age >= 0 && age < MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function formatDate(pubDate: string): string {
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Google News titles are usually "Headline - Source Name"; trim the source suffix.
function cleanTitle(title: string, source: string): string {
  let t = decodeEntities(title).trim();
  if (source && t.toLowerCase().endsWith(source.toLowerCase())) {
    t = t.slice(0, t.length - source.length).replace(/\s*[-–—|]\s*$/, '').trim();
  }
  return t;
}

function normalizeQuery(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/**
 * Fetch recent news for an issue/topic. Returns a compact block of dated,
 * sourced headline lines (deduped across outlets), or '' if nothing recent /
 * on any error. The block contains NO instructions — callers add the framing.
 */
export async function fetchRecentNews(query: string): Promise<string> {
  const norm = normalizeQuery(query);
  if (norm.length < 3) return '';

  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
  } catch {
    admin = null; // no DB cache available — still do a live fetch
  }
  const cacheKey = `news-ctx-${norm.replace(/\s+/g, '-').slice(0, 60)}`;

  // Cache check (shared, keyed by normalized query)
  if (admin) {
    try {
      const { data: cached } = await admin
        .from('feed_cache')
        .select('data, fetched_at')
        .eq('user_id', 'public')
        .eq('feed_type', cacheKey)
        .single();
      if (cached && Date.now() - new Date(cached.fetched_at).getTime() < NEWS_CACHE_TTL_MS) {
        const block = (cached.data as { block?: string })?.block;
        if (typeof block === 'string') return block;
      }
    } catch {
      // cache miss / not found — continue to live fetch
    }
  }

  // Rate limit live fetches; fail open if we just fetched
  if (Date.now() - lastLiveFetch < MIN_FETCH_INTERVAL_MS) return '';
  lastLiveFetch = Date.now();

  try {
    const rssQuery = `${query} when:21d`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(rssQuery)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyDemocracy/1.0)' },
    });
    if (!res.ok) return '';

    const xml = await res.text();
    const items = parseRssItems(xml).filter((i) => isRecent(i.pubDate));

    // Dedupe across outlets — at most 2 per source, up to 5 total — so we don't
    // lean on a single outlet.
    const perSource = new Map<string, number>();
    const picked: RssItem[] = [];
    for (const it of items) {
      const src = (it.source || 'News').trim();
      const count = perSource.get(src) ?? 0;
      if (count >= 2) continue;
      perSource.set(src, count + 1);
      picked.push(it);
      if (picked.length >= 5) break;
    }
    if (picked.length === 0) return '';

    const lines = picked.map((it) => {
      const date = formatDate(it.pubDate);
      const title = cleanTitle(it.title, it.source);
      const src = it.source ? ` (${it.source})` : '';
      return `- ${date ? `${date} — ` : ''}${title}${src}`;
    });
    const block = lines.join('\n');

    // Cache the rendered block (best-effort)
    if (admin) {
      try {
        await admin.from('feed_cache').upsert(
          { user_id: 'public', feed_type: cacheKey, data: { block }, fetched_at: new Date().toISOString() },
          { onConflict: 'user_id,feed_type' }
        );
      } catch {
        // caching is best-effort
      }
    }

    return block;
  } catch {
    return '';
  }
}
