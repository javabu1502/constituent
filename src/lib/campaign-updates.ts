/**
 * Advance-the-campaign emails — the retention engine. When an org opens the
 * next stage of an initiative, everyone who already acted hears about it:
 * "the bill moved, here's the next action." Recipients are advocate emails
 * collected (with notice) on org-campaign participation.
 *
 * Compliance: every send checks email_suppressions and carries a one-click
 * unsubscribe link (HMAC-signed, no account needed). Demo/test data
 * (@example.com and demo- campaigns) is never actually mailed.
 */
import { createHmac, timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase';
import { Resend } from 'resend';

export const UPDATES_LIST = 'campaign_updates';

function secret(): string {
  const s = process.env.CRON_SECRET;
  if (!s) throw new Error('CRON_SECRET required for unsubscribe tokens');
  return s;
}

/** HMAC token binding an email to the campaign-updates list. */
export function updatesUnsubscribeToken(email: string): string {
  return createHmac('sha256', secret()).update(`${UPDATES_LIST}:${email.toLowerCase()}`).digest('hex').slice(0, 32);
}

export function verifyUpdatesUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = Buffer.from(updatesUnsubscribeToken(email));
    const got = Buffer.from(token);
    return expected.length === got.length && timingSafeEqual(expected, got);
  } catch {
    return false;
  }
}

export interface AdvanceSendResult {
  eligible: number;
  sent: number;
  suppressed: number;
  skippedTestData: number;
}

/**
 * Email every prior participant of an initiative about its new stage.
 * Batched via Resend; failures are logged, never thrown (stage creation must
 * not break on email hiccups).
 */
export async function sendStageAdvanceEmails(args: {
  parentId: string;
  parentSlug: string;
  parentHeadline: string;
  orgName: string | null;
  billRef: string | null;
  stageSlug: string;
  stageHeadline: string;
}): Promise<AdvanceSendResult> {
  const admin = createAdminClient();
  const result: AdvanceSendResult = { eligible: 0, sent: 0, suppressed: 0, skippedTestData: 0 };

  // Audience: distinct emails across the whole initiative (parent + stages).
  const { data: children } = await admin.from('campaigns').select('id').eq('parent_campaign_id', args.parentId);
  const ids = [args.parentId, ...(children ?? []).map((c) => c.id as string)];
  const { data: actions } = await admin
    .from('campaign_actions')
    .select('participant_email, participant_name')
    .in('campaign_id', ids)
    .not('participant_email', 'is', null)
    .limit(10000);

  const byEmail = new Map<string, string | null>();
  for (const a of actions ?? []) {
    const e = String(a.participant_email).trim().toLowerCase();
    if (e && !byEmail.has(e)) byEmail.set(e, (a.participant_name as string) ?? null);
  }
  result.eligible = byEmail.size;
  if (byEmail.size === 0) return result;

  const { data: suppressions } = await admin
    .from('email_suppressions')
    .select('email')
    .eq('list', UPDATES_LIST)
    .in('email', [...byEmail.keys()]);
  const suppressed = new Set((suppressions ?? []).map((s) => String(s.email)));
  result.suppressed = suppressed.size;

  if (!process.env.RESEND_API_KEY) {
    console.warn('[campaign-updates] RESEND_API_KEY not set — skipping send');
    return result;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || 'notifications@mydemocracy.app';
  const stageUrl = `https://www.mydemocracy.app/campaign/${args.stageSlug}`;
  const subject = `${args.billRef ? `${args.billRef} moved: ` : ''}${args.stageHeadline}`;

  for (const [email, name] of byEmail) {
    if (suppressed.has(email)) continue;
    // Demo/test advocates are counted but never mailed.
    if (email.endsWith('@example.com') || args.parentSlug.startsWith('demo-')) {
      result.skippedTestData += 1;
      continue;
    }
    const unsub = `https://www.mydemocracy.app/api/campaign-updates/unsubscribe?e=${encodeURIComponent(email)}&t=${updatesUnsubscribeToken(email)}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
        <p style="font-size:13px;color:#7C3AED;font-weight:600;margin:0 0 4px">${escapeHtml(args.orgName || 'My Democracy')}</p>
        <h2 style="margin:0 0 12px;font-size:20px">${escapeHtml(args.billRef ? `${args.billRef} just moved.` : 'The campaign just moved.')}</h2>
        <p style="font-size:15px;line-height:1.5">${escapeHtml(name ? `${name.split(' ')[0]}, you` : 'You')} took action on
        &ldquo;${escapeHtml(args.parentHeadline)}&rdquo; — thank you. The fight has advanced to its next step:</p>
        <p style="font-size:16px;font-weight:600;margin:16px 0 8px">${escapeHtml(args.stageHeadline)}</p>
        <p style="margin:20px 0">
          <a href="${stageUrl}" style="background:#7C3AED;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:15px;font-weight:600">Take the next action</a>
        </p>
        <p style="font-size:12px;color:#777;line-height:1.5;margin-top:28px">
          You're receiving this because you participated in this campaign on My Democracy.
          <a href="${unsub}" style="color:#777">Unsubscribe from campaign updates</a>.
        </p>
      </div>`;
    try {
      const { error } = await resend.emails.send({ from, to: email, subject, html });
      if (error) console.error('[campaign-updates] send failed:', email, error.message);
      else result.sent += 1;
    } catch (err) {
      console.error('[campaign-updates] send threw:', err);
    }
  }
  console.log(`[campaign-updates] ${args.stageSlug}: eligible=${result.eligible} sent=${result.sent} suppressed=${result.suppressed} testSkipped=${result.skippedTestData}`);
  return result;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
