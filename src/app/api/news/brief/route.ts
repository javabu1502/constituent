import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { callClaude } from '@/lib/claude';

const BRIEF_CACHE_KEY = 'civic-brief';
const BRIEF_TTL_MS = 24 * 60 * 60 * 1000; // one AI call per day
const NEWS_CACHE_KEY = 'civic-news';

interface CachedArticle {
  title: string;
  source: string;
  topic?: { issue: string } | null;
}

const SYSTEM_PROMPT = `You write a strictly nonpartisan daily civic brief for a civic-engagement site. Rules:
- Neutral, factual tone. No loaded language, no editorializing, no predictions.
- Focus on government actions and civic processes (votes, bills, rulings, elections, regulations) — what happened and why it matters to constituents.
- Do not favor or disparage any party, politician, or viewpoint.
- Each bullet is 1-2 plain sentences a busy reader can absorb in seconds.
Return ONLY a JSON array of exactly 3 strings. No markdown, no keys, no commentary.`;

function parseBullets(raw: string): string[] | null {
  try {
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start === -1 || end === -1) return null;
    const arr = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(arr)) return null;
    const bullets = arr.filter((b) => typeof b === 'string' && b.trim().length > 0).slice(0, 3);
    return bullets.length === 3 ? bullets : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/news/brief
 * A 3-bullet nonpartisan summary of today's top civic stories, generated
 * from the cached multi-source headlines and cached for 24 hours — so it
 * costs at most one small AI call per day.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { data: cachedBrief } = await supabase
      .from('feed_cache')
      .select('data, created_at')
      .eq('cache_key', BRIEF_CACHE_KEY)
      .single();

    if (cachedBrief) {
      const age = Date.now() - new Date(cachedBrief.created_at).getTime();
      if (age < BRIEF_TTL_MS) {
        return NextResponse.json(cachedBrief.data);
      }
    }

    // Source headlines: the cached civic-news feed; populate it if needed.
    let articles: CachedArticle[] = [];
    const { data: cachedNews } = await supabase
      .from('feed_cache')
      .select('data')
      .eq('cache_key', NEWS_CACHE_KEY)
      .single();
    if (cachedNews?.data?.articles?.length) {
      articles = cachedNews.data.articles;
    } else {
      try {
        const res = await fetch(new URL('/api/news/civic', request.nextUrl.origin), {
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) {
          const json = await res.json();
          articles = json.articles || [];
        }
      } catch {
        // fall through — no headlines, no brief
      }
    }

    if (articles.length < 5) {
      return NextResponse.json({ brief: null });
    }

    const headlines = articles
      .slice(0, 25)
      .map((a) => `- ${a.title} (${a.source}${a.topic?.issue ? `, ${a.topic.issue}` : ''})`)
      .join('\n');

    const raw = await callClaude(
      SYSTEM_PROMPT,
      `Today's civic and political headlines from a politically balanced set of sources:\n\n${headlines}\n\nWrite the 3-bullet daily civic brief.`,
      500
    );

    const bullets = parseBullets(raw);
    if (!bullets) {
      return NextResponse.json({ brief: null });
    }

    const payload = { brief: { bullets, generatedAt: new Date().toISOString() } };

    await supabase
      .from('feed_cache')
      .upsert(
        { cache_key: BRIEF_CACHE_KEY, data: payload, created_at: new Date().toISOString() },
        { onConflict: 'cache_key' }
      );

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[news-brief] Error:', err);
    return NextResponse.json({ brief: null });
  }
}
