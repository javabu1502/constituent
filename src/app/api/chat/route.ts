import { callClaudeStreamWithSearch } from '@/lib/claude-stream';
import { CHAT_SYSTEM_PROMPT } from '@/lib/chat-system-prompt';
import { chatRequestSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';

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

  const parsed = parseBody(chatRequestSchema, raw);
  if (!parsed.success) {
    return new Response(parsed.error, { status: 400 });
  }

  const { messages, turnstileToken } = parsed.data;

  // Resolve who this request is (user or hashed IP) once, for the bot + cost checks
  const identity = await resolveUsageIdentity(ip);

  // Bot protection: anonymous requests must pass Turnstile; signed-in users get the lenient path
  if (process.env.NODE_ENV === 'production') {
    const valid = await verifyTurnstile(turnstileToken || '', { strict: !identity.userId });
    if (!valid) {
      return new Response('CAPTCHA verification failed', { status: 403 });
    }
  }

  // Durable daily cap, keyed by user (if signed in) or hashed IP
  const { allowed: dailyOk } = await enforceDailyQuota(ip, 'chat', identity);
  if (!dailyOk) {
    return new Response('Daily chat limit reached. Try again tomorrow.', { status: 429 });
  }

  const last = messages[messages.length - 1];
  if (last.role !== 'user') {
    return new Response('Last message must be from user', { status: 400 });
  }

  // The assistant can search the web for current/time-sensitive questions and
  // cite sources. It self-gates — stable civics questions are answered directly,
  // so a search (billed per use) only happens when the topic genuinely needs it.
  const systemPrompt = `${CHAT_SYSTEM_PROMPT}

You have a web_search tool. Use it ONLY when the question depends on current, time-sensitive, or recent information — recent events, the status of a current bill or vote, current prices, or who currently holds an office. For stable civics knowledge, answer directly without searching. When you do search: base every claim on the results, attribute to the source and the date/timeframe, stay strictly nonpartisan, hedge on developing stories, and never fabricate. The cited sources are shown to the user automatically.`;

  try {
    const stream = callClaudeStreamWithSearch(systemPrompt, messages, 1024);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}
