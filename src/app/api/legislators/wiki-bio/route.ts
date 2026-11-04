import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { summaryLimiter, getClientIp } from '@/lib/rate-limit';
import { titleFromUrl, tidy } from '@/lib/wiki-bio';

export const runtime = 'nodejs';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * A legislator's opening paragraph, from Wikipedia.
 *
 * The existing bio route asks a model for "career background and notable
 * roles if inferable" from a name, a party and a district number. Inferable
 * is the wrong word: there is nothing in those four fields to infer a career
 * from, so anything it returns about a real, named, living politician is
 * invented. This route exists so that never has to happen.
 *
 * The article is not guessed either. OpenStates has already matched each
 * person to their Wikipedia page and we vendor that URL, so no fuzzy name
 * search can attach the wrong Alexis Hansen to a seat. 6,988 of the 7,336
 * legislators have one.
 *
 * Fetched here rather than in the browser so a reader's address never reaches
 * Wikipedia, and so one fetch serves everyone. Wikipedia prose is CC BY-SA,
 * so the article URL comes back with it and the page has to show it.
 */
export async function GET(request: NextRequest) {
  const { success } = summaryLimiter.check(getClientIp(request));
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const url = request.nextUrl.searchParams.get('url');
  // Only an en.wikipedia.org article URL is ever fetched, so this cannot be
  // aimed at an internal host.
  const title = url ? titleFromUrl(url) : null;
  if (!title) {
    return NextResponse.json({ error: 'A valid en.wikipedia.org article URL is required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const cacheKey = `wiki-bio-${title}`;
  try {
    const { data: cached } = await admin
      .from('feed_cache')
      .select('data, fetched_at')
      .eq('user_id', PUBLIC_USER_ID)
      .eq('feed_type', cacheKey)
      .maybeSingle();
    if (cached && Date.now() - new Date(cached.fetched_at as string).getTime() < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }
  } catch {
    // A cache miss must never be why a page has no biography.
  }

  let body: { extract?: string; type?: string; title?: string };
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { 'User-Agent': 'MyDemocracy/1.0 (https://www.mydemocracy.app; civic information)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ extract: null });
    body = await res.json();
  } catch {
    return NextResponse.json({ extract: null });
  }

  // A disambiguation page is nobody's biography.
  if (body.type === 'disambiguation' || !body.extract) {
    return NextResponse.json({ extract: null });
  }

  const result = {
    extract: tidy(body.extract),
    articleUrl: url,
    articleTitle: body.title ?? title.replace(/_/g, ' '),
    license: 'CC BY-SA 4.0',
  };

  try {
    await admin.from('feed_cache').upsert(
      { user_id: PUBLIC_USER_ID, feed_type: cacheKey, data: result, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' },
    );
  } catch {
    // Serving it matters more than remembering it.
  }

  return NextResponse.json(result);
}
