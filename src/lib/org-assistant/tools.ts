import { createAdminClient } from '@/lib/supabase';
import { getInitiativeCounts } from '@/lib/campaign-counts';
import { findSenators, findRepresentative, getAllFederalLegislators } from '@/lib/legislators';

/**
 * The tools the organization assistant may use.
 *
 * Two kinds, and the split is the whole safety model:
 *
 *  - READ tools run here, immediately, scoped to the signed-in organization's
 *    own rows. The model never gets an id it did not already receive from a
 *    read, and every read re-checks ownership rather than trusting an id the
 *    model produced.
 *
 *  - WRITE tools do not write. They return a PROPOSAL, which ends the turn
 *    and is rendered to the person as something to approve or discard.
 *    Creating a campaign starts collecting real constituents' messages and
 *    logging a meeting enters the record an organization shows its funders,
 *    so neither should happen because a model decided it should. The approval
 *    round trip re-validates everything server-side; the proposal is a
 *    suggestion, never an instruction.
 */
type DbClient = ReturnType<typeof createAdminClient>;

export interface ToolContext {
  db: DbClient;
  userId: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  /** A write tool returns a proposal and performs no write. */
  proposesWrite?: boolean;
}

export const ORG_TOOLS: ToolDefinition[] = [
  {
    name: 'list_campaigns',
    description:
      'List the organization\'s campaigns with their type, status, and real participation counts. Use this first whenever a question involves a campaign, so you are working from the campaign\'s actual slug and numbers rather than a guess.',
    input_schema: {
      type: 'object',
      properties: {
        include_steps: { type: 'boolean', description: 'Include step campaigns nested under an initiative. Defaults to false.' },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'campaign_detail',
    description:
      'Everything known about one campaign: its ask, talking points, bill, outcome, and its counts broken down by what actually happened to each message. Delivered means an office received it. Not delivered means it never arrived. Never describe a message as delivered unless this tool says so.',
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'The campaign slug from list_campaigns.' } },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'story_themes',
    description:
      'The themes and consented quotes from a storytelling campaign. Quotes come back only for stories whose teller allowed that use. Never quote a story this tool did not return, and never name a storyteller it reports as anonymous.',
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'whip_summary',
    description:
      'Where each legislator stands on a campaign, plus the meeting notes logged against them. Use it before advising on strategy so the advice rests on the organization\'s own count.',
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'find_legislator',
    description:
      'Look up a federal legislator by name, or the delegation for a state. Returns the identifiers needed to log a meeting or set a whip position.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full or partial name.' },
        state: { type: 'string', description: 'Two-letter state code, to list that delegation.' },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'propose_campaign',
    description:
      'Propose a new campaign for the person to review. This does NOT create anything: it returns a draft they approve or discard. Draft the headline, description, ask and talking points yourself from what they told you. Ask for anything you genuinely need before proposing, but do not interrogate: one round of questions, then propose something concrete they can edit.',
    proposesWrite: true,
    input_schema: {
      type: 'object',
      properties: {
        campaign_type: { type: 'string', enum: ['advocacy', 'storytelling'] },
        headline: { type: 'string', description: 'The ask, in plain words. Under 100 characters.' },
        description: { type: 'string', description: 'What this is and why it matters. 10 to 500 characters.' },
        issue_area: { type: 'string' },
        target_level: { type: 'string', enum: ['federal', 'state', 'both'] },
        direction: { type: 'string', enum: ['support', 'oppose'] },
        message_template: { type: 'string', description: 'Talking points, one per line. Each is a point a constituent will make in their own words.' },
        story_prompt: { type: 'string', description: 'Storytelling campaigns only: the opening question put to a storyteller.' },
        language: { type: 'string', enum: ['en', 'es'] },
      },
      required: ['campaign_type', 'headline', 'description'],
      additionalProperties: false,
    },
  },
  {
    name: 'propose_meeting_log',
    description:
      'Propose a meeting record for the person to review. This does NOT save anything. Use it when they describe a conversation with a legislator or a staffer. Capture what they actually said happened and do not embellish it.',
    proposesWrite: true,
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The campaign this meeting belongs to.' },
        body: { type: 'string', description: 'What happened, in the organizer\'s own terms.' },
        legislator_name: { type: 'string' },
        legislator_id: { type: 'string' },
        hours: { type: 'number', description: 'Time spent, counted once per meeting.' },
        position: {
          type: 'string',
          enum: ['yes', 'leaning_yes', 'uncommitted', 'leaning_no', 'no'],
          description: 'Only when the organizer stated a read on where the legislator stands. Never infer it.',
        },
      },
      required: ['slug', 'body'],
      additionalProperties: false,
    },
  },
];

/** Run a read tool. Returns a plain object the model can read. */
export async function runOrgTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  switch (name) {
    case 'list_campaigns':
      return listCampaigns(ctx, input.include_steps === true);
    case 'campaign_detail':
      return campaignDetail(ctx, String(input.slug ?? ''));
    case 'story_themes':
      return storyThemes(ctx, String(input.slug ?? ''));
    case 'whip_summary':
      return whipSummary(ctx, String(input.slug ?? ''));
    case 'find_legislator':
      return findLegislator(String(input.name ?? ''), String(input.state ?? ''));
    default:
      return { error: `No tool named ${name}.` };
  }
}

/** Ownership is re-checked on every read. A slug from the model proves nothing. */
async function ownedCampaign(ctx: ToolContext, slug: string) {
  if (!slug) return null;
  const { data } = await ctx.db
    .from('campaigns')
    .select('id, slug, creator_id, headline, description, campaign_type, status, approval_status, issue_area, target_level, direction, message_template, bill_ref, bill_title, bill_level, bill_state, outcome, outcome_note, language, story_prompt, created_at, parent_campaign_id')
    .eq('slug', slug)
    .single();
  if (!data || data.creator_id !== ctx.userId) return null;
  return data;
}

async function listCampaigns(ctx: ToolContext, includeSteps: boolean) {
  const { data } = await ctx.db
    .from('campaigns')
    .select('id, slug, headline, campaign_type, status, outcome, created_at, parent_campaign_id, story_count')
    .eq('creator_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(100);
  const rows = (data ?? []).filter((c) => includeSteps || !c.parent_campaign_id);
  const out = [];
  for (const c of rows.slice(0, 25)) {
    const counts = await getInitiativeCounts(ctx.db, c.id as string);
    out.push({
      slug: c.slug,
      headline: c.headline,
      type: c.campaign_type,
      status: c.status,
      outcome: c.outcome ?? null,
      is_step: !!c.parent_campaign_id,
      participants: counts.participants,
      messages: counts.messages,
      delivered: counts.delivered,
      not_delivered: counts.notDelivered,
      stories: counts.stories,
    });
  }
  return { campaigns: out, note: rows.length > 25 ? `Showing 25 of ${rows.length}.` : undefined };
}

async function campaignDetail(ctx: ToolContext, slug: string) {
  const c = await ownedCampaign(ctx, slug);
  if (!c) return { error: 'No campaign with that slug belongs to this organization.' };
  const counts = await getInitiativeCounts(ctx.db, c.id as string);
  return {
    slug: c.slug,
    headline: c.headline,
    description: c.description,
    type: c.campaign_type,
    status: c.status,
    language: c.language,
    issue_area: c.issue_area,
    target_level: c.target_level,
    direction: c.direction,
    talking_points: c.message_template ?? null,
    story_prompt: c.story_prompt ?? null,
    bill: c.bill_ref ? { ref: c.bill_ref, title: c.bill_title, level: c.bill_level, state: c.bill_state } : null,
    outcome: c.outcome ?? null,
    outcome_note: c.outcome_note ?? null,
    started: c.created_at,
    counts: {
      participants: counts.participants,
      messages: counts.messages,
      delivered: counts.delivered,
      in_flight: counts.inFlight,
      not_delivered: counts.notDelivered,
      sent_by_the_constituent_themselves: counts.selfSent,
      stories: counts.stories,
    },
  };
}

async function storyThemes(ctx: ToolContext, slug: string) {
  const c = await ownedCampaign(ctx, slug);
  if (!c) return { error: 'No campaign with that slug belongs to this organization.' };
  const { data: insights } = await ctx.db
    .from('campaign_insights')
    .select('summary, themes, model_version, created_at')
    .eq('campaign_id', c.id)
    .order('created_at', { ascending: false })
    .limit(1);
  const { data: stories } = await ctx.db
    .from('stories')
    .select('attribution_level, consent_usage_snapshot, city, state, created_at')
    .eq('campaign_id', c.id)
    .eq('status', 'active')
    .limit(500);
  const rows = stories ?? [];
  const attribution = rows.reduce((a: Record<string, number>, s) => {
    const k = String(s.attribution_level ?? 'unknown');
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
  return {
    slug: c.slug,
    stories: rows.length,
    attribution,
    // The report-cleared count, so the assistant can say what is quotable.
    quotable_in_reports: rows.filter((s) => {
      const snap = s.consent_usage_snapshot as { granted_uses?: string[] } | null;
      return Array.isArray(snap?.granted_uses) && snap.granted_uses.includes('included_in_reports');
    }).length,
    themes: insights?.[0]?.themes ?? null,
    summary: insights?.[0]?.summary ?? null,
    note: 'Quotes are only usable where the storyteller granted that use. Never name an anonymous storyteller.',
  };
}

async function whipSummary(ctx: ToolContext, slug: string) {
  const c = await ownedCampaign(ctx, slug);
  if (!c) return { error: 'No campaign with that slug belongs to this organization.' };
  const [{ data: positions }, { data: notes }] = await Promise.all([
    ctx.db.from('legislator_positions').select('legislator_name, position, updated_at').eq('campaign_id', c.id).limit(600),
    ctx.db.from('campaign_notes').select('legislator_name, body, hours, created_at').eq('campaign_id', c.id).order('created_at', { ascending: false }).limit(50),
  ]);
  const tally = (positions ?? []).reduce((a: Record<string, number>, p) => {
    const k = String(p.position ?? 'uncommitted');
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
  return {
    slug: c.slug,
    tally,
    positions: (positions ?? []).slice(0, 120).map((p) => ({ name: p.legislator_name, position: p.position })),
    recent_notes: (notes ?? []).slice(0, 15).map((n) => ({ legislator: n.legislator_name, note: n.body, hours: n.hours, when: n.created_at })),
  };
}

function findLegislator(name: string, state: string) {
  const st = state.trim().toUpperCase();
  if (st.length === 2) {
    const senators = findSenators(st).map((s) => ({ id: s.id, name: s.name, title: s.title, party: s.party, state: st }));
    return { state: st, senators, note: 'Use find_legislator with a name for a specific House member.' };
  }
  const q = name.trim().toLowerCase();
  if (!q) return { error: 'Give a name or a two-letter state code.' };
  const all = getAllFederalLegislators();
  const hits = all
    .filter((l) => l.name.toLowerCase().includes(q))
    .slice(0, 10)
    .map((l) => ({ id: l.id, name: l.name, title: l.title, party: l.party, state: l.state, chamber: l.chamber }));
  void findRepresentative;
  return hits.length ? { matches: hits } : { matches: [], note: 'Nobody matched that name in the current Congress.' };
}
