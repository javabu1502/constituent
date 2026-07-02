import { callClaudeStreamFast } from '@/lib/claude-stream';
import { buildStoryInterviewPrompt } from '@/lib/story-interview-prompt';
import { storyChatSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';
import { createAdminClient } from '@/lib/supabase';

/**
 * POST /api/chat/story-interview
 * Streams the trauma-informed story-development conversation for a
 * storytelling campaign. Mirrors /api/chat/interview but is scoped to a
 * specific (approved, storytelling) campaign and uses its prompt + usage terms.
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

  const parsed = parseBody(storyChatSchema, raw);
  if (!parsed.success) {
    return new Response(parsed.error, { status: 400 });
  }

  const { campaignSlug, messages, turnstileToken } = parsed.data;

  const identity = await resolveUsageIdentity(ip);

  if (process.env.NODE_ENV === 'production') {
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

  // Load the campaign so the guide stays on-topic and honest about usage.
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('headline, description, story_prompt, usage_statement, campaign_type, approval_status')
    .eq('slug', campaignSlug)
    .eq('approval_status', 'approved')
    .eq('campaign_type', 'storytelling')
    .single();

  if (!campaign) {
    return new Response('Campaign not found', { status: 404 });
  }

  const systemPrompt = buildStoryInterviewPrompt(campaign);

  try {
    const stream = callClaudeStreamFast(systemPrompt, messages, 700);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Story interview chat API error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}
