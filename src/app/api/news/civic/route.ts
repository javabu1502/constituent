import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface ArticleTopic {
  issue: string;
  issueCategory: string;
}

type SourceLean = 'left' | 'left-center' | 'center' | 'right-center' | 'right';

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  topic: ArticleTopic | null;
  lean: SourceLean | null;
}

// Media bias ratings based on AllSides / Ad Fontes Media
const SOURCE_LEAN: Record<string, SourceLean> = {
  'AP News': 'center',
  'NPR': 'left-center',
  'ProPublica': 'left-center',
  'The Intercept': 'left',
  'Politico': 'center',
  'The Hill': 'center',
  'Drop Site News': 'left',
  'Democracy Now!': 'left',
  'Truthout': 'left',
  'Jacobin': 'left',
  // Common Google News sources
  'CNN': 'left-center',
  'Fox News': 'right',
  'MSNBC': 'left',
  'The Washington Post': 'left-center',
  'The New York Times': 'left-center',
  'The Wall Street Journal': 'center',
  'Reuters': 'center',
  'USA Today': 'left-center',
  'CBS News': 'left-center',
  'ABC News': 'left-center',
  'NBC News': 'left-center',
  'The Daily Wire': 'right',
  'Breitbart': 'right',
  'The Blaze': 'right',
  'Daily Caller': 'right',
  'Washington Examiner': 'right-center',
  'Washington Times': 'right-center',
  'New York Post': 'right-center',
  'The Federalist': 'right',
  'Newsweek': 'center',
  'The Atlantic': 'left-center',
  'Vox': 'left',
  'HuffPost': 'left',
  'Slate': 'left',
  'The Guardian': 'left-center',
  'BBC': 'center',
};

// Broader Google News queries
const GOOGLE_NEWS_QUERIES = [
  'US politics',
  'Congress',
  'White House',
  'state government policy',
];

// Direct RSS feeds (no API keys needed)
const DIRECT_FEEDS: { url: string; sourceName: string }[] = [
  // Major outlets
  { url: 'https://feeds.apnews.com/rss/APNewsTopics/Politics', sourceName: 'AP News' },
  { url: 'https://feeds.npr.org/1014/rss.xml', sourceName: 'NPR' },
  { url: 'https://rss.politico.com/politics-news.xml', sourceName: 'Politico' },
  { url: 'https://thehill.com/feed/', sourceName: 'The Hill' },
  { url: 'https://feeds.propublica.org/propublica/main', sourceName: 'ProPublica' },
  // Independent outlets
  { url: 'https://www.dropsitenews.com/feed', sourceName: 'Drop Site News' },
  { url: 'https://theintercept.com/feed/?rss', sourceName: 'The Intercept' },
  { url: 'https://www.democracynow.org/democracynow.rss', sourceName: 'Democracy Now!' },
  { url: 'https://truthout.org/feed/', sourceName: 'Truthout' },
  { url: 'https://jacobin.com/feed', sourceName: 'Jacobin' },
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

// Source authority ranking (lower = more authoritative)
const SOURCE_AUTHORITY: Record<string, number> = {
  'AP News': 1,
  'NPR': 2,
  'ProPublica': 3,
  'The Intercept': 4,
  'Politico': 5,
  'The Hill': 6,
  'Drop Site News': 7,
  'Democracy Now!': 7,
  'Truthout': 8,
  'Jacobin': 8,
};

function getSourceRank(source: string): number {
  return SOURCE_AUTHORITY[source] ?? 10;
}

/**
 * Extract significant words (4+ chars, lowercased) from a title.
 * Filters out common stop words that don't carry topic meaning.
 */
function getSignificantWords(title: string): Set<string> {
  const stopWords = new Set([
    'that', 'this', 'with', 'from', 'have', 'will', 'been', 'were', 'they',
    'their', 'what', 'when', 'where', 'which', 'about', 'would', 'could',
    'should', 'after', 'before', 'than', 'into', 'over', 'also', 'more',
    'some', 'says', 'said', 'here', 'just', 'does', 'your',
  ]);
  const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const significant = new Set<string>();
  for (const w of words) {
    if (w.length >= 4 && !stopWords.has(w)) {
      significant.add(w);
    }
  }
  return significant;
}

/**
 * Check if two sets of significant words overlap by 50% or more.
 * Overlap is measured against the smaller set.
 */
function titlesAreSimilar(wordsA: Set<string>, wordsB: Set<string>): boolean {
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  const smaller = wordsA.size <= wordsB.size ? wordsA : wordsB;
  const larger = wordsA.size <= wordsB.size ? wordsB : wordsA;
  let overlap = 0;
  smaller.forEach((w) => {
    if (larger.has(w)) overlap++;
  });
  return overlap / smaller.size >= 0.5;
}

/**
 * Near-duplicate removal: for articles with 50%+ keyword overlap,
 * keep the one from the more authoritative source, or the newer one.
 */
function deduplicateNearDuplicates(articles: NewsArticle[]): NewsArticle[] {
  const kept: { article: NewsArticle; words: Set<string> }[] = [];

  for (const article of articles) {
    const words = getSignificantWords(article.title);
    let isDuplicate = false;

    for (let i = 0; i < kept.length; i++) {
      if (titlesAreSimilar(words, kept[i].words)) {
        // Decide which to keep: prefer more authoritative source, then newer
        const existing = kept[i].article;
        const existingRank = getSourceRank(existing.source);
        const newRank = getSourceRank(article.source);

        if (newRank < existingRank ||
            (newRank === existingRank &&
             new Date(article.pubDate || 0).getTime() > new Date(existing.pubDate || 0).getTime())) {
          kept[i] = { article, words };
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      kept.push({ article, words });
    }
  }

  return kept.map((k) => k.article);
}

/** Max articles per topic category to ensure diversity */
const MAX_PER_TOPIC = 4;

/**
 * Enforce a cap of MAX_PER_TOPIC articles per issueCategory.
 * Articles with no topic (null) are uncapped.
 * Assumes input is already sorted by date descending.
 */
function applyTopicCaps(articles: NewsArticle[]): NewsArticle[] {
  const topicCounts = new Map<string, number>();
  const result: NewsArticle[] = [];

  for (const article of articles) {
    if (!article.topic) {
      result.push(article);
      continue;
    }
    const category = article.topic.issueCategory;
    const count = topicCounts.get(category) ?? 0;
    if (count < MAX_PER_TOPIC) {
      result.push(article);
      topicCounts.set(category, count + 1);
    }
  }

  return result;
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
      items.push({ title: rawTitle, link, source, pubDate, topic: classifyArticle(rawTitle), lean: SOURCE_LEAN[source] ?? null });
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

    // Near-duplicate removal (keyword overlap)
    const dedupedArticles = deduplicateNearDuplicates(allArticles);

    // Sort by date descending
    dedupedArticles.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    // Topic-aware diversity cap, then take top 20
    const diverseArticles = applyTopicCaps(dedupedArticles);
    const articles = diverseArticles.slice(0, 20);

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
