import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { US_STATES } from '@/lib/constants';
import type { FeedArticle } from '@/lib/types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function stateCodeToName(code: string): string {
  const state = US_STATES.find((s) => s.code === code.toUpperCase());
  return state?.name ?? code;
}

function parseRssItems(xml: string, subtopic: string): FeedArticle[] {
  const articles: FeedArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? '';
    const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() ?? '';
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';

    if (title && link) {
      articles.push({ title, link, source, pubDate, subtopic });
    }
  }

  return articles;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', user.id)
    .eq('feed_type', 'issues')
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json({ articles: cached.data });
  }

  // Get distinct (issue_subtopic, legislator_level, advocate_state) combos from user's messages
  const { data: messages } = await admin
    .from('messages')
    .select('issue_subtopic, legislator_level, advocate_state')
    .or(`user_id.eq.${user.id},advocate_email.eq.${user.email}`);

  if (!messages || messages.length === 0) {
    return NextResponse.json({ articles: [] });
  }

  // Deduplicate combos, limit to 5
  const seen = new Set<string>();
  const combos: { subtopic: string; level: string; state: string }[] = [];

  for (const msg of messages) {
    if (!msg.issue_subtopic) continue;
    const key = `${msg.issue_subtopic}|${msg.legislator_level}|${msg.advocate_state}`;
    if (!seen.has(key)) {
      seen.add(key);
      combos.push({
        subtopic: msg.issue_subtopic,
        level: msg.legislator_level,
        state: msg.advocate_state,
      });
      if (combos.length >= 5) break;
    }
  }

  // Fetch Google News RSS for each combo
  const allArticles: FeedArticle[] = [];

  await Promise.all(
    combos.map(async ({ subtopic, level, state }) => {
      try {
        const query = level === 'state'
          ? `${subtopic}+${stateCodeToName(state)}`
          : subtopic;
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const xml = await res.text();
        const items = parseRssItems(xml, subtopic);
        allArticles.push(...items);
      } catch {
        // Skip failed fetches — partial results are fine
      }
    })
  );

  // Deduplicate by title, sort by date desc, take top 10
  const titleSeen = new Set<string>();
  const deduplicated = allArticles.filter((a) => {
    if (titleSeen.has(a.title)) return false;
    titleSeen.add(a.title);
    return true;
  });

  deduplicated.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  const top10 = deduplicated.slice(0, 10);

  // Upsert into feed_cache
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: user.id, feed_type: 'issues', data: top10, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json({ articles: top10 });
}
