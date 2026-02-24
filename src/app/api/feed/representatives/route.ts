import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { US_STATES } from '@/lib/constants';
import type { FeedBill, RepNewsArticle, RepSocialPost, RepFeedItem, RepFeedResponse, Official } from '@/lib/types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function stateCodeToName(code: string): string {
  return US_STATES.find((s) => s.code === code.toUpperCase())?.name ?? code;
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

function deriveStatus(classifications: string[][]): string {
  const flat = classifications.flat();
  if (flat.includes('executive-signature') || flat.includes('became-law')) return 'Signed into Law';
  if (flat.includes('passage')) return 'Passed Chamber';
  if (flat.includes('committee-passage')) return 'Passed Committee';
  if (flat.includes('reading-3')) return 'Third Reading';
  if (flat.includes('reading-2')) return 'Second Reading';
  if (flat.includes('referral-committee')) return 'In Committee';
  if (flat.includes('reading-1') || flat.includes('introduction')) return 'Introduced';
  return '';
}

async function fetchFederalBills(rep: Official): Promise<FeedBill[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.congress.gov/v3/member/${rep.id}/sponsored-legislation?limit=5&api_key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];

  const data = await res.json();
  const legislation = data.sponsoredLegislation ?? [];

  return legislation.map((bill: Record<string, unknown>) => {
    const latestAction = bill.latestAction as Record<string, string> | undefined;
    const billType = (bill.type as string) ?? '';
    const billNum = (bill.number as string) ?? '';
    const policyArea = bill.policyArea as Record<string, string> | undefined;
    const billNumber = billType && billNum ? `${billType} ${billNum}` : billNum;
    return {
      type: 'bill' as const,
      bill_number: billNumber,
      title: (bill.title as string) ?? '',
      description: '',
      sponsor_name: rep.name,
      sponsors: [rep.name],
      date: latestAction?.actionDate ?? (bill.introducedDate as string) ?? '',
      status: latestAction?.text ?? '',
      last_action: latestAction?.text ?? '',
      last_action_date: latestAction?.actionDate ?? '',
      policy_area: policyArea?.name ?? '',
      committee: '',
      bill_url: billNumber ? `https://www.congress.gov/search?q=${encodeURIComponent(billNumber)}` : '',
      rep_id: rep.id,
      level: 'federal' as const,
    };
  });
}

async function fetchStateBills(rep: Official): Promise<FeedBill[]> {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) return [];

  const gqlQuery = `
    query($personId: String!) {
      bills(first: 5, sponsor: { person: $personId }) {
        edges {
          node {
            identifier
            title
            updatedAt
            classification
            openstatesUrl
            abstracts { abstract }
            actions { description date classification }
            sponsorships { name classification }
            sources { url }
          }
        }
      }
    }
  `;

  const res = await fetch('https://openstates.org/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
    body: JSON.stringify({ query: gqlQuery, variables: { personId: rep.id } }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return [];
  const data = await res.json();
  if (data.errors) return [];

  const edges = data?.data?.bills?.edges ?? [];
  return edges.map((edge: Record<string, Record<string, unknown>>) => {
    const node = edge.node;
    const actions = (node.actions ?? []) as { description: string; date: string; classification: string[] }[];
    const lastAction = actions.length > 0 ? actions[actions.length - 1] : null;
    const abstracts = (node.abstracts ?? []) as { abstract: string }[];
    const description = abstracts.length > 0 ? abstracts[0].abstract : '';
    const allClassifications = actions.map((a) => a.classification ?? []);
    const sponsorships = (node.sponsorships ?? []) as { name: string; classification: string }[];
    const sponsors = sponsorships.map((s) => s.name).filter(Boolean);
    const sources = (node.sources ?? []) as { url: string }[];

    // Extract committee from referral actions
    const referralAction = actions.find((a) => (a.classification ?? []).includes('referral-committee'));
    const committee = referralAction?.description?.replace(/^Referred to\s*/i, '') ?? '';

    return {
      type: 'bill' as const,
      bill_number: (node.identifier as string) ?? '',
      title: (node.title as string) ?? '',
      description,
      sponsor_name: rep.name,
      sponsors,
      date: lastAction?.date ?? ((node.updatedAt as string) ?? ''),
      status: deriveStatus(allClassifications),
      last_action: lastAction?.description ?? '',
      last_action_date: lastAction?.date ?? '',
      policy_area: '',
      committee,
      bill_url: sources[0]?.url || ((node.openstatesUrl as string) ?? ''),
      rep_id: rep.id,
      level: 'state' as const,
    };
  });
}

function parseRssItems(xml: string): { title: string; link: string; source: string; pubDate: string; description: string }[] {
  const items: { title: string; link: string; source: string; pubDate: string; description: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? '';
    const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() ?? '';
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';
    const description = item.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() ?? '';
    if (title && link) items.push({ title, link, source, pubDate, description });
  }
  return items;
}

async function fetchRepNews(rep: Official): Promise<RepNewsArticle[]> {
  try {
    const stateName = stateCodeToName(rep.state);
    const query = `${rep.name} ${stateName}`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml).slice(0, 3).map((item) => ({
      type: 'news' as const,
      title: item.title,
      link: item.link,
      source: item.source,
      pubDate: item.pubDate,
      rep_name: rep.name,
      rep_id: rep.id,
      level: rep.level,
    }));
  } catch {
    return [];
  }
}

async function fetchSocialPosts(rep: Official): Promise<RepSocialPost[]> {
  const handle = rep.socialMedia?.twitter;
  if (!handle) return [];

  try {
    // Use Google News to find recent mentions of this handle
    const query = `@${handle}`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml).slice(0, 2).map((item) => ({
      type: 'social' as const,
      text: item.title,
      link: item.link,
      pubDate: item.pubDate,
      platform: 'twitter' as const,
      handle,
      rep_name: rep.name,
      rep_id: rep.id,
      level: rep.level,
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
    .eq('feed_type', 'representatives')
    .single();

  // Get user's issue areas from messages
  const { data: messages } = await admin
    .from('messages')
    .select('issue_area')
    .or(`user_id.eq.${user.id},advocate_email.eq.${user.email}`);

  const userIssues = [...new Set((messages ?? []).map((m) => m.issue_area).filter(Boolean))] as string[];

  // Get cached reps from profile
  const { data: profile } = await admin
    .from('profiles')
    .select('representatives')
    .eq('user_id', user.id)
    .single();

  const reps = parseRepresentatives(profile?.representatives);
  const repsMeta = reps.map((r) => ({
    id: r.id,
    name: r.name,
    level: r.level,
    party: r.party,
    title: r.title,
    twitter: r.socialMedia?.twitter,
  }));

  if (reps.length === 0) {
    return NextResponse.json({ items: [], reps: [], userIssues } satisfies RepFeedResponse);
  }

  // Return cached if valid, non-empty, and items have the expected `type` field
  const cachedData = cached?.data as RepFeedItem[] | null;
  const cacheValid = cached && cachedData && cachedData.length > 0
    && cachedData[0]?.type  // must have new schema
    && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (cacheValid) {
    return NextResponse.json({ items: cachedData, reps: repsMeta, userIssues } satisfies RepFeedResponse);
  }

  // Fetch bills, news, and social posts for all reps in parallel
  const errors: string[] = [];
  const promises = reps.map(async (rep) => {
    const results: RepFeedItem[] = [];
    try {
      if (rep.level === 'federal') results.push(...await fetchFederalBills(rep));
      else if (rep.level === 'state') results.push(...await fetchStateBills(rep));
    } catch (e) { errors.push(`bills ${rep.name}: ${e instanceof Error ? e.message : String(e)}`); }
    try { results.push(...await fetchRepNews(rep)); } catch (e) { errors.push(`news ${rep.name}: ${e instanceof Error ? e.message : String(e)}`); }
    try { results.push(...await fetchSocialPosts(rep)); } catch (e) { errors.push(`social ${rep.name}: ${e instanceof Error ? e.message : String(e)}`); }
    return results;
  });

  const allItems = (await Promise.all(promises)).flat();

  // Sort by date desc
  allItems.sort((a, b) => {
    const dateA = a.type === 'bill' ? a.date : a.pubDate;
    const dateB = b.type === 'bill' ? b.date : b.pubDate;
    return (dateB ? new Date(dateB).getTime() : 0) - (dateA ? new Date(dateA).getTime() : 0);
  });

  // Deduplicate
  const seen = new Set<string>();
  const deduplicated = allItems.filter((item) => {
    const key = item.type === 'bill' ? item.bill_number : item.type === 'news' ? item.title : item.text;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Cache
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: user.id, feed_type: 'representatives', data: deduplicated, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json({ items: deduplicated, reps: repsMeta, userIssues, ...(errors.length > 0 ? { errors } : {}) });
}
