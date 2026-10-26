import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { profileLimiter, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Carry out a proposal the person approved in the assistant.
 *
 * The proposal arrives from the browser, so none of it is trusted. Every
 * field is re-validated here, ownership is re-checked against the signed-in
 * account, and anything the schema does not name is dropped. A proposal is
 * the assistant's suggestion and the person's decision; this route is the
 * only thing that writes, and it writes only what it can verify.
 *
 * Campaigns are created as drafts rather than published. The assistant can
 * get a campaign most of the way there, but a campaign that collects real
 * constituents' messages should be looked at by a person on the campaign's
 * own page before it goes live.
 */
const meetingSchema = z.object({
  kind: z.literal('propose_meeting_log'),
  input: z.object({
    slug: z.string().min(1).max(120),
    body: z.string().min(1).max(5000),
    legislator_name: z.string().max(200).optional(),
    legislator_id: z.string().max(120).optional(),
    hours: z.number().min(0).max(24).optional(),
    position: z.enum(['yes', 'leaning_yes', 'uncommitted', 'leaning_no', 'no']).optional(),
  }),
});

const campaignSchema = z.object({
  kind: z.literal('propose_campaign'),
  input: z.object({
    campaign_type: z.enum(['advocacy', 'storytelling']),
    headline: z.string().min(3).max(100),
    description: z.string().min(10).max(500),
    issue_area: z.string().max(200).optional(),
    target_level: z.enum(['federal', 'state', 'both']).optional(),
    direction: z.enum(['support', 'oppose']).optional(),
    message_template: z.string().max(2000).optional(),
    story_prompt: z.string().max(2000).optional(),
    language: z.enum(['en', 'es']).optional(),
  }),
});

const bodySchema = z.discriminatedUnion('kind', [meetingSchema, campaignSchema]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  if (!profileLimiter.check(getClientIp(req)).success) {
    return NextResponse.json({ error: 'Too many requests. Wait a moment.' }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('account_type').eq('user_id', user.id).single();
  if (profile?.account_type !== 'organization') {
    return NextResponse.json({ error: 'This is for organization accounts.' }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'That proposal is not something I can carry out.' }, { status: 400 });

  if (parsed.data.kind === 'propose_meeting_log') {
    const { slug, body, legislator_name, legislator_id, hours, position } = parsed.data.input;
    const { data: campaign } = await admin.from('campaigns').select('id, creator_id').eq('slug', slug).single();
    if (!campaign) return NextResponse.json({ error: 'That campaign no longer exists.' }, { status: 404 });
    if (campaign.creator_id !== user.id) return NextResponse.json({ error: 'That campaign belongs to another organization.' }, { status: 403 });

    const { error } = await admin.from('campaign_notes').insert({
      creator_id: user.id,
      campaign_id: campaign.id,
      legislator_id: legislator_id ?? null,
      legislator_name: legislator_name ?? null,
      hours: hours ?? null,
      body: body.trim(),
    });
    if (error) {
      console.error('[org-assistant/confirm] note insert failed:', error);
      return NextResponse.json({ error: 'Could not save that meeting.' }, { status: 500 });
    }

    // A stated read on where the legislator stands is recorded alongside the
    // note, which is what the whip board and the funder report both draw on.
    let positionSaved = false;
    if (position && legislator_id) {
      const { error: pErr } = await admin.from('legislator_positions').upsert(
        {
          campaign_id: campaign.id,
          creator_id: user.id,
          legislator_id,
          legislator_name: legislator_name ?? null,
          position,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'campaign_id,legislator_id' },
      );
      positionSaved = !pErr;
      if (pErr) console.error('[org-assistant/confirm] position upsert failed:', pErr);
    }
    return NextResponse.json({ ok: true, saved: 'meeting', positionSaved, slug });
  }

  // A campaign the assistant drafted is created as a draft, not published.
  const c = parsed.data.input;
  const slug = `${c.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)}-${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await admin.from('campaigns').insert({
    creator_id: user.id,
    slug,
    campaign_type: c.campaign_type,
    headline: c.headline.trim(),
    description: c.description.trim(),
    issue_area: c.issue_area?.trim() || 'Other',
    target_level: c.campaign_type === 'advocacy' ? c.target_level ?? 'federal' : null,
    direction: c.campaign_type === 'advocacy' ? c.direction ?? null : null,
    message_template: c.message_template?.trim() || null,
    story_prompt: c.campaign_type === 'storytelling' ? c.story_prompt?.trim() || null : null,
    language: c.language ?? 'en',
    visibility: 'unlisted',
    // Not live. The person opens it, checks it, and launches it themselves.
    status: 'paused',
    approval_status: 'approved',
  });
  if (error) {
    console.error('[org-assistant/confirm] campaign insert failed:', error);
    return NextResponse.json({ error: 'Could not create that campaign.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, saved: 'campaign', slug, draft: true });
}
