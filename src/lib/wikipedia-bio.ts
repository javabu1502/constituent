/**
 * A legislator's biography, from Wikipedia rather than from a model.
 *
 * The bio endpoint used to ask Claude for "career background and notable
 * roles if inferable" given nothing but a name, a party, a chamber and a
 * district. There is no honest way to infer a career from those, so what
 * came back was invented detail about a named real person, published on
 * their profile page. This fetches what an encyclopedia actually says, or
 * returns null and lets the page show the facts it already has.
 *
 * Cached for thirty days. Wikipedia text is CC BY-SA, so anything rendered
 * from here has to carry the article link.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { tidy } from '@/lib/wiki-bio';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface WikipediaBio {
  extract: string;
  articleUrl: string;
  articleTitle: string;
  license: string;
}

/** "https://en.wikipedia.org/wiki/Maria_Cantwell" or "Maria Cantwell" → title. */
export function wikiTitleFrom(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  if (!v) return null;
  if (!/^https?:/i.test(v)) return v.replace(/\s+/g, '_');
  try {
    const u = new URL(v);
    if (u.hostname !== 'en.wikipedia.org') return null;
    const title = decodeURIComponent(u.pathname.replace(/^\/wiki\//, ''));
    // Category:, Template: and friends are not biographies.
    if (!title || title.includes(':')) return null;
    return title;
  } catch {
    return null;
  }
}

export async function fetchWikipediaBio(
  admin: SupabaseClient,
  handle: string | null | undefined,
): Promise<WikipediaBio | null> {
  const title = wikiTitleFrom(handle);
  if (!title) return null;

  const cacheKey = `wiki-bio-${title}`;
  try {
    const { data: cached } = await admin
      .from('feed_cache')
      .select('data, fetched_at')
      .eq('user_id', PUBLIC_USER_ID)
      .eq('feed_type', cacheKey)
      .maybeSingle();
    if (cached?.data && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
      return (cached.data as WikipediaBio).extract ? (cached.data as WikipediaBio) : null;
    }
  } catch {
    // A cache miss is not a failure.
  }

  let body: { extract?: string; type?: string; title?: string };
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { 'User-Agent': 'MyDemocracy/1.0 (https://www.mydemocracy.app; civic information)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    body = await res.json();
  } catch {
    return null;
  }

  // A disambiguation page is nobody's biography.
  if (body.type === 'disambiguation' || !body.extract) return null;

  const result: WikipediaBio = {
    extract: tidy(body.extract),
    articleUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
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

  return result;
}
