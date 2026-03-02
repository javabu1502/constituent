import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface ArticleTopic {
  issue: string;
  issueCategory: string;
}

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  topic: ArticleTopic | null;
}

// Broader Google News queries
const GOOGLE_NEWS_QUERIES = [
  'US politics',
  'Congress',
  'White House',
  'state government policy',
];

// Direct RSS feeds (no API keys needed)
const DIRECT_FEEDS: { url: string; sourceName: string }[] = [
  { url: 'https://feeds.apnews.com/rss/APNewsTopics/Politics', sourceName: 'AP News' },
  { url: 'https://feeds.npr.org/1014/rss.xml', sourceName: 'NPR' },
  { url: 'https://rss.politico.com/politics-news.xml', sourceName: 'Politico' },
  { url: 'https://thehill.com/feed/', sourceName: 'The Hill' },
  { url: 'https://feeds.propublica.org/propublica/main', sourceName: 'ProPublica' },
];

const CACHE_KEY = 'civic-news';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Keyword-to-policy-area classification
const TOPIC_PATTERNS: { pattern: RegExp; topic: ArticleTopic }[] = [
  { pattern: /immigra|border|asylum|migrant|deport|visa|daca|refugee/i, topic: { issue: 'Immigration', issueCategory: 'Immigration' } },
  { pattern: /health\s?care|medicare|medicaid|obamacare|aca|prescription|opioid|mental health|reproductive/i, topic: { issue: 'Healthcare', issueCategory: 'Health' } },
  { pattern: /climate|environment|clean energy|renewable|emission|epa|pollution|carbon/i, topic: { issue: 'Climate Change', issueCategory: 'Environmental Protection' } },
  { pattern: /gun|firearm|second amendment|mass shooting|assault weapon/i, topic: { issue: 'Gun Violence', issueCategory: 'Crime and Law Enforcement' } },
  { pattern: /education|student loan|school|teacher|college tuition/i, topic: { issue: 'Education', issueCategory: 'Education' } },
  { pattern: /tax|irs|income tax|corporate tax|tax credit|tariff/i, topic: { issue: 'Tax Reform', issueCategory: 'Taxation' } },
  { pattern: /housing|rent|homeless|mortgage|affordable home/i, topic: { issue: 'Affordable Housing', issueCategory: 'Housing and Community Development' } },
  { pattern: /social security|retirement|disability benefit|safety net/i, topic: { issue: 'Social Security', issueCategory: 'Social Welfare' } },
  { pattern: /veteran|va benefit|military|defense|pentagon/i, topic: { issue: 'Veterans', issueCategory: 'Armed Forces and National Security' } },
  { pattern: /voting right|election|ballot|gerrymandering|campaign finance/i, topic: { issue: 'Elections', issueCategory: 'Government Operations and Politics' } },
  { pattern: /supreme court|judicial|judge|legal reform/i, topic: { issue: 'Supreme Court', issueCategory: 'Law' } },
  { pattern: /economy|inflation|job|unemployment|wage|recession|cost of living/i, topic: { issue: 'Cost of Living', issueCategory: 'Economics and Public Finance' } },
  { pattern: /infrastructure|road|bridge|transit|broadband|rail/i, topic: { issue: 'Infrastructure', issueCategory: 'Transportation and Public Works' } },
  { pattern: /police|criminal justice|prison|sentencing|law enforcement/i, topic: { issue: 'Criminal Justice Reform', issueCategory: 'Crime and Law Enforcement' } },
  { pattern: /child care|family leave|foster|adoption|child welfare/i, topic: { issue: 'Child Care', issueCategory: 'Families' } },
  { pattern: /ai\b|artificial intelligence|data privacy|social media|tech regulat/i, topic: { issue: 'AI', issueCategory: 'Science, Technology, Communications' } },
  { pattern: /ukraine|china|nato|foreign aid|diplomacy|sanction/i, topic: { issue: 'Foreign Aid', issueCategory: 'International Affairs' } },
  { pattern: /minimum wage|union|worker|labor|workplace/i, topic: { issue: 'Worker Rights', issueCategory: 'Labor and Employment' } },
];

function classifyArticle(title: string): ArticleTopic | null {
  for (const { pattern, topic } of TOPIC_PATTERNS) {
    if (pattern.test(title)) return topic;
  }
  return null;
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/^(the|a)\s+/i, '').trim().slice(0, 40);
}

function parseRssItems(xml: string, fallbackSource?: string): NewsArticle[] {
  const items: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const rawTitle = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() ?? '';
    const link = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1]?.trim() ?? '';
    const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() || fallbackSource || '';
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';
    if (rawTitle && link) {
      items.push({ title: rawTitle, link, source, pubDate, topic: classifyArticle(rawTitle) });
    }
  }
  return items;
}

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * GET /api/news/civic
 * Multi-source civic news with topic classification, 2-hour Supabase cache
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Check cache
    const { data: cached } = await supabase
      .from('feed_cache')
      .select('data, created_at')
      .eq('cache_key', CACHE_KEY)
      .single();

    if (cached) {
      const age = Date.now() - new Date(cached.created_at).getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
      }
    }

    // Build all fetch promises
    const fetches: Promise<NewsArticle[]>[] = [];

    // Google News RSS queries
    for (const query of GOOGLE_NEWS_QUERIES) {
      const encoded = encodeURIComponent(`${query} when:3d`);
      fetches.push(
        fetchWithTimeout(`https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`)
          .then((xml) => (xml ? parseRssItems(xml) : []))
      );
    }

    // Direct RSS feeds
    for (const feed of DIRECT_FEEDS) {
      fetches.push(
        fetchWithTimeout(feed.url)
          .then((xml) => (xml ? parseRssItems(xml, feed.sourceName) : []))
      );
    }

    // Fetch all in parallel
    const results = await Promise.allSettled(fetches);

    // Deduplicate by normalized title
    const seen = new Set<string>();
    const allArticles: NewsArticle[] = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      for (const article of result.value) {
        const key = normalizeTitle(article.title);
        if (seen.has(key)) continue;
        seen.add(key);
        allArticles.push(article);
      }
    }

    // Sort by date descending, take top 20
    allArticles.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    const articles = allArticles.slice(0, 20);

    // Cache result
    await supabase
      .from('feed_cache')
      .upsert(
        { cache_key: CACHE_KEY, data: { articles }, created_at: new Date().toISOString() },
        { onConflict: 'cache_key' }
      );

    return NextResponse.json({ articles });
  } catch (err) {
    console.error('[civic-news] Error:', err);
    return NextResponse.json({ articles: [] });
  }
}
