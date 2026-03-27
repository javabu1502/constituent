import { callClaudeStream } from '@/lib/claude-stream';
import { CHAT_SYSTEM_PROMPT } from '@/lib/chat-system-prompt';
import { chatRequestSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, dailyChatCap, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

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

  // Require CAPTCHA in production
  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(turnstileToken || '');
    if (!valid) {
      return new Response('CAPTCHA verification failed', { status: 403 });
    }
  }

  // Daily cap per IP (no auth required)
  const { success: dailyOk } = dailyChatCap.check(ip);
  if (!dailyOk) {
    return new Response('Daily chat limit reached. Try again tomorrow.', { status: 429 });
  }

  const last = messages[messages.length - 1];
  if (last.role !== 'user') {
    return new Response('Last message must be from user', { status: 400 });
  }

  try {
    const stream = callClaudeStream(CHAT_SYSTEM_PROMPT, messages, 800);

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
