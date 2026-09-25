import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import type { RepNewsArticle } from '@/lib/types';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function parseRssItems(xml: string): { title: string; link: string; source: string; pubDate: string }[] {
  const items: { title: string; link: string; source: string; pubDate: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? '';
    const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() ?? '';
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';
    if (title && link) items.push({ title, link, source, pubDate });
  }
  return items;
}

/**
 * GET /api/local-officials/news?name=...&city=...
 * Fetches Google News RSS for a local official.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get('name');
  const city = searchParams.get('city');

  if (!name || !city) {
    return NextResponse.json({ error: 'Missing name or city parameter' }, { status: 400 });
  }

  // feed_cache keys user_id as uuid, so the old 'public' sentinel errored on
  // every call and this cache never hit; content_cache is the shared store.
  const cacheKey = `local-news:${name}:${city}`;
  const admin = createAdminClient();
  const { data: cached } = await admin
    .from('content_cache')
    .select('data, created_at')
    .eq('cache_key', cacheKey)
    .single();

  if (cached && Date.now() - new Date(cached.created_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ articles: cached.data });
  }

  // Fetch from Google News RSS
  const query = `"${name}" "${city}" when:7d`;
  const articles: RepNewsArticle[] = [];

  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&num=10&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyDemocracy/1.0)' },
    });

    if (res.ok) {
      const xml = await res.text();
      const items = parseRssItems(xml);
      for (const item of items) {
        if (articles.length >= 5) break;
        articles.push({
          type: 'news',
          title: item.title,
          link: item.link,
          source: item.source,
          pubDate: item.pubDate,
          rep_name: name,
          rep_id: '',
          level: 'local',
        });
      }
    }
  } catch {
    // Non-blocking — return empty if fetch fails
  }

  // Cache result (best-effort, don't block response)
  try {
    await admin
      .from('content_cache')
      .upsert(
        { cache_key: cacheKey, data: articles, created_at: new Date().toISOString() },
        { onConflict: 'cache_key' }
      );
  } catch {
    // Ignore cache write failures
  }

  return NextResponse.json({ articles });
}
