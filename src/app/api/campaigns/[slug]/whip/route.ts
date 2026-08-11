import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { getStateLegislators } from '@/lib/state-legislators';
import { getStateCommittee } from '@/lib/state-committees';
import { getCommittee, getCommitteeMembers } from '@/lib/committees';
import { openstatesRestFetch } from '@/lib/openstates-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Whip board data for a campaign initiative (owner-only).
 * GET  — roster merged with the org's positions, sponsor sync, committee
 *        membership, constituent-message counts, and note counts.
 * POST — upsert the org's position on one legislator.
 */

const positionSchema = z.object({
  legislator_id: z.string().min(1).max(120),
  legislator_name: z.string().min(1).max(200),
  legislator_party: z.string().max(50).nullish(),
  legislator_chamber: z.string().max(20).nullish(),
  position: z.enum(['for', 'against', 'committed', 'uncommitted']),
});

async function loadOwnedCampaign(slug: string) {
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, creator_id, campaign_type, target_level, bill_level, bill_state, bill_ref')
    .eq('slug', slug)
    .single();
  if (!campaign) return { error: 'not_found' as const };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' as const };
  if (user.id !== campaign.creator_id) return { error: 'forbidden' as const };
  return { campaign, admin, userId: user.id };
}

// Sponsor sets cached 1h — same data the participate flow uses for intents.
const sponsorCache = new Map<string, { ids: Set<string>; expires: number }>();
async function stateSponsorIds(state: string, ref: string): Promise<Set<string>> {
  const key = `${state}/${ref}`;
  const hit = sponsorCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.ids;
  const ids = new Set<string>();
  try {
    const res = await openstatesRestFetch('/bills', {
      jurisdiction: state, identifier: ref, sort: 'updated_desc', include: 'sponsorships', per_page: '1',
    });
    if (res.ok) {
      const data = await res.json();
      for (const s of data?.results?.[0]?.sponsorships ?? []) {
        if (s?.person?.id) ids.add(s.person.id as string);
      }
    }
  } catch { /* sponsor sync is best-effort */ }
  sponsorCache.set(key, { ids, expires: Date.now() + 60 * 60 * 1000 });
  return ids;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await loadOwnedCampaign(slug);
  if ('error' in res) {
    const status = res.error === 'not_found' ? 404 : res.error === 'unauthorized' ? 401 : 403;
    return NextResponse.json({ error: res.error }, { status });
  }
  const { campaign, admin } = res;

  const { data: children } = await admin
    .from('campaigns')
    .select('id, stage_goal, target_filter')
    .eq('parent_campaign_id', campaign.id);
  const initiativeIds = [campaign.id, ...(children ?? []).map((c) => c.id as string)];

  // Committee context: the first committee stage's target.
  const committeeStage = (children ?? []).find(
    (c) => (c.target_filter as { type?: string } | null)?.type === 'committee'
  );
  const committeeFilter = committeeStage?.target_filter as { committee_id?: string; state?: string } | null;
  let committee: { id: string; name: string; members: Set<string> } | null = null;
  if (committeeFilter?.committee_id) {
    if (committeeFilter.state) {
      const c = getStateCommittee(committeeFilter.state, committeeFilter.committee_id);
      if (c) committee = { id: c.id, name: c.name, members: new Set(c.members) };
    } else {
      const c = getCommittee(committeeFilter.committee_id);
      const members = getCommitteeMembers(committeeFilter.committee_id).map((m) => m.bioguide);
      if (c && members.length) committee = { id: c.id, name: c.name, members: new Set(members) };
    }
  }

  // Roster: state campaigns get the full legislature; federal falls back to
  // committee members + anyone already positioned/messaged.
  const stateCode = campaign.bill_state || committeeFilter?.state || null;
  type RosterRow = { id: string; name: string; party: string | null; chamber: string | null };
  const roster = new Map<string, RosterRow>();
  if (stateCode) {
    for (const l of getStateLegislators(stateCode)) {
      roster.set(l.id, { id: l.id, name: l.name, party: l.party ?? null, chamber: l.chamber ?? null });
    }
  } else if (committeeFilter?.committee_id) {
    for (const m of getCommitteeMembers(committeeFilter.committee_id)) {
      roster.set(m.bioguide, { id: m.bioguide, name: m.name, party: m.party, chamber: null });
    }
  }

  const [{ data: positions }, { data: notes }, { data: msgs }, sponsorIds] = await Promise.all([
    admin.from('legislator_positions').select('legislator_id, legislator_name, legislator_party, legislator_chamber, position, updated_at').eq('campaign_id', campaign.id),
    admin.from('campaign_notes').select('id, legislator_id, legislator_name, body, created_at').eq('campaign_id', campaign.id).order('created_at', { ascending: false }).limit(500),
    admin.from('messages').select('legislator_id').in('campaign_id', initiativeIds).limit(10000),
    stateCode && campaign.bill_ref ? stateSponsorIds(stateCode, campaign.bill_ref) : Promise.resolve(new Set<string>()),
  ]);

  // Anyone positioned or messaged joins the roster even if outside it.
  for (const p of positions ?? []) {
    if (!roster.has(p.legislator_id)) {
      roster.set(p.legislator_id, { id: p.legislator_id, name: p.legislator_name, party: p.legislator_party, chamber: p.legislator_chamber });
    }
  }

  const msgCounts = new Map<string, number>();
  for (const m of msgs ?? []) {
    if (m.legislator_id) msgCounts.set(m.legislator_id, (msgCounts.get(m.legislator_id) || 0) + 1);
  }
  const noteCounts = new Map<string, number>();
  for (const n of notes ?? []) {
    if (n.legislator_id) noteCounts.set(n.legislator_id, (noteCounts.get(n.legislator_id) || 0) + 1);
  }
  const positionById = new Map((positions ?? []).map((p) => [p.legislator_id, p.position as string]));

  const rows = [...roster.values()]
    .map((r) => ({
      ...r,
      position: positionById.get(r.id) ?? null,
      sponsor: sponsorIds.has(r.id),
      onCommittee: committee?.members.has(r.id) ?? false,
      messages: msgCounts.get(r.id) ?? 0,
      noteCount: noteCounts.get(r.id) ?? 0,
    }))
    .sort((a, b) => b.messages - a.messages || a.name.localeCompare(b.name));

  return NextResponse.json({
    rows,
    notes: notes ?? [],
    committee: committee ? { id: committee.id, name: committee.name, size: committee.members.size } : null,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await loadOwnedCampaign(slug);
  if ('error' in res) {
    const status = res.error === 'not_found' ? 404 : res.error === 'unauthorized' ? 401 : 403;
    return NextResponse.json({ error: res.error }, { status });
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = positionSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid position' }, { status: 400 });

  const { error } = await res.admin.from('legislator_positions').upsert(
    {
      creator_id: res.userId,
      campaign_id: res.campaign.id,
      legislator_id: parsed.data.legislator_id,
      legislator_name: parsed.data.legislator_name,
      legislator_party: parsed.data.legislator_party ?? null,
      legislator_chamber: parsed.data.legislator_chamber ?? null,
      position: parsed.data.position,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'campaign_id,legislator_id' }
  );
  if (error) {
    console.error('[whip] upsert failed:', error);
    return NextResponse.json({ error: 'Failed to save position' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
