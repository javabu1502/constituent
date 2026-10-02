import { callClaudeStreamFast } from '@/lib/claude-stream';
import { buildCampaignInterviewPrompt } from '@/lib/campaign-interview-prompt';
import { campaignChatSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';
import { createAdminClient } from '@/lib/supabase';

/**
 * POST /api/chat/campaign-interview
 * Streams the guided "why does this matter to you" conversation on an
 * advocacy campaign's participation flow. Mirrors /api/chat/story-interview
 * but is scoped to an approved advocacy campaign or official weigh-in and
 * carries the participant's stance so the guide never argues against them.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success, retryAfter } = chatLimiter.check(ip);
  if (!success) {
    return new Response('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('AI assistant is temporarily unavailable', { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const parsed = parseBody(campaignChatSchema, raw);
  if (!parsed.success) {
    return new Response(parsed.error, { status: 400 });
  }

  const { campaignSlug, messages, stance, turnstileToken } = parsed.data;

  const identity = await resolveUsageIdentity(ip);

  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(turnstileToken || '', { strict: !identity.userId });
    if (!valid) {
      return new Response('CAPTCHA verification failed', { status: 403 });
    }
  }

  const { allowed: dailyOk } = await enforceDailyQuota(ip, 'chat', identity);
  if (!dailyOk) {
    return new Response('Daily chat limit reached. Try again tomorrow.', { status: 429 });
  }

  const last = messages[messages.length - 1];
  if (last.role !== 'user') {
    return new Response('Last message must be from user', { status: 400 });
  }

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('headline, description, is_official, direction, language, campaign_type, approval_status')
    .eq('slug', campaignSlug)
    .eq('approval_status', 'approved')
    .neq('campaign_type', 'storytelling')
    .single();

  if (!campaign) {
    return new Response('Campaign not found', { status: 404 });
  }

  const systemPrompt = buildCampaignInterviewPrompt(campaign, stance ?? null);

  try {
    const stream = callClaudeStreamFast(systemPrompt, messages, 500);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Campaign interview chat API error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}
