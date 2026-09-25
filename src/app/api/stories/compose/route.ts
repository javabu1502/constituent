import { NextResponse } from 'next/server';
import { callClaude, extractJSON, deDash } from '@/lib/claude';
import { STORY_COMPOSE_PROMPT, STORY_REVISE_PROMPT } from '@/lib/story-interview-prompt';
import { storyComposeSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, getClientIp } from '@/lib/rate-limit';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';
import { verifyTurnstile } from '@/lib/turnstile';

/**
 * POST /api/stories/compose
 * Compose a first-person story draft from the interview transcript.
 * Returns { title, body }. The storyteller reviews + edits before consenting.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success, retryAfter } = chatLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI assistant is temporarily unavailable' }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseBody(storyComposeSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { messages, turnstileToken, currentBody, currentTitle, revisionNote } = parsed.data;
  const isRevision = !!(revisionNote?.trim() && currentBody?.trim());

  const identity = await resolveUsageIdentity(ip);
  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(turnstileToken || '', { strict: !identity.userId });
    if (!valid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
    }
  }
  const { allowed } = await enforceDailyQuota(ip, 'chat', identity);
  if (!allowed) {
    return NextResponse.json({ error: 'Daily limit reached. Try again tomorrow.' }, { status: 429 });
  }

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Storyteller' : 'Guide'}: ${m.content}`)
    .join('\n\n');

  try {
    // Revision mode: the storyteller has a draft and a plain-language edit
    // request; the transcript stays the source of truth for facts.
    const userContent = isRevision
      ? `INTERVIEW TRANSCRIPT (source of truth for facts):\n${transcript}\n\nCURRENT TITLE: ${currentTitle?.trim() || '(none)'}\n\nCURRENT DRAFT:\n${currentBody!.trim()}\n\nSTORYTELLER'S EDIT REQUEST: ${revisionNote!.trim()}`
      : transcript;
    const text = await callClaude(isRevision ? STORY_REVISE_PROMPT : STORY_COMPOSE_PROMPT, userContent, 1600);
    const json = extractJSON(text) as { title?: string; body?: string } | null;

    if (!json || typeof json.body !== 'string' || json.body.trim().length < 20) {
      return NextResponse.json(
        { error: isRevision ? 'Could not make that edit. Try rewording the request.' : 'Could not compose a story yet. Try sharing a little more first.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      title: deDash((json.title || '').slice(0, 120)),
      body: deDash(json.body.trim().slice(0, 8000)),
    });
  } catch (err) {
    console.error('Story compose API error:', err);
    return NextResponse.json({ error: 'Something went wrong composing your story' }, { status: 500 });
  }
}
