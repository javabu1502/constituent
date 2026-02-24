import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { openstatesFetch } from '@/lib/openstates-api';
import { fetchLegiscanVotes } from '@/lib/legiscan-api';
import type { FeedBill, RepVote, RepNewsArticle, BillAction } from '@/lib/types';

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

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

async function fetchOpenStatesVotes(personId: string, repName: string, chamber: string): Promise<RepVote[]> {
  const query = `
    query($personId: ID!) {
      person(id: $personId) {
        votes(first: 50) {
          edges {
            node {
              option
              voteEvent {
                identifier
                motionText
                startDate
                result
                bill { identifier title }
                counts { option value }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await openstatesFetch(query, { personId });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.errors) return [];

    const edges = data?.data?.person?.votes?.edges ?? [];
    return edges.map((edge: Record<string, unknown>) => {
      const node = edge.node as Record<string, unknown>;
      const ve = node.voteEvent as Record<string, unknown> | undefined;
      const bill = ve?.bill as Record<string, unknown> | undefined;
      const counts = (ve?.counts ?? []) as { option: string; value: number }[];

      const yeaCount = counts.find(c => c.option === 'yes')?.value;
      const nayCount = counts.find(c => c.option === 'no')?.value;
      const notVotingCount = counts.find(c => c.option === 'absent' || c.option === 'not voting')?.value;

      const option = (node.option as string) ?? '';
      const normalizedPosition =
        option === 'yes' ? 'Yea' :
        option === 'no' ? 'Nay' :
        option === 'not voting' || option === 'absent' ? 'Not Voting' :
        option === 'present' || option === 'abstain' ? 'Present' :
        option;

      return {
        type: 'vote' as const,
        roll_number: (ve?.identifier as string) ?? '',
        question: (ve?.motionText as string) ?? '',
        description: '',
        result: (ve?.result as string) ?? '',
        date: (ve?.startDate as string) ?? '',
        rep_position: normalizedPosition,
        bill_number: (bill?.identifier as string) ?? undefined,
        bill_title: (bill?.title as string) ?? undefined,
        congress: 0,
        chamber: (chamber === 'upper' ? 'Senate' : 'House') as 'Senate' | 'House',
        vote_url: '',
        rep_id: personId,
        rep_name: repName,
        level: 'state' as const,
        yea_count: yeaCount,
        nay_count: nayCount,
        not_voting_count: notVotingCount,
      };
    });
  } catch {
    return [];
  }
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

  // Fetch votes: try Open States first, fall back to LegiScan
  let voteDataSource: string | undefined;
  try {
    const osVotes = await fetchOpenStatesVotes(personId, name, chamber || 'lower');
    if (osVotes.length > 0) {
      votes.push(...osVotes);
      voteDataSource = 'openstates';
    }
  } catch {
    // Continue
  }

  if (votes.length === 0) {
    try {
      const lastName = name.split(' ').pop() || name;
      const legiscanResult = await fetchLegiscanVotes(
        state,
        name,
        lastName,
        chamber || 'lower',
        personId,
      );
      if (legiscanResult && legiscanResult.votes.length > 0) {
        votes.push(...legiscanResult.votes);
        voteDataSource = 'legiscan';
      }
    } catch {
      // Continue with empty votes
    }
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

  return NextResponse.json(result);
}
