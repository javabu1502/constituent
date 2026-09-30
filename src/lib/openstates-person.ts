/**
 * Per-legislator activity from the Open States v3 REST API.
 *
 * v3 has no "bills this person sponsored" or "votes this person cast"
 * endpoints. What it has is GET /bills?sponsor=<ocd-person id>, which
 * returns every bill the person appears on as any kind of sponsor, with
 * the full sponsorship list, actions and roll-call votes available via
 * `include`. One call per legislator gives us:
 *
 *  - sponsored vs cosponsored: from the person's own sponsorship entry
 *    (`primary: true` = sponsored). Classification strings vary by state
 *    ("sponsor", "primary", "cosponsor"), so the primary flag is the only
 *    portable signal.
 *  - the person's votes: from the included vote records, matching the
 *    voter's ocd-person id. This covers only votes on bills they sponsored;
 *    callers fall back to LegiScan for a fuller record.
 */
import { openstatesRestFetch, jurisdictionName } from './openstates-api';
import type { FeedBill, RepVote, BillAction } from './types';

export interface OpenStatesSponsorship {
  name?: string;
  primary?: boolean;
  classification?: string;
  entity_type?: string;
  person?: { id?: string; name?: string } | null;
}

export interface OpenStatesAction {
  description?: string;
  date?: string;
  classification?: string[];
}

export interface OpenStatesVoteRecord {
  id?: string;
  identifier?: string;
  motion_text?: string;
  start_date?: string;
  result?: string;
  organization?: { classification?: string } | null;
  counts?: { option: string; value: number }[];
  votes?: { option?: string; voter_name?: string; voter?: { id?: string } | null }[];
}

export interface OpenStatesBill {
  identifier?: string;
  title?: string;
  updated_at?: string;
  latest_action_date?: string;
  latest_action_description?: string;
  openstates_url?: string;
  abstracts?: { abstract?: string }[];
  actions?: OpenStatesAction[];
  sponsorships?: OpenStatesSponsorship[];
  sources?: { url?: string }[];
  votes?: OpenStatesVoteRecord[];
}

/** Max the v3 API allows per page. */
const PER_PAGE = '20';

export function deriveStatus(classifications: string[][]): string {
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

/**
 * "Read first time. Referred to Committee on Education. To printer." →
 * "Committee on Education". States phrase referrals differently, so we
 * take the clause after "referred to" and stop at the sentence end.
 */
export function committeeFromReferral(description: string): string {
  const m = description.match(/referred\s+to\s+(?:the\s+)?([^.;]+)/i);
  return m ? m[1].trim() : '';
}

/** Whether `personId` is listed as a primary sponsor on the bill. */
export function sponsorshipTypeFor(bill: OpenStatesBill, personId: string): 'sponsored' | 'cosponsored' {
  const mine = (bill.sponsorships ?? []).filter((s) => s.person?.id === personId);
  return mine.some((s) => s.primary === true) ? 'sponsored' : 'cosponsored';
}

export function mapOpenStatesBill(bill: OpenStatesBill, rep: { id: string; name: string }): FeedBill {
  const actions = bill.actions ?? [];
  const lastAction = actions.length > 0 ? actions[actions.length - 1] : null;
  const description = bill.abstracts?.[0]?.abstract ?? '';
  const sponsors = (bill.sponsorships ?? []).map((s) => s.person?.name || s.name || '').filter(Boolean);
  const referralAction = actions.find((a) => (a.classification ?? []).includes('referral-committee'));
  const committee = committeeFromReferral(referralAction?.description ?? '');

  const billActions: BillAction[] = actions.map((a) => ({
    description: a.description ?? '',
    date: a.date ?? '',
    classification: a.classification ?? [],
  }));

  return {
    type: 'bill' as const,
    bill_number: bill.identifier ?? '',
    title: bill.title ?? '',
    description,
    sponsor_name: rep.name,
    sponsors,
    date: bill.latest_action_date || lastAction?.date || bill.updated_at || '',
    status: deriveStatus(actions.map((a) => a.classification ?? [])),
    last_action: bill.latest_action_description || lastAction?.description || '',
    last_action_date: bill.latest_action_date || lastAction?.date || '',
    policy_area: '',
    committee,
    bill_url: bill.sources?.[0]?.url || bill.openstates_url || '',
    rep_id: rep.id,
    level: 'state' as const,
    sponsorship_type: sponsorshipTypeFor(bill, rep.id),
    actions: billActions,
  };
}

function normalizeVoteOption(option: string): string {
  switch (option) {
    case 'yes': return 'Yea';
    case 'no': return 'Nay';
    case 'not voting':
    case 'absent':
    case 'excused': return 'Not Voting';
    case 'present':
    case 'abstain': return 'Present';
    default: return option;
  }
}

/** The person's own roll-call votes, pulled from the bills' included vote records. */
export function extractPersonVotes(
  bills: OpenStatesBill[],
  rep: { id: string; name: string },
  fallbackChamber: 'upper' | 'lower',
): RepVote[] {
  const votes: RepVote[] = [];
  const seen = new Set<string>();
  for (const bill of bills) {
    for (const ve of bill.votes ?? []) {
      const mine = (ve.votes ?? []).find((v) => v.voter?.id === rep.id);
      if (!mine) continue;
      const key = ve.id || `${bill.identifier}-${ve.start_date}-${ve.motion_text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const counts = ve.counts ?? [];
      const orgChamber = ve.organization?.classification === 'upper' || ve.organization?.classification === 'lower'
        ? ve.organization.classification
        : fallbackChamber;
      votes.push({
        type: 'vote' as const,
        roll_number: ve.identifier || ve.id || '',
        question: ve.motion_text ?? '',
        description: '',
        result: ve.result ?? '',
        date: ve.start_date ?? '',
        rep_position: normalizeVoteOption(mine.option ?? ''),
        bill_number: bill.identifier || undefined,
        bill_title: bill.title || undefined,
        congress: 0,
        chamber: orgChamber === 'upper' ? 'Senate' : 'House',
        vote_url: bill.openstates_url ?? '',
        rep_id: rep.id,
        rep_name: rep.name,
        level: 'state' as const,
        yea_count: counts.find((c) => c.option === 'yes')?.value,
        nay_count: counts.find((c) => c.option === 'no')?.value,
        not_voting_count: counts.find((c) => c.option === 'not voting' || c.option === 'absent')?.value,
      });
    }
  }
  votes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return votes;
}

/**
 * One REST call: the legislator's most recently acted-on bills (any
 * sponsorship role), with everything needed to map them and to pull the
 * person's votes. Throws when the key is missing or the state is unknown;
 * returns [] on API errors so callers degrade to "no activity".
 */
export async function fetchPersonBills(
  personId: string,
  state: string,
  opts: { includeVotes?: boolean } = {},
): Promise<OpenStatesBill[]> {
  const jurisdiction = jurisdictionName(state);
  if (!jurisdiction) throw new Error(`Unknown state for Open States: ${state}`);
  const include = ['sponsorships', 'abstracts', 'actions', 'sources'];
  if (opts.includeVotes) include.push('votes');
  const res = await openstatesRestFetch('/bills', {
    jurisdiction,
    sponsor: personId,
    sort: 'latest_action_desc',
    per_page: PER_PAGE,
    include,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[openstates-person] bills error', res.status, text.slice(0, 300));
    return [];
  }
  const data = await res.json();
  return (data?.results ?? []) as OpenStatesBill[];
}

/** Bills mapped to FeedBill, deduped by identifier. */
export async function fetchPersonFeedBills(
  rep: { id: string; name: string; state: string },
  opts: { includeVotes?: boolean } = {},
): Promise<{ bills: FeedBill[]; raw: OpenStatesBill[] }> {
  const raw = await fetchPersonBills(rep.id, rep.state, opts);
  const seen = new Set<string>();
  const bills: FeedBill[] = [];
  for (const b of raw) {
    const mapped = mapOpenStatesBill(b, rep);
    if (!mapped.bill_number || seen.has(mapped.bill_number)) continue;
    seen.add(mapped.bill_number);
    bills.push(mapped);
  }
  return { bills, raw };
}
