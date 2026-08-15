import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase';
import { callClaude, deDash, extractJSON } from '@/lib/claude';
import { verifyTurnstile } from '@/lib/turnstile';
import { getClientIp } from '@/lib/rate-limit';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';

export const runtime = 'nodejs';

/**
 * Message-first flow, pass one of one: draft the constituent's CORE message —
 * their story + the campaign's talking points — before we know who their
 * officials are. The core is reviewed and approved by the constituent and is
 * never altered afterwards; per-official tailoring is a deterministic
 * template envelope (salutation + relevance line + ask) wrapped around it
 * client-side. One AI call per participant instead of one per official.
 *
 * Because no official is known yet, the core carries no official references,
 * and no name/address (the CWC rule) — those live in the envelope.
 */

const coreSchema = z
  .object({
    campaignSlug: z.string().min(1).max(120).optional(),
    // Freeform mode (the general contact flow): no campaign, just the
    // constituent's issue and what they want to say.
    issue: z.string().max(500).optional(),
    ask: z.string().max(1000).optional(),
    stance: z.enum(['support', 'oppose', 'undecided']).optional(),
    personalWhy: z.string().max(2000).optional(),
    turnstileToken: z.string().optional(),
  })
  .refine((d) => d.campaignSlug || d.issue, { message: 'campaignSlug or issue required' });

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = coreSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const ip = getClientIp(request);
  const identity = await resolveUsageIdentity(ip);
  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(parsed.data.turnstileToken || '', { strict: !identity.userId });
    if (!valid) return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
  }
  const { allowed } = await enforceDailyQuota(ip, 'generate_message', identity);
  if (!allowed) {
    return NextResponse.json({ error: 'Daily message limit reached. Try again tomorrow.' }, { status: 429 });
  }

  let campaign: {
    headline: string;
    description: string;
    direction: string | null;
    message_template: string | null;
    is_official: boolean | null;
    bill_ref: string | null;
    bill_title: string | null;
  } | null = null;
  if (parsed.data.campaignSlug) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('campaigns')
      .select('headline, description, direction, message_template, is_official, bill_ref, bill_title, issue_area')
      .eq('slug', parsed.data.campaignSlug)
      .eq('approval_status', 'approved')
      .single();
    if (!data) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    campaign = data;
  }

  // Official weigh-ins carry the PARTICIPANT's stance; org campaigns carry
  // the campaign's own direction; freeform mode carries whatever the
  // constituent asked for, in their ask.
  const position = !campaign
    ? 'This is the constituent\'s own issue. Take exactly the position their goal and words imply — nothing more, nothing less.'
    : campaign.is_official
    ? parsed.data.stance && parsed.data.stance !== 'undecided'
      ? `The constituent ${parsed.data.stance.toUpperCase()}S this. Argue their side clearly.`
      : 'The constituent is still weighing this. Write a thoughtful message urging serious attention to the issue without taking a side for them.'
    : `This campaign asks officials to ${campaign.direction === 'oppose' ? 'OPPOSE' : 'SUPPORT'} it. Argue that side clearly.`;

  const system = `You draft the CORE of a constituent's message to elected officials. The core is the constituent's own case — it will later be wrapped with a greeting, an official-specific opening, a closing ask, and a signature. Because of that:

- Do NOT address any official, reference any specific official, or assume which chamber or committee will read it.
- Do NOT include a greeting, sign-off, the constituent's name, or their address anywhere.
- Do NOT include a final "I ask you to vote..." sentence — the ask is added later.
- First person, 110–180 words, plain human language. No em dashes. No AI-sounding phrases.
- Weave the campaign's talking points in naturally where they strengthen the case; never paste them verbatim as a list.
- If the constituent shared a personal story, it is the heart of the message — lead with it and keep their meaning exactly.
- Invent nothing about the constituent.

Return ONLY JSON: {"body": "..."}`;

  const user = campaign
    ? `CAMPAIGN: ${campaign.headline}
${campaign.bill_ref ? `BILL: ${campaign.bill_ref}${campaign.bill_title ? ` — ${campaign.bill_title}` : ''}` : ''}
ABOUT: ${campaign.description}
${campaign.message_template ? `CAMPAIGN TALKING POINTS: ${campaign.message_template}` : ''}
POSITION: ${position}`
    : `ISSUE: ${parsed.data.issue}
${parsed.data.ask ? `THE CONSTITUENT'S GOAL: ${parsed.data.ask}` : ''}
POSITION: ${position}`;
  const user2 = `${user}
${parsed.data.personalWhy?.trim() ? `THE CONSTITUENT'S OWN WORDS ABOUT WHY THIS MATTERS TO THEM: """${parsed.data.personalWhy.trim()}"""` : 'The constituent did not share a personal story — build the case from the material above alone.'}

Draft the core message.`;

  try {
    const rawOut = await callClaude(system, user2, 700);
    const out = extractJSON(rawOut) as { body?: string } | null;
    const body = deDash(String(out?.body ?? '').trim());
    if (!body || body.length < 40) {
      return NextResponse.json({ error: 'Could not draft a message — please try again' }, { status: 502 });
    }
    return NextResponse.json({ body });
  } catch (err) {
    console.error('[generate-core] failed:', err);
    return NextResponse.json({ error: 'Message drafting is unavailable right now' }, { status: 503 });
  }
}
