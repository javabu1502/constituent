import { NextResponse } from 'next/server';
import { callClaude, extractJSON, deDash } from '@/lib/claude';
import { STORY_COMPOSE_PROMPT, STORY_REVISE_PROMPT } from '@/lib/story-interview-prompt';
import { storyComposeSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, getClientIp } from '@/lib/rate-limit';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';
import { verifyTurnstile } from '@/lib/turnstile';
import { draftProblems, draftWordBudget, draftWordFloor } from '@/lib/story-draft-check';

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
    // Storytelling is lenient on a MISSING token: an organization's testers hit
    // "CAPTCHA verification failed" on 2026-10-09 because their network never
    // produced a Turnstile token. These routes are rate limited per IP and
    // daily-quota'd, and the org reviews every story, so a missing token is
    // allowed; a token that is present but invalid is still rejected.
    const valid = await verifyTurnstile(turnstileToken || '', { strict: false });
    if (!valid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
    }
  }
  const { allowed } = await enforceDailyQuota(ip, 'chat', identity);
  if (!allowed) {
    return NextResponse.json({ error: 'Daily limit reached. Try again tomorrow.' }, { status: 429 });
  }

  // The storyteller's own words are the only source of facts. Guide turns are
  // kept as context, clearly marked, so an unanswered question can never be
  // read as an answer (audit 2026-09-29).
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Storyteller' : 'Guide'}: ${m.content}`)
    .join('\n\n');
  const tellerText = messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n');
  const tellerWords = tellerText.split(/\s+/).filter(Boolean).length;
  // Matches the client's lowest hand-off path (guide said ready + 30 words).
  if (!isRevision && tellerWords < 30) {
    return NextResponse.json({ error: 'Could not compose a story yet. Try sharing a little more first.' }, { status: 422 });
  }
  const maxWords = Math.max(draftWordBudget(tellerWords), draftWordFloor(tellerWords) + 60);
  const minWords = draftWordFloor(tellerWords);

  try {
    // Revision mode: the storyteller has a draft and a plain-language edit
    // request; the transcript stays the source of truth for facts.
    const userContent = isRevision
      ? `INTERVIEW TRANSCRIPT (source of truth for facts):\n${transcript}\n\nCURRENT TITLE: ${currentTitle?.trim() || '(none)'}\n\nCURRENT DRAFT:\n${currentBody!.trim()}\n\nSTORYTELLER'S EDIT REQUEST: ${revisionNote!.trim()}`
      : transcript;
    const systemBase = isRevision ? STORY_REVISE_PROMPT : STORY_COMPOSE_PROMPT;
    const lengthNote = isRevision ? '' : `\n\nThe storyteller wrote ${tellerWords} words. Write at least ${minWords} words and no more than ${maxWords}. Develop what they said; do not restate it.`;
    let json: { title?: string; body?: string; notes?: unknown } | null = null;
    let correction = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      const text = await callClaude(`${systemBase}${lengthNote}${correction ? `\n\n${correction}` : ''}`, userContent, 1600);
      json = extractJSON(text) as { title?: string; body?: string; notes?: unknown } | null;
      if (!json || typeof json.body !== 'string' || json.body.trim().length < 20) break;
      const problems = draftProblems(json.body, tellerText, isRevision ? null : maxWords, isRevision ? null : minWords);
      if (problems.length === 0 || attempt === 1) break;
      correction = `YOUR PREVIOUS DRAFT HAD THESE PROBLEMS: ${problems.join('; ')}. Rewrite it using only what the storyteller said.`;
    }

    if (!json || typeof json.body !== 'string' || json.body.trim().length < 20) {
      return NextResponse.json(
        { error: isRevision ? 'Could not make that edit. Try rewording the request.' : 'Could not compose a story yet. Try sharing a little more first.' },
        { status: 422 }
      );
    }

    const notes = Array.isArray(json.notes)
      ? (json.notes as unknown[]).filter((n): n is string => typeof n === 'string' && n.trim().length > 0).map((n) => deDash(n.trim()).slice(0, 240)).slice(0, 6)
      : [];
    return NextResponse.json({
      title: deDash((json.title || '').slice(0, 120)),
      body: deDash(json.body.trim().slice(0, 8000)),
      notes,
    });
  } catch (err) {
    console.error('Story compose API error:', err);
    return NextResponse.json({ error: 'Something went wrong composing your story' }, { status: 500 });
  }
}
