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
  'BBC News': 'center',
  // New direct feed sources
  'The Dispatch': 'right-center',
  'National Review': 'right',
  'Reason': 'right-center',
  'PBS NewsHour': 'center',
  'Axios': 'center',
  'Roll Call': 'center',
  'Stateline': 'center',
  'Military Times': 'center',
  // Independent newsletters
  'Tangle': 'center',
  'Slow Boring': 'left-center',
  'The Liberal Patriot': 'center',
  'The Bulwark': 'right-center',
  'Popular Information': 'left-center',
};

// Focused Google News queries for civic/government news
const GOOGLE_NEWS_QUERIES = [
  'US Congress legislation',
  'state government policy',
];

// Direct RSS feeds — curated set matching AllSides-rated sources for balanced coverage
// Left / Lean Left / Center / Lean Right / Right represented
const DIRECT_FEEDS: { url: string; sourceName: string }[] = [
  // Center sources
  { url: 'https://feeds.apnews.com/rss/APNewsTopics/Politics', sourceName: 'AP News' },
  { url: 'https://www.pbs.org/newshour/feeds/rss/politics', sourceName: 'PBS NewsHour' },
  { url: 'https://api.axios.com/feed/', sourceName: 'Axios' },
  { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', sourceName: 'BBC News' },
  { url: 'https://thehill.com/feed/', sourceName: 'The Hill' },
  { url: 'https://rss.politico.com/politics-news.xml', sourceName: 'Politico' },
  // Lean Left sources
  { url: 'https://feeds.npr.org/1014/rss.xml', sourceName: 'NPR' },
  { url: 'https://feeds.propublica.org/propublica/main', sourceName: 'ProPublica' },
  { url: 'https://www.dropsitenews.com/feed', sourceName: 'Drop Site News' },
  // Lean Right / Right sources
  { url: 'https://www.nationalreview.com/feed/', sourceName: 'National Review' },
  { url: 'https://reason.com/feed/', sourceName: 'Reason' },
  { url: 'https://thedispatch.com/feed/', sourceName: 'The Dispatch' },
  // Congressional / state-focused
  { url: 'https://rollcall.com/feed/', sourceName: 'Roll Call' },
  { url: 'https://stateline.org/feed/', sourceName: 'Stateline' },
  // Independent newsletters (balanced mix)
  { url: 'https://www.readtangle.com/feed/', sourceName: 'Tangle' },
  { url: 'https://www.slowboring.com/feed', sourceName: 'Slow Boring' },
  { url: 'https://www.liberalpatriot.com/feed', sourceName: 'The Liberal Patriot' },
  { url: 'https://www.thebulwark.com/feed/', sourceName: 'The Bulwark' },
  { url: 'https://popular.info/feed', sourceName: 'Popular Information' },
];

const CACHE_KEY = 'civic-news';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Keyword-to-policy-area classification (checked against title + description)
const TOPIC_PATTERNS: { pattern: RegExp; topic: ArticleTopic }[] = [
  { pattern: /immigra|border\s+(wall|patrol|crisis|security)|asylum|migrant|deport|visa|daca|refugee|undocumented/i, topic: { issue: 'Immigration', issueCategory: 'Immigration' } },
  { pattern: /health\s?care|medicare|medicaid|obamacare|aca\b|prescription|opioid|mental health|reproductive|abortion|roe|planned parenthood|insulin|drug price/i, topic: { issue: 'Healthcare', issueCategory: 'Health' } },
  { pattern: /climate|environment|clean energy|renewable|emission|epa\b|pollution|carbon|fossil fuel|drilling|wildfire|paris accord/i, topic: { issue: 'Climate Change', issueCategory: 'Environmental Protection' } },
  { pattern: /gun\b|firearm|second amendment|mass shooting|assault weapon|background check|red flag law/i, topic: { issue: 'Gun Violence', issueCategory: 'Crime and Law Enforcement' } },
  { pattern: /education|student loan|school|teacher|college tuition|university|title ix|student debt|book ban/i, topic: { issue: 'Education', issueCategory: 'Education' } },
  { pattern: /\btax\b|irs\b|income tax|corporate tax|tax credit|tariff|trade war|import duty|tax cut|tax hike/i, topic: { issue: 'Tax Reform', issueCategory: 'Taxation' } },
  { pattern: /housing|rent\b|homeless|mortgage|affordable home|eviction|section 8|hud\b/i, topic: { issue: 'Affordable Housing', issueCategory: 'Housing and Community Development' } },
  { pattern: /social security|retirement|disability benefit|safety net|snap\b|food stamp|welfare/i, topic: { issue: 'Social Security', issueCategory: 'Social Welfare' } },
  { pattern: /veteran|va benefit|military|defense|pentagon|armed forces|troops|national guard/i, topic: { issue: 'Veterans', issueCategory: 'Armed Forces and National Security' } },
  { pattern: /voting right|election|ballot|gerrymandering|campaign finance|voter registration|electoral|primary|midterm|poll\b|caucus/i, topic: { issue: 'Elections', issueCategory: 'Government Operations and Politics' } },
  { pattern: /supreme court|judicial|judge|legal reform|court ruling|constitutional|overturned|dissent/i, topic: { issue: 'Supreme Court', issueCategory: 'Law' } },
  { pattern: /economy|inflation|job market|unemployment|wage|recession|cost of living|gdp|interest rate|federal reserve|stock market/i, topic: { issue: 'Cost of Living', issueCategory: 'Economics and Public Finance' } },
  { pattern: /infrastructure|road|bridge|transit|broadband|rail|highway|water system|amtrak/i, topic: { issue: 'Infrastructure', issueCategory: 'Transportation and Public Works' } },
  { pattern: /police|criminal justice|prison|sentencing|law enforcement|incarceration|bail|parole|death penalty|fentanyl/i, topic: { issue: 'Criminal Justice Reform', issueCategory: 'Crime and Law Enforcement' } },
  { pattern: /child care|family leave|foster|adoption|child welfare|childcare|parental leave|child tax/i, topic: { issue: 'Child Care', issueCategory: 'Families' } },
  { pattern: /\bai\b|artificial intelligence|data privacy|social media|tech regulat|tiktok|cybersecurity|big tech|antitrust/i, topic: { issue: 'AI & Tech', issueCategory: 'Science, Technology, Communications' } },
  { pattern: /ukraine|china|nato|foreign aid|diplomacy|sanction|russia|iran|israel|gaza|middle east|north korea|trade deal/i, topic: { issue: 'Foreign Policy', issueCategory: 'International Affairs' } },
  { pattern: /minimum wage|union|worker|labor|workplace|strike\b|overtime|gig economy|nlrb/i, topic: { issue: 'Worker Rights', issueCategory: 'Labor and Employment' } },
  // Broader catch-all patterns (checked last)
  { pattern: /executive order|white house|president\s+(sign|veto|order|announc|act)|oval office/i, topic: { issue: 'Executive Action', issueCategory: 'Government Operations and Politics' } },
  { pattern: /congress|senate\s+(vote|pass|block|confirm)|house\s+(vote|pass|block)|bipartisan|filibuster|legislation|lawmakers|appropriation|government shutdown|debt ceiling|spending bill|budget/i, topic: { issue: 'Congress', issueCategory: 'Government Operations and Politics' } },
  { pattern: /civil rights|discrimination|lgbtq|equality|title vii|affirmative action|dei\b|diversity/i, topic: { issue: 'Civil Rights', issueCategory: 'Civil Rights' } },
];

function classifyArticle(title: string, description?: string): ArticleTopic | null {
  // Check title first, then title + description combined for broader matching
  for (const { pattern, topic } of TOPIC_PATTERNS) {
    if (pattern.test(title)) return topic;
  }
  if (description) {
    const combined = `${title} ${description}`;
    for (const { pattern, topic } of TOPIC_PATTERNS) {
      if (pattern.test(combined)) return topic;
    }
  }
  return null;
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/^(the|a)\s+/i, '').trim().slice(0, 40);
}

// Source authority ranking (lower = more authoritative)
const SOURCE_AUTHORITY: Record<string, number> = {
  'AP News': 1,
  'Reuters': 1,
  'PBS NewsHour': 2,
  'BBC News': 2,
  'NPR': 2,
  'ProPublica': 3,
  'Roll Call': 3,
  'Axios': 4,
  'Politico': 4,
  'The Hill': 5,
  'The Intercept': 5,
  'The Dispatch': 5,
  'National Review': 5,
  'Reason': 5,
  'Washington Times': 6,
  'Stateline': 6,
  'Military Times': 6,
  'Drop Site News': 7,
  'Democracy Now!': 7,
  'Truthout': 8,
  'Jacobin': 8,
  // Independent newsletters
  'Tangle': 6,
  'Slow Boring': 7,
  'The Liberal Patriot': 7,
  'The Bulwark': 6,
  'Popular Information': 7,
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
const MAX_PER_TOPIC = 5;

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
    const description = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1]?.trim() ?? '';
    if (rawTitle && link) {
      items.push({ title: rawTitle, link, source, pubDate, topic: classifyArticle(rawTitle, description), lean: SOURCE_LEAN[source] ?? null });
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

    // Topic-aware diversity cap, then take top 40
    const diverseArticles = applyTopicCaps(dedupedArticles);
    const articles = diverseArticles.slice(0, 40);

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
