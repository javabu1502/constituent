import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { US_STATES } from '@/lib/constants';
import { congressFetch } from '@/lib/congress-api';
import type { IssueFeedItem, IssueFeedResponse, Official } from '@/lib/types';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function stateCodeToName(code: string): string {
  const state = US_STATES.find((s) => s.code === code.toUpperCase());
  return state?.name ?? code;
}

function parseRepresentatives(raw: unknown): Official[] {
  if (!raw || typeof raw !== 'object') return [];
  if (Array.isArray(raw)) return raw as Official[];
  const values = Object.values(raw as Record<string, unknown>);
  const result: Official[] = [];
  for (const val of values) {
    if (Array.isArray(val)) result.push(...(val as Official[]));
    else if (val && typeof val === 'object' && 'id' in val && 'name' in val) result.push(val as Official);
  }
  return result;
}

function parseRssItems(xml: string): { title: string; link: string; source: string; pubDate: string }[] {
  const articles: { title: string; link: string; source: string; pubDate: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? '';
    const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() ?? '';
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';

    if (title && link) {
      articles.push({ title, link, source, pubDate });
    }
  }

  return articles;
}

function isRecent(pubDate: string, maxAgeDays = 30): boolean {
  if (!pubDate) return true;
  const age = Date.now() - new Date(pubDate).getTime();
  return age < maxAgeDays * 24 * 60 * 60 * 1000;
}

/**
 * Fetch bills from Congress.gov by policy area, cross-referencing with user's reps.
 */
async function fetchBillsByPolicyArea(
  policyArea: string,
  repNames: string[],
): Promise<IssueFeedItem[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.congress.gov/v3/bill?policyArea=${encodeURIComponent(policyArea)}&sort=updateDate+desc&limit=5&api_key=${apiKey}`;
  try {
    const res = await congressFetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const bills = data.bills ?? [];

    return bills.map((bill: Record<string, unknown>) => {
      const latestAction = bill.latestAction as Record<string, string> | undefined;
      const billType = (bill.type as string) ?? '';
      const billNum = (bill.number as string) ?? '';
      const billNumber = billType && billNum ? `${billType} ${billNum}` : billNum;
      const sponsorName = ((bill.sponsor as Record<string, unknown>)?.name as string) ?? '';

      // Cross-reference: check if any of the user's reps are the sponsor
      const relatedReps = repNames.filter((name) =>
        sponsorName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(sponsorName.toLowerCase())
      );

      return {
        type: 'issue-bill' as const,
        title: (bill.title as string) ?? '',
        link: billNumber ? `https://www.congress.gov/search?q=${encodeURIComponent(billNumber)}` : '',
        date: latestAction?.actionDate ?? (bill.introducedDate as string) ?? '',
        bill_number: billNumber,
        status: latestAction?.text ?? '',
        policy_area: policyArea,
        level: 'federal' as const,
        related_rep_names: relatedReps.length > 0 ? relatedReps : undefined,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch news for an issue/topic with freshness filtering.
 */
async function fetchIssueNews(
  topic: string,
  level: string,
  state: string,
  otherStateNames: Set<string>,
): Promise<IssueFeedItem[]> {
  try {
    const stateName = stateCodeToName(state);
    const query = level === 'state'
      ? `${topic} ${stateName} bill OR law OR legislature OR policy when:30d`
      : `${topic} Congress OR Senate OR House OR federal when:30d`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyDemocracy/1.0)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRssItems(xml).slice(0, 5);

    return items
      .filter((item) => isRecent(item.pubDate))
      .filter((item) => {
        // Filter out articles about other states unless they also mention federal context
        const titleLower = item.title.toLowerCase();
        for (const otherState of otherStateNames) {
          if (titleLower.includes(otherState.toLowerCase())) {
            if (titleLower.includes('congress') || titleLower.includes('federal')) {
              return true;
            }
            return false;
          }
        }
        return true;
      })
      .slice(0, 3)
      .map((item) => ({
        type: 'issue-news' as const,
        title: item.title,
        link: item.link,
        source: item.source,
        pubDate: item.pubDate,
        policy_area: topic,
        level: (level === 'state' ? 'state' : 'federal') as 'federal' | 'state',
      }));
  } catch {
    return [];
  }
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
    const cachedPayload = cached.data as { issues?: Record<string, IssueFeedItem[]>; userIssues?: string[] };
    if (cachedPayload?.issues && cachedPayload?.userIssues) {
      return NextResponse.json({ issues: cachedPayload.issues, userIssues: cachedPayload.userIssues } satisfies IssueFeedResponse);
    }
  }

  // Get user's reps and state for cross-referencing
  const { data: profile } = await admin
    .from('profiles')
    .select('representatives, state')
    .eq('user_id', user.id)
    .single();

  const reps = parseRepresentatives(profile?.representatives);
  const repNames = reps.map((r) => r.name);

  // Build set of other state names for headline filtering
  const userState = (profile?.state as string) ?? '';
  const otherStateNames = new Set<string>();
  for (const s of US_STATES) {
    if (s.code !== userState.toUpperCase()) {
      otherStateNames.add(s.name);
    }
  }

  // Get distinct (issue, legislator_level, advocate_state) combos from user's messages
  const { data: messages } = await admin
    .from('messages')
    .select('issue_area, issue_subtopic, legislator_level, advocate_state')
    .or(`user_id.eq.${user.id},advocate_email.eq.${user.email}`);

  if (!messages || messages.length === 0) {
    return NextResponse.json({ issues: {}, userIssues: [] } satisfies IssueFeedResponse);
  }

  // Deduplicate combos, limit to 5
  const seen = new Set<string>();
  const combos: { topic: string; level: string; state: string }[] = [];

  for (const msg of messages) {
    const topic = msg.issue_subtopic || msg.issue_area;
    if (!topic) continue;
    const key = `${topic}|${msg.legislator_level}|${msg.advocate_state}`;
    if (!seen.has(key)) {
      seen.add(key);
      combos.push({
        topic,
        level: msg.legislator_level,
        state: msg.advocate_state,
      });
      if (combos.length >= 5) break;
    }
  }

  const userIssues = [...new Set(combos.map((c) => c.topic))] as string[];
  const issueGroups: Record<string, IssueFeedItem[]> = {};

  // Fetch news for each combo in parallel
  const newsPromises = combos.map(async ({ topic, level, state }) => {
    const articles = await fetchIssueNews(topic, level, state, otherStateNames);
    return { topic, articles };
  });
  const newsResults = await Promise.all(newsPromises);

  for (const { topic, articles } of newsResults) {
    if (!issueGroups[topic]) issueGroups[topic] = [];
    issueGroups[topic].push(...articles);
  }

  // Fetch bills by policy area from Congress.gov (sequentially for rate limit)
  const uniqueTopics = [...new Set(combos.map((c) => c.topic))];
  for (const topic of uniqueTopics) {
    try {
      const bills = await fetchBillsByPolicyArea(topic, repNames);
      if (!issueGroups[topic]) issueGroups[topic] = [];
      issueGroups[topic].push(...bills);
    } catch {
      // Skip failed fetches
    }
  }

  // Deduplicate within each group and sort by date
  for (const topic of Object.keys(issueGroups)) {
    const titleSeen = new Set<string>();
    issueGroups[topic] = issueGroups[topic]
      .filter((item) => {
        if (titleSeen.has(item.title)) return false;
        titleSeen.add(item.title);
        return true;
      })
      .sort((a, b) => {
        const da = (a.pubDate || a.date) ? new Date(a.pubDate || a.date || '').getTime() : 0;
        const db = (b.pubDate || b.date) ? new Date(b.pubDate || b.date || '').getTime() : 0;
        return db - da;
      })
      .slice(0, 10);
  }

  const payload: IssueFeedResponse = { issues: issueGroups, userIssues };

  // Upsert into feed_cache
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: user.id, feed_type: 'issues', data: payload, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json(payload);
}
