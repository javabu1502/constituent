/**
 * Live bill status for org campaign tooling — the real legislative record
 * (Open States for state bills, Congress.gov for federal), classified into a
 * phase so the analytics page can tell an org what to do NEXT: "the committee
 * reported it out — launch the floor stage." The campaign's stages tell the
 * public story; this tells the ORG the bill's actual story.
 */
import { openstatesRestFetch } from '@/lib/openstates-api';
import { congressFetch } from '@/lib/congress-api';
import { detectBillReferences } from '@/lib/bills';
import type { StageGoal } from '@/lib/stages';

export interface BillAction {
  date: string;
  description: string;
  /** 'lower' | 'upper' | chamber name when known. */
  chamber: string | null;
}

export interface NextStageSuggestion {
  goal: StageGoal;
  reason: string;
  /** Committee name extracted from the action text, when the bill sits in committee. */
  committeeName: string | null;
}

export interface BillStatus {
  found: boolean;
  actions: BillAction[]; // newest first, capped
  suggestion: NextStageSuggestion | null;
}

/**
 * Classify the newest action into a suggested next stage. Pure — unit tested.
 * Order matters: end-of-life phrases first, introduction phrases last.
 */
export function suggestNextStage(latestAction: string, latestChamber: string | null): NextStageSuggestion {
  const t = latestAction.toLowerCase();

  if (/signed by (the )?governor|became (public )?law|approved by the governor|chaptered|enacted/.test(t)) {
    return { goal: 'thank_you', reason: 'The bill has been signed into law — time to thank the legislators who carried it.', committeeName: null };
  }
  if (/delivered to (the )?governor|presented to the president|to governor|enrolled/.test(t)) {
    return { goal: 'thank_you', reason: 'The bill has cleared the legislature — thank supporters while the signature is pending.', committeeName: null };
  }
  if (/passed(?: the)? senate|passed(?: the)? upper/.test(t) || (/\bpassed\b/.test(t) && latestChamber === 'upper')) {
    return { goal: 'thank_you', reason: 'It passed the Senate — if both chambers are done, shift to gratitude; otherwise push the remaining chamber.', committeeName: null };
  }
  if (/passed(?: the)? (assembly|house)|passed(?: the)? lower/.test(t) || (/\bpassed\b/.test(t) && latestChamber === 'lower')) {
    return { goal: 'floor_senate', reason: 'It passed the first chamber — the Senate floor is the next fight.', committeeName: null };
  }
  if (/do pass|reported favorably|committee report|reported out|placed on .*(calendar|file)|ordered to (a )?third reading/.test(t)) {
    const goal: StageGoal = latestChamber === 'upper' ? 'floor_senate' : 'floor_house';
    return { goal, reason: 'The committee reported it out — mobilize for the floor vote.', committeeName: null };
  }
  if (/referred to|re-referred|assigned to|in committee|hearing (scheduled|held)|scheduled for hearing/.test(t)) {
    // Try to pull the committee's name out of the action text.
    const m =
      latestAction.match(/[Cc]ommittee on ([A-Z][A-Za-z,&\- ]+?)(?:\.|,|$)/) ||
      latestAction.match(/to (?:the )?([A-Z][A-Za-z,&\- ]+?) [Cc]ommittee/);
    return {
      goal: 'committee',
      reason: 'The bill sits in committee — target the members who will vote on it there.',
      committeeName: m ? m[1].trim() : null,
    };
  }
  return { goal: 'cosponsor', reason: 'The bill is early in its life — build momentum by recruiting cosponsors.', committeeName: null };
}

const TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { status: BillStatus; expires: number }>();

async function stateActions(state: string, ref: string): Promise<BillAction[]> {
  const res = await openstatesRestFetch('/bills', {
    jurisdiction: state,
    identifier: ref,
    sort: 'updated_desc',
    include: 'actions',
    per_page: '1',
  });
  if (!res.ok) return [];
  const data = await res.json();
  const bill = data?.results?.[0];
  if (!bill) return [];
  type OsAction = { description?: string; date?: string; organization?: { classification?: string } };
  return ((bill.actions ?? []) as OsAction[])
    .filter((a) => a.description && a.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 8)
    .map((a) => ({
      date: String(a.date).slice(0, 10),
      description: String(a.description).slice(0, 300),
      chamber: a.organization?.classification ?? null,
    }));
}

async function federalActions(congress: string, type: string, number: string): Promise<BillAction[]> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return [];
  const res = await congressFetch(
    `https://api.congress.gov/v3/bill/${congress}/${type}/${number}/actions?limit=8&api_key=${apiKey}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  type CgAction = { actionDate?: string; text?: string; chamber?: string };
  return ((data?.actions ?? []) as CgAction[])
    .filter((a) => a.text && a.actionDate)
    .map((a) => ({
      date: String(a.actionDate),
      description: String(a.text).slice(0, 300),
      chamber: a.chamber ? String(a.chamber).toLowerCase() : null,
    }));
}

/**
 * Fetch + classify the real status of a campaign's bill. Cached 1h including
 * misses (a demo/fictional bill costs one lookup an hour, then renders as
 * not-found). Never throws — org tooling should degrade, not break the page.
 */
export async function fetchBillStatus(campaign: {
  bill_level: string | null;
  bill_state: string | null;
  bill_ref: string | null;
  bill_congress?: number | null;
  bill_type?: string | null;
  bill_number?: string | null;
}): Promise<BillStatus | null> {
  if (!campaign.bill_ref && !campaign.bill_number) return null;
  const key = `${campaign.bill_level}/${campaign.bill_state ?? 'US'}/${campaign.bill_ref ?? `${campaign.bill_type} ${campaign.bill_number}`}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.status;

  let actions: BillAction[] = [];
  try {
    if (campaign.bill_level === 'state' && campaign.bill_state && campaign.bill_ref) {
      actions = await stateActions(campaign.bill_state, campaign.bill_ref);
    } else {
      let congress = campaign.bill_congress ? String(campaign.bill_congress) : '';
      let type = campaign.bill_type || '';
      let number = campaign.bill_number || '';
      if (!(congress && type && number) && campaign.bill_ref) {
        const fed = detectBillReferences(campaign.bill_ref).find((r) => r.level === 'federal');
        if (fed) {
          congress = '119';
          type = fed.type;
          number = fed.number;
        }
      }
      if (congress && type && number) actions = await federalActions(congress, type, number);
    }
  } catch (err) {
    console.warn('[bill-status] lookup failed:', err);
  }

  const status: BillStatus = {
    found: actions.length > 0,
    actions,
    suggestion: actions.length > 0 ? suggestNextStage(actions[0].description, actions[0].chamber) : null,
  };
  cache.set(key, { status, expires: Date.now() + TTL_MS });
  return status;
}
