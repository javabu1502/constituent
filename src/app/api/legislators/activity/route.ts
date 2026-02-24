import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { openstatesFetch } from '@/lib/openstates-api';
import { US_STATES } from '@/lib/constants';
import type { FeedBill, RepVote, RepNewsArticle, BillAction } from '@/lib/types';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function stateCodeToName(code: string): string {
  return US_STATES.find((s) => s.code === code.toUpperCase())?.name ?? code;
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

async function fetchLegislatorNews(name: string, state: string, personId: string): Promise<RepNewsArticle[]> {
  const stateName = stateCodeToName(state);
  const queries = [
    `"${name}" state legislator when:30d`,
    `"${name}" ${stateName} when:30d`,
  ];

  const seen = new Set<string>();
  const articles: RepNewsArticle[] = [];

  for (const query of queries) {
    if (articles.length >= 5) break;
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyDemocracy/1.0)' },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRssItems(xml);

      for (const item of items) {
        if (articles.length >= 5) break;
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
    } catch {
      continue;
    }
  }

  return articles;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personId = searchParams.get('personId');
  const state = searchParams.get('state')?.toUpperCase();
  const chamber = searchParams.get('chamber') as 'upper' | 'lower' | null;
  const name = searchParams.get('name') ?? '';

  if (!personId || !state) {
    return NextResponse.json({ error: 'Missing personId or state parameter' }, { status: 400 });
  }

  const admin = createAdminClient();
  const feedType = `legislator-activity-${personId}`;

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', 'public')
    .eq('feed_type', feedType)
    .single();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  // Fetch bills + votes in one batched GraphQL query
  const gqlQuery = `
    query($personId: String!) {
      sponsored: bills(first: 10, sponsor: { person: $personId }) {
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
      cosponsored: bills(first: 10, cosponsor: { person: $personId }) {
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

  const bills: FeedBill[] = [];
  const votes: RepVote[] = [];

  try {
    const res = await openstatesFetch(gqlQuery, { personId });
    if (res.ok) {
      const data = await res.json();
      if (!data.errors) {
        const mapEdge = (edge: Record<string, Record<string, unknown>>, sponsorshipType: 'sponsored' | 'cosponsored'): FeedBill => {
          const node = edge.node;
          const actions = (node.actions ?? []) as { description: string; date: string; classification: string[] }[];
          const lastAction = actions.length > 0 ? actions[actions.length - 1] : null;
          const abstracts = (node.abstracts ?? []) as { abstract: string }[];
          const description = abstracts.length > 0 ? abstracts[0].abstract : '';
          const allClassifications = actions.map((a) => a.classification ?? []);
          const sponsorships = (node.sponsorships ?? []) as { name: string; classification: string }[];
          const sponsors = sponsorships.map((s) => s.name).filter(Boolean);
          const sources = (node.sources ?? []) as { url: string }[];
          const referralAction = actions.find((a) => (a.classification ?? []).includes('referral-committee'));
          const committee = referralAction?.description?.replace(/^Referred to\s*/i, '') ?? '';

          const billActions: BillAction[] = actions.map((a) => ({
            description: a.description,
            date: a.date,
            classification: a.classification ?? [],
          }));

          return {
            type: 'bill' as const,
            bill_number: (node.identifier as string) ?? '',
            title: (node.title as string) ?? '',
            description,
            sponsor_name: name,
            sponsors,
            date: lastAction?.date ?? ((node.updatedAt as string) ?? ''),
            status: deriveStatus(allClassifications),
            last_action: lastAction?.description ?? '',
            last_action_date: lastAction?.date ?? '',
            policy_area: '',
            committee,
            bill_url: sources[0]?.url || ((node.openstatesUrl as string) ?? ''),
            rep_id: personId,
            level: 'state' as const,
            sponsorship_type: sponsorshipType,
            actions: billActions,
          };
        };

        const sponsoredEdges = data?.data?.sponsored?.edges ?? [];
        const cosponsoredEdges = data?.data?.cosponsored?.edges ?? [];

        const seen = new Set<string>();
        for (const edge of sponsoredEdges) {
          const bill = mapEdge(edge, 'sponsored');
          if (!seen.has(bill.bill_number)) {
            seen.add(bill.bill_number);
            bills.push(bill);
          }
        }
        for (const edge of cosponsoredEdges) {
          const bill = mapEdge(edge, 'cosponsored');
          if (!seen.has(bill.bill_number)) {
            seen.add(bill.bill_number);
            bills.push(bill);
          }
        }
      }
    }
  } catch {
    // Continue with empty bills
  }

  // Fetch news
  let news: RepNewsArticle[] = [];
  try {
    news = await fetchLegislatorNews(name, state, personId);
  } catch {
    // Continue with empty news
  }

  const result = { bills, votes, news };

  // Cache
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: 'public', feed_type: feedType, data: result, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json(result);
}
