import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { isCampaignClosed } from '@/lib/campaign-close';
import { createClient } from '@/lib/supabase/server';
import { trackSendSchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { checkLegislatorCooldown, resolveUsageIdentity, enforceOfficeSendQuota, hashIp } from '@/lib/usage-quota';
import { recordSendRefusal } from '@/lib/send-refusals';
import { verifyTurnstile } from '@/lib/turnstile';
import { captchaStrictFor } from '@/lib/campaign-captcha';
import { enqueueCwcDeliveries } from '@/lib/cwc';
import { buildCwcQueueItem, shouldEnqueueCwc, type CampaignBillContext } from '@/lib/cwc/enqueue-from-send';
import { buildWebformQueueItem, enqueueWebformDelivery } from '@/lib/webform/queue';
import { CWC_MESSAGE_STATUS, WEBFORM_MESSAGE_STATUS, setMessageDeliveryStatus } from '@/lib/cwc/message-status';
import { isStrongerStatus } from '@/lib/delivery-status';
import { locTopicsForIssueArea } from '@/lib/cwc/topics';

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
    await recordSendRefusal('rate_limited', { status: 429, ipHash: hashIp(ip) });
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    await recordSendRefusal('invalid_json', { status: 400, ipHash: hashIp(ip) });
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const parsed = parseBody(trackSendSchema, raw);
  if (!parsed.success) {
    // A rejected payload was never parsed, so every field logged as null and
    // the refusal could not say what it was. Eight months of state and local
    // sends were refused and the table recorded only that something had been.
    // Pull the identifying bits off the raw body so the next one names itself.
    const r = (raw ?? {}) as Record<string, unknown>;
    const rawLegislatorId = typeof r.legislator_id === 'string' ? r.legislator_id : null;
    console.error('[track-send] schema rejected:', {
      level: typeof r.legislator_level === 'string' ? r.legislator_level : null,
      idLength: rawLegislatorId?.length ?? null,
      status: typeof r.delivery_status === 'string' ? r.delivery_status : null,
      detail: parsed.error,
    });
    await recordSendRefusal('schema_rejected', {
      status: 400,
      ipHash: hashIp(ip),
      legislatorId: rawLegislatorId?.slice(0, 120) ?? null,
      campaignId: typeof r.campaign_id === 'string' ? r.campaign_id : null,
    });
    return NextResponse.json(
      { error: parsed.error },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // A scheduled canary walks this path every day so a payload shape we have
  // stopped accepting is found by us rather than by a constituent. The state
  // and local ids were rejected here for eight months while the page said
  // the message was counted, and nothing noticed because nothing was looking.
  //
  // It validates and stops: no row, no delivery, no side effects. Without
  // dry_run the secret does nothing, so the request still faces the bot check.
  const canarySecret = process.env.CANARY_SECRET;
  const isCanaryDryRun =
    !!canarySecret &&
    request.headers.get('x-canary-secret') === canarySecret &&
    (raw as { dry_run?: unknown }).dry_run === true;
  if (isCanaryDryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      level: body.legislator_level,
      legislatorIdLength: body.legislator_id.length,
      hasChamber: typeof body.legislator_chamber === 'string',
    });
  }

  const identity = await resolveUsageIdentity(ip);
  if (process.env.TURNSTILE_SECRET_KEY) {
    // Bot check stays on for the general website, off for an organization's
    // campaign (see src/lib/campaign-captcha.ts).
    const strict = await captchaStrictFor({ userId: identity.userId, campaignId: body.campaign_id || null });
    const valid = await verifyTurnstile(body.turnstileToken || '', { strict });
    if (!valid) {
      await recordSendRefusal('captcha_failed', {
        status: 403, campaignId: body.campaign_id || null, userId: identity.userId, ipHash: identity.ipHash,
      });
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
      await recordSendRefusal('legislator_cooldown', {
        status: 429, campaignId: body.campaign_id || null, userId: verifiedUserId,
        ipHash: identity.ipHash, legislatorId: body.legislator_id,
      });
      return NextResponse.json(
        { error: `You already contacted this official on ${cooldown.lastContactDate}. Please wait before sending another message to the same representative.` },
        { status: 429 },
      );
    }
  }

  // Per-office daily cap on messages WE deliver to a congressional office.
  //
  // The cooldown above only ever ran for signed-in users, so the anonymous
  // campaign flow had no per-office limit at all, and the delivery dedupe
  // does not provide one: it keys on the exact body, so changing a single
  // character produces a new key and a real second delivery. This counts
  // sends, not text, so editing the letter does not buy another one.
  //
  // Only the channels we deliver on. A message the person sends from their
  // own mail app is between them and the office.
  const deliversToOffice =
    !!body.cwc && (body.delivery_status === 'cwc_submitted' || body.delivery_status === 'webform_submitted');
  if (deliversToOffice && body.legislator_id) {
    const officeQuota = await enforceOfficeSendQuota({
      email: body.cwc?.email ?? body.advocate_email ?? null,
      userId: verifiedUserId,
      officialId: body.legislator_id,
    });
    if (!officeQuota.allowed) {
      await recordSendRefusal('office_quota', {
        status: 429, campaignId: body.campaign_id || null, userId: verifiedUserId,
        ipHash: identity.ipHash, legislatorId: body.legislator_id,
      });
      return NextResponse.json(
        {
          error:
            'You have reached the daily limit for messages to this office. Congressional offices treat repeated messages from one person as spam, which costs every constituent who writes through us. Please try again tomorrow, or write to a different official.',
        },
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
        await recordSendRefusal('campaign_closed', {
          status: 409, campaignId: body.campaign_id, userId: verifiedUserId, ipHash: identity.ipHash,
        });
        return NextResponse.json(
          { error: 'This campaign has closed and is no longer accepting messages.' },
          { status: 409 },
        );
      }
    }

    // The row this request ends up pointing at, whether it was created now
    // or already existed.
    let messageRowId: string | null = null;

    // One row per person per official per campaign, not one per click.
    //
    // She opens her mail app, copies the text, comes back and opens it again.
    // Each was an insert, so on 2026-11-13 one constituent writing to five
    // officials produced ten rows and every count on the site read it as ten
    // messages. Copying is not sending, and opening twice is not writing
    // twice.
    //
    // Bounded by a week, matching the legislator cooldown: the same person
    // writing to the same office about the same thing a month later is a
    // second message and should look like one.
    const sameSender = (body.advocate_email || '').trim().toLowerCase();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    type ExistingRow = { id: string; delivery_status: string | null };
    let existing: ExistingRow | null = null;
    if (sameSender) {
      // Wrapped, and deliberately. This is a tidiness lookup: if it cannot
      // run, the right outcome is an extra row, not a constituent losing
      // their message because the deduplication query failed.
      try {
        let q = supabase
          .from('messages')
          .select('id, delivery_status')
          .eq('advocate_email', body.advocate_email)
          .eq('legislator_id', body.legislator_id)
          .gte('created_at', weekAgo)
          .order('created_at', { ascending: false })
          .limit(1);
        q = body.campaign_id ? q.eq('campaign_id', body.campaign_id) : q.is('campaign_id', null);
        const { data: found } = await q.maybeSingle();
        existing = (found as ExistingRow | null) ?? null;
      } catch (e) {
        console.error('[track-send] dedupe lookup failed, inserting a new row:', (e as Error).message);
      }
    }

    if (existing) {
      // Only ever forward. A copy click arriving after an open must not
      // reduce what we believe happened.
      if (isStrongerStatus(body.delivery_status, existing.delivery_status)) {
        await supabase
          .from('messages')
          .update({ delivery_status: body.delivery_status, delivery_method: body.delivery_method })
          .eq('id', existing.id);
      }
      messageRowId = existing.id;
    }

    const { data, error } = messageRowId
      ? { data: { id: messageRowId }, error: null }
      : await supabase.from('messages').insert({
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
      // issue_area is whatever the classifier or the person typed, so one
      // subject arrives under several spellings and no count can be trusted.
      // Store the Library of Congress policy area beside it. The sender's own
      // wording above is left untouched.
      issue_topic: locTopicsForIssueArea(body.issue_area, undefined, body.issue_subtopic)[0],
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
      await recordSendRefusal('insert_failed', {
        status: 500, campaignId: body.campaign_id || null, userId: verifiedUserId,
        ipHash: identity.ipHash, legislatorId: body.legislator_id,
      });
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
