import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { congressFetch } from '@/lib/congress-api';
import { openstatesFetch } from '@/lib/openstates-api';
import type { FeedBill, RepNewsArticle, RepFeedItem, RepFeedResponse, RepVote, Official, BillAction } from '@/lib/types';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

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

function isWithin90Days(dateStr: string): boolean {
  if (!dateStr) return true;
  return Date.now() - new Date(dateStr).getTime() < NINETY_DAYS_MS;
}

function mapCongressBill(bill: Record<string, unknown>, rep: Official, sponsorshipType: 'sponsored' | 'cosponsored'): FeedBill {
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
    sponsorship_type: sponsorshipType,
  };
}

async function fetchFederalBills(rep: Official): Promise<FeedBill[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];

  // Fetch sponsored bills
  const sponsoredUrl = `https://api.congress.gov/v3/member/${rep.id}/sponsored-legislation?limit=5&api_key=${apiKey}`;
  const sponsoredRes = await congressFetch(sponsoredUrl);
  const sponsoredBills: FeedBill[] = [];
  if (sponsoredRes.ok) {
    const data = await sponsoredRes.json();
    const legislation = data.sponsoredLegislation ?? [];
    sponsoredBills.push(...legislation.map((bill: Record<string, unknown>) => mapCongressBill(bill, rep, 'sponsored')));
  }

  // Fetch cosponsored bills
  const cosponsoredUrl = `https://api.congress.gov/v3/member/${rep.id}/cosponsored-legislation?limit=5&api_key=${apiKey}`;
  const cosponsoredRes = await congressFetch(cosponsoredUrl);
  const cosponsoredBills: FeedBill[] = [];
  if (cosponsoredRes.ok) {
    const data = await cosponsoredRes.json();
    const legislation = data.cosponsoredLegislation ?? [];
    cosponsoredBills.push(...legislation.map((bill: Record<string, unknown>) => mapCongressBill(bill, rep, 'cosponsored')));
  }

  return [...sponsoredBills, ...cosponsoredBills];
}

function mapStateBillEdge(
  edge: Record<string, Record<string, unknown>>,
  rep: Official,
  sponsorshipType: 'sponsored' | 'cosponsored',
): FeedBill {
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
    sponsorship_type: sponsorshipType,
    actions: billActions,
  };
}

async function fetchStateBills(rep: Official): Promise<FeedBill[]> {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) return [];

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

  try {
    const res = await openstatesFetch(gqlQuery, { personId: rep.id });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.errors) return [];

    const sponsoredEdges = data?.data?.sponsored?.edges ?? [];
    const cosponsoredEdges = data?.data?.cosponsored?.edges ?? [];

    const sponsoredBills = sponsoredEdges.map((edge: Record<string, Record<string, unknown>>) =>
      mapStateBillEdge(edge, rep, 'sponsored')
    );
    const cosponsoredBills = cosponsoredEdges.map((edge: Record<string, Record<string, unknown>>) =>
      mapStateBillEdge(edge, rep, 'cosponsored')
    );

    // Deduplicate by bill identifier (a bill could appear in both)
    const seen = new Set<string>();
    const all: FeedBill[] = [];
    for (const bill of [...sponsoredBills, ...cosponsoredBills]) {
      if (!seen.has(bill.bill_number)) {
        seen.add(bill.bill_number);
        all.push(bill);
      }
    }
    return all;
  } catch {
    return [];
  }
}

/**
 * Fetch recent chamber votes and look up per-member positions.
 * For each chamber represented by federal reps, fetch last 5 roll call votes,
 * then for each vote fetch detail to find specific member positions.
 */
async function fetchChamberVotes(
  chamber: 'Senate' | 'House',
  congress: number,
  federalReps: Official[],
): Promise<RepVote[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];

  const chamberReps = federalReps.filter((r) => {
    const repChamber = r.chamber === 'senate' ? 'Senate' : 'House';
    return repChamber === chamber;
  });
  if (chamberReps.length === 0) return [];

  // Fetch list of recent votes for this chamber
  const listUrl = `https://api.congress.gov/v3/vote/${congress}/${chamber.toLowerCase()}?limit=5&api_key=${apiKey}`;
  const listRes = await congressFetch(listUrl);
  if (!listRes.ok) return [];

  const listData = await listRes.json();
  const votes = listData.votes ?? [];
  const allVotes: RepVote[] = [];

  // Build a set of bioguide IDs for quick lookup
  const repIds = new Set(chamberReps.map((r) => r.id));
  const repMap = new Map(chamberReps.map((r) => [r.id, r]));

  for (const vote of votes) {
    const rollNumber = String(vote.rollNumber ?? vote.number ?? '');
    const voteDate = (vote.date as string) ?? '';
    const question = (vote.question as string) ?? '';
    const description = (vote.description as string) ?? '';
    const result = (vote.result as string) ?? '';
    const voteUrl = (vote.url as string) ?? '';

    // Fetch vote detail to get member positions
    const detailUrl = `https://api.congress.gov/v3/vote/${congress}/${chamber.toLowerCase()}/${rollNumber}?api_key=${apiKey}`;
    const memberPositions: Map<string, string> = new Map();

    try {
      const detailRes = await congressFetch(detailUrl);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        const voteDetail = detailData.vote ?? {};
        // Congress.gov returns positions under vote.positions or similar
        // The structure varies: check for membersVoted or positions
        const positions = voteDetail.positions ?? [];
        for (const pos of positions) {
          const memberId = (pos.member?.bioguideId as string) ?? '';
          const position = (pos.votePosition as string) ?? '';
          if (memberId && repIds.has(memberId)) {
            memberPositions.set(memberId, position);
          }
        }
      }
    } catch {
      // Continue without per-member positions
    }

    // Create a vote entry for each rep in this chamber
    for (const rep of chamberReps) {
      const position = memberPositions.get(rep.id) ?? '';
      allVotes.push({
        type: 'vote' as const,
        roll_number: rollNumber,
        question,
        description,
        result,
        date: voteDate,
        rep_position: position,
        congress,
        chamber,
        vote_url: voteUrl || `https://www.congress.gov/roll-call-vote/${congress}/${chamber.toLowerCase()}/${rollNumber}`,
        rep_id: rep.id,
        rep_name: repMap.get(rep.id)?.name ?? '',
        level: 'federal' as const,
      });
    }
  }

  return allVotes;
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

function isRecent(pubDate: string, maxAgeDays = 30): boolean {
  if (!pubDate) return true;
  const age = Date.now() - new Date(pubDate).getTime();
  return age < maxAgeDays * 24 * 60 * 60 * 1000;
}

async function fetchRepNews(rep: Official): Promise<RepNewsArticle[]> {
  const titlePrefix = rep.title?.split(',')[0]?.trim() ?? '';
  const seen = new Set<string>();
  const articles: RepNewsArticle[] = [];

  // Primary search: just the rep's full name
  const primaryQuery = `"${rep.name}" when:7d`;
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
          rep_name: rep.name,
          rep_id: rep.id,
          level: rep.level,
        });
      }
    }
  } catch {
    // continue to fallback
  }

  // Fallback: if fewer than 3 results, broaden with title
  if (articles.length < 3 && titlePrefix) {
    const fallbackQuery = `"${rep.name}" ${titlePrefix} when:7d`;
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
            rep_name: rep.name,
            rep_id: rep.id,
            level: rep.level,
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
    state: r.state,
  }));

  if (reps.length === 0) {
    return NextResponse.json({ items: [], votes: [], reps: [], userIssues } satisfies RepFeedResponse);
  }

  // Return cached if valid and has the new votes field
  const cachedData = cached?.data as { items?: RepFeedItem[]; votes?: RepVote[] } | RepFeedItem[] | null;
  const isNewFormat = cachedData && !Array.isArray(cachedData) && 'items' in cachedData && 'votes' in cachedData;
  const cacheValid = cached && isNewFormat
    && (cachedData as { items: RepFeedItem[] }).items.length > 0
    && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS;
  if (cacheValid) {
    const cd = cachedData as { items: RepFeedItem[]; votes: RepVote[] };
    return NextResponse.json({ items: cd.items, votes: cd.votes, reps: repsMeta, userIssues } satisfies RepFeedResponse);
  }

  const errors: string[] = [];
  const allItems: RepFeedItem[] = [];
  const allVotes: RepVote[] = [];

  // Separate federal and state reps
  const federalReps = reps.filter((r) => r.level === 'federal');
  const stateReps = reps.filter((r) => r.level === 'state');

  // Process federal reps sequentially (rate limit on Congress.gov)
  for (const rep of federalReps) {
    try {
      const bills = await fetchFederalBills(rep);
      allItems.push(...bills);
    } catch (e) {
      errors.push(`bills ${rep.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
    try {
      const news = await fetchRepNews(rep);
      allItems.push(...news);
    } catch (e) {
      errors.push(`news ${rep.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Fetch chamber votes for federal reps
  const currentCongress = 119;
  const chambers = new Set(federalReps.map((r) => r.chamber === 'senate' ? 'Senate' as const : 'House' as const));
  for (const chamber of chambers) {
    try {
      const votes = await fetchChamberVotes(chamber, currentCongress, federalReps);
      allVotes.push(...votes);
    } catch (e) {
      errors.push(`votes ${chamber}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Process state reps sequentially (Open States rate limit: 1 req/sec)
  for (const rep of stateReps) {
    try {
      const bills = await fetchStateBills(rep);
      allItems.push(...bills);
    } catch (e) {
      errors.push(`bills ${rep.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
    try {
      const news = await fetchRepNews(rep);
      allItems.push(...news);
    } catch (e) {
      errors.push(`news ${rep.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 90-day filter for bills
  const filteredItems = allItems.filter((item) => {
    if (item.type === 'bill') return isWithin90Days(item.date);
    if (item.type === 'news') return isRecent(item.pubDate);
    return true;
  });

  // Sort by date desc
  const getDate = (item: RepFeedItem): string => {
    if (item.type === 'bill') return item.date;
    if (item.type === 'news') return item.pubDate;
    if (item.type === 'vote') return item.date;
    return '';
  };
  filteredItems.sort((a, b) => {
    const dateA = getDate(a);
    const dateB = getDate(b);
    return (dateB ? new Date(dateB).getTime() : 0) - (dateA ? new Date(dateA).getTime() : 0);
  });

  // Deduplicate
  const seen = new Set<string>();
  const deduplicated = filteredItems.filter((item) => {
    const key = item.type === 'bill' ? item.bill_number : item.type === 'vote' ? `vote-${item.roll_number}-${item.rep_id}` : item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Deduplicate votes
  const voteSeen = new Set<string>();
  const deduplicatedVotes = allVotes.filter((v) => {
    const key = `${v.roll_number}-${v.rep_id}`;
    if (voteSeen.has(key)) return false;
    voteSeen.add(key);
    return true;
  });

  // Cache both items and votes together
  const cachePayload = { items: deduplicated, votes: deduplicatedVotes };
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: user.id, feed_type: 'representatives', data: cachePayload, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json({
    items: deduplicated,
    votes: deduplicatedVotes,
    reps: repsMeta,
    userIssues,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
