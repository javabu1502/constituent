import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isCampaignClosed } from '@/lib/campaign-close';
import { createClient } from '@/lib/supabase/server';
import { trackSendSchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { checkLegislatorCooldown, resolveUsageIdentity } from '@/lib/usage-quota';
import { verifyTurnstile } from '@/lib/turnstile';
import { captchaStrictFor } from '@/lib/campaign-captcha';
import { enqueueCwcDeliveries } from '@/lib/cwc';
import { buildCwcQueueItem, shouldEnqueueCwc, type CampaignBillContext } from '@/lib/cwc/enqueue-from-send';
import { buildWebformQueueItem, enqueueWebformDelivery } from '@/lib/webform/queue';
import { CWC_MESSAGE_STATUS, WEBFORM_MESSAGE_STATUS, setMessageDeliveryStatus } from '@/lib/cwc/message-status';

// The CWC enqueue path (after()) reaches congressional endpoints through the
// undici static-IP proxy — Node runtime required.
export const runtime = 'nodejs';
// The CWC enqueue runs an LLM content screen before responding (~2-5s).
export const maxDuration = 60;

/** What the client is told about CWC delivery for this send. */
export type CwcSendStatus = 'queued' | 'held' | 'blocked' | 'skipped' | 'error';

/**
 * POST /api/track-send
 * Log a message send event to Supabase
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = writeLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const parsed = parseBody(trackSendSchema, raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const identity = await resolveUsageIdentity(ip);
  if (process.env.TURNSTILE_SECRET_KEY) {
    // Bot check stays on for the general website, off for an organization's
    // campaign (see src/lib/campaign-captcha.ts).
    const strict = await captchaStrictFor({ userId: identity.userId, campaignId: body.campaign_id || null });
    const valid = await verifyTurnstile(body.turnstileToken || '', { strict });
    if (!valid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
    }
  }

  // If user_id is provided, verify it matches the authenticated user
  let verifiedUserId: string | null = body.user_id || null;
  if (verifiedUserId) {
    try {
      const authClient = await createClient();
      const { data: { user } } = await authClient.auth.getUser();
      if (!user || user.id !== verifiedUserId) {
        verifiedUserId = user?.id || null;
      }
    } catch {
      verifiedUserId = null;
    }
  }

  // Per-legislator cooldown: prevent spamming the same rep
  if (verifiedUserId && body.legislator_id) {
    const cooldown = await checkLegislatorCooldown(verifiedUserId, body.legislator_id);
    if (!cooldown.allowed) {
      return NextResponse.json(
        { error: `You already contacted this official on ${cooldown.lastContactDate}. Please wait before sending another message to the same representative.` },
        { status: 429 },
      );
    }
  }

  try {
    const supabase = createAdminClient();

    // A campaign the organizer closed stops accepting messages. The
    // participate route and the story route both check this; track-send did
    // not, so a tab left open on a closed campaign kept inserting messages
    // and enqueueing CWC deliveries after the organizer had shut it down.
    if (body.campaign_id) {
      const { data: camp } = await supabase
        .from('campaigns')
        .select('status')
        .eq('id', body.campaign_id)
        .single();
      if (camp && isCampaignClosed(camp.status as string | null)) {
        return NextResponse.json(
          { error: 'This campaign has closed and is no longer accepting messages.' },
          { status: 409 },
        );
      }
    }

    const { data, error } = await supabase.from('messages').insert({
      advocate_name: body.advocate_name,
      advocate_email: body.advocate_email || null,
      advocate_city: body.advocate_city,
      advocate_state: body.advocate_state,
      advocate_district: body.advocate_district || null,
      legislator_name: body.legislator_name,
      legislator_id: body.legislator_id,
      legislator_party: body.legislator_party,
      legislator_level: body.legislator_level,
      legislator_chamber: body.legislator_chamber,
      issue_area: body.issue_area,
      issue_subtopic: body.issue_subtopic,
      // Only retain the message text for signed-in users, so they can re-read it
      // in their dashboard. Anonymous sends keep the trend metadata above but we
      // do NOT store what they wrote (left empty).
      message_body: verifiedUserId ? body.message_body : '',
      delivery_method: body.delivery_method,
      delivery_status: body.delivery_status,
      message_intent: body.message_intent || null,
      user_id: verifiedUserId,
      campaign_id: body.campaign_id || null,
    }).select('id').single();

    if (error) {
      console.error('[track-send] Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to log message' },
        { status: 500 }
      );
    }

    // CWC delivery: enqueue BEFORE responding so the constituent learns the
    // real outcome (the button used to turn green regardless; audit 09-28).
    // Gated on: server flag + client payload + federal office + the
    // constituent having pressed "Send to Congress" (status cwc_submitted).
    //
    // Delivery truth (audit 2026-10-23): the row above was inserted with the
    // client's 'cwc_submitted'. Every path that does NOT leave a queued row
    // corrects it here (skipped / failed); the queue writes held / blocked,
    // and the drain writes delivered / refused / failed.
    let cwc: { status: CwcSendStatus; reason?: string } | undefined;
    if (shouldEnqueueCwc(body) && body.cwc && data?.id) {
      const cwcPayload = body.cwc;
      const messageId = data.id as string;
      try {
        let campaign: CampaignBillContext | null = null;
        if (body.campaign_id) {
          const { data: c } = await supabase
            .from('campaigns')
            .select('slug, bill_level, bill_congress, bill_type, bill_number, direction, headline')
            .eq('id', body.campaign_id)
            .single();
          campaign = (c as CampaignBillContext | null) ?? null;
        }
        const built = buildCwcQueueItem({ body, cwc: cwcPayload, campaign, messageId });
        if (!built.ok) {
          console.log(`[track-send] cwc skip (${messageId}): ${built.skip}`);
          cwc = { status: 'skipped', reason: built.skip };
          await setMessageDeliveryStatus(supabase, messageId, CWC_MESSAGE_STATUS.skipped);
        } else {
          const result = await enqueueCwcDeliveries([built.item], 'production', { ipHash: identity.ipHash });
          console.log(`[track-send] cwc enqueue (${messageId}):`, JSON.stringify(result));
          cwc =
            result.blockedKeys.length > 0 ? { status: 'blocked' }
            : result.held > 0 ? { status: 'held' }
            : { status: 'queued' };
        }
      } catch (e) {
        console.error(`[track-send] cwc enqueue failed (${messageId}):`, (e as Error).message);
        cwc = { status: 'error' };
        await setMessageDeliveryStatus(supabase, messageId, CWC_MESSAGE_STATUS.failed);
      }
    }

    // Webform delivery: a non-CWC senator whose own contact form we file
    // (flag-gated inside buildWebformQueueItem). Same outcome shape as cwc.
    if (!cwc && body.delivery_status === 'webform_submitted' && body.cwc && body.legislator_level === 'federal' && data?.id) {
      try {
        const campaignRef = body.campaign_id ? `campaign-${body.campaign_id}` : `contact-${(body.issue_area + '-' + body.issue_subtopic).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const built = await buildWebformQueueItem(body, body.cwc, campaignRef, undefined, data.id as string);
        if (!built.ok) {
          console.log(`[track-send] webform skip (${data.id}): ${built.skip}`);
          cwc = { status: 'skipped', reason: built.skip };
          await setMessageDeliveryStatus(supabase, data.id as string, WEBFORM_MESSAGE_STATUS.skipped);
        } else {
          const r = await enqueueWebformDelivery(built.item, { ipHash: identity.ipHash });
          console.log(`[track-send] webform enqueue (${data.id}): ${r.status}`);
          cwc = { status: r.status };
        }
      } catch (e) {
        console.error(`[track-send] webform enqueue failed (${data?.id}):`, (e as Error).message);
        cwc = { status: 'error' };
        await setMessageDeliveryStatus(supabase, data?.id as string | undefined, WEBFORM_MESSAGE_STATUS.failed);
      }
    }

    return NextResponse.json({ success: true, shareId: data?.id, ...(cwc ? { cwc } : {}) });
  } catch (err) {
    console.error('[track-send] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
