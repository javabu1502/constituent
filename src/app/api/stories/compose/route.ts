import { NextResponse } from 'next/server';
import { callClaude, extractJSON } from '@/lib/claude';
import { STORY_COMPOSE_PROMPT } from '@/lib/story-interview-prompt';
import { storyChatSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, getClientIp } from '@/lib/rate-limit';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';

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

  const parsed = parseBody(storyChatSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { messages } = parsed.data;

  const identity = await resolveUsageIdentity(ip);
  const { allowed } = await enforceDailyQuota(ip, 'chat', identity);
  if (!allowed) {
    return NextResponse.json({ error: 'Daily limit reached. Try again tomorrow.' }, { status: 429 });
  }

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Storyteller' : 'Guide'}: ${m.content}`)
    .join('\n\n');

  // Safety net: strip the AI-tell em/en dashes the model may still emit, turning
  // them into ordinary punctuation so stories read like a real person wrote them.
  const deDash = (s: string): string =>
    s
      .replace(/\s*[—–]\s*/g, ', ')   // em/en dash (with any surrounding spaces) -> comma
      .replace(/,\s*,/g, ',')          // collapse accidental double commas
      .replace(/\s+([.,;:!?])/g, '$1') // no space before punctuation
      .replace(/,(\s*[.;:!?])/g, '$1') // drop a comma that landed right before end punctuation
      .replace(/[ \t]{2,}/g, ' ');     // collapse double spaces

  try {
    const text = await callClaude(STORY_COMPOSE_PROMPT, transcript, 1600);
    const json = extractJSON(text) as { title?: string; body?: string } | null;

    if (!json || typeof json.body !== 'string' || json.body.trim().length < 20) {
      return NextResponse.json({ error: 'Could not compose a story yet — try sharing a little more first.' }, { status: 422 });
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
