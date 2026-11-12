import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { fetchPersonFeedBills, extractPersonVotes } from '@/lib/openstates-person';
import { fetchLegiscanVotes } from '@/lib/legiscan-api';
import { callerIsOrganization } from '@/lib/legiscan-access';
import { activityLimiter, getClientIp } from '@/lib/rate-limit';
import { isAnonymous } from '@/lib/cache-audience';
import type { FeedBill, RepVote, RepNewsArticle } from '@/lib/types';

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

function isRecent(pubDate: string, maxAgeDays = 30): boolean {
  if (!pubDate) return true;
  const age = Date.now() - new Date(pubDate).getTime();
  return age < maxAgeDays * 24 * 60 * 60 * 1000;
}

async function fetchLegislatorNews(name: string, state: string, personId: string, title?: string): Promise<RepNewsArticle[]> {
  const seen = new Set<string>();
  const articles: RepNewsArticle[] = [];

  // Primary search: just the legislator's full name
  const primaryQuery = `"${name}" when:7d`;
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(primaryQuery)}&num=10&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyDemocracy/1.0)' },
    });
    if (res.ok) {
      const xml = await res.text();
      const items = parseRssItems(xml);
      for (const item of items) {
        if (articles.length >= 7) break;
        if (seen.has(item.title)) continue;
        if (!isRecent(item.pubDate)) continue;
        seen.add(item.title);
        articles.push({
          type: 'news' as const,
          title: item.title,
          link: item.link,
          source: item.source,
          pubDate: item.pubDate,
          rep_name: name,
          rep_id: personId,
          level: 'state' as const,
        });
      }
    }
  } catch {
    // continue to fallback
  }

  // Fallback: if fewer than 3 results, broaden with title
  const titlePrefix = title?.split(',')[0]?.trim() ?? '';
  if (articles.length < 3 && titlePrefix) {
    const fallbackQuery = `"${name}" ${titlePrefix} when:7d`;
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(fallbackQuery)}&num=10&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyDemocracy/1.0)' },
      });
      if (res.ok) {
        const xml = await res.text();
        const items = parseRssItems(xml);
        for (const item of items) {
          if (articles.length >= 7) break;
          if (seen.has(item.title)) continue;
          if (!isRecent(item.pubDate)) continue;
          seen.add(item.title);
          articles.push({
            type: 'news' as const,
            title: item.title,
            link: item.link,
            source: item.source,
            pubDate: item.pubDate,
            rep_name: name,
            rep_id: personId,
            level: 'state' as const,
          });
        }
      }
    } catch {
      // continue
    }
  }

  // Sort by date descending, return 7 most recent
  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return articles.slice(0, 7);
}

/**
 * Public answers are cached at Vercel's edge, where a second crawl of the
 * same legislator is served without the function, the database or anyone's
 * API being touched at all.
 *
 * An organization's answer is never cached there. This route varies by who is
 * asking, the edge keys on the URL rather than the session, and the two are
 * the same URL. A shared cache entry would hand an organization's roll-call
 * record to the next anonymous visitor and undo the gate in legiscan-access.
 */
function cachedResponse(data: unknown, shared: boolean): NextResponse {
  return NextResponse.json(data, {
    headers: shared
      ? { 'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400', Vary: 'Cookie' }
      : { 'Cache-Control': 'private, no-store' },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personId = searchParams.get('personId');
  const state = searchParams.get('state')?.toUpperCase();
  const chamber = searchParams.get('chamber') as 'upper' | 'lower' | null;
  const name = searchParams.get('name') ?? '';
  const title = searchParams.get('title') ?? '';

  if (!personId || !state) {
    return NextResponse.json({ error: 'Missing personId or state parameter' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Two audiences, two cache entries. Only organization accounts reach
  // LegiScan, so an organization's copy of this panel can hold the full
  // roll-call record while the public copy holds Open States sponsored-bill
  // votes. One shared entry would hand whichever version was written first
  // to everyone.
  const isOrg = await callerIsOrganization();
  const feedType = isOrg ? `legislator-activity-org-${personId}` : `legislator-activity-${personId}`;

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', 'public')
    .eq('feed_type', feedType)
    .single();

  const fresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  // Public entries written before LegiScan became organization-only still
  // hold roll-call votes. Rebuild rather than serve them, which costs one
  // Open States call and gives a correct answer instead of an empty one.
  const holdsOrgVotes =
    !isOrg && (cached?.data as { vote_data_source?: string } | null)?.vote_data_source === 'legiscan';

  const shared = isAnonymous(request);

  if (fresh && !holdsOrgVotes) return cachedResponse(cached.data, shared);

  // Everything past here calls Open States and Google News, once per
  // legislator, so this is where a crawl walking 7,000 pages spends real
  // money. Going over the limit serves whatever is on file rather than
  // failing, so a shared office address degrades to slightly older data
  // instead of an empty panel.
  if (!activityLimiter.check(getClientIp(request)).success) {
    if (cached) return cachedResponse(cached.data, shared);
    return NextResponse.json({ error: 'Too many requests', code: 'RATE_LIMITED' }, { status: 429 });
  }

  // One Open States REST call: the person's bills (any sponsorship role)
  // with roll-call votes included. Their own votes on those bills come along.
  const bills: FeedBill[] = [];
  const votes: RepVote[] = [];
  let voteDataSource: string | undefined;
  let sponsoredBillVotes: RepVote[] = [];

  try {
    const { bills: mapped, raw } = await fetchPersonFeedBills(
      { id: personId, name, state },
      { includeVotes: true },
    );
    bills.push(...mapped);
    sponsoredBillVotes = extractPersonVotes(raw, { id: personId, name }, chamber || 'lower');
  } catch (e) {
    console.error('[legislators/activity] openstates', personId, e instanceof Error ? e.message : e);
  }

  // Votes: LegiScan has the person's full roll-call record. Open States only
  // knows their votes on bills they sponsored, so it is the fallback.
  try {
    const lastName = name.split(' ').pop() || name;
    const legiscanResult = await fetchLegiscanVotes(state, name, lastName, chamber || 'lower', personId);
    if (legiscanResult && legiscanResult.votes.length > 0) {
      votes.push(...legiscanResult.votes);
      voteDataSource = 'legiscan';
    }
  } catch {
    // Fall through to Open States votes
  }
  if (votes.length === 0 && sponsoredBillVotes.length > 0) {
    votes.push(...sponsoredBillVotes);
    voteDataSource = 'openstates';
  }

  // Fetch news
  let news: RepNewsArticle[] = [];
  try {
    news = await fetchLegislatorNews(name, state, personId, title || undefined);
  } catch {
    // Continue with empty news
  }

  const result = { bills, votes, news, vote_data_source: voteDataSource };

  // Cache
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: 'public', feed_type: feedType, data: result, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return cachedResponse(result, shared);
}
