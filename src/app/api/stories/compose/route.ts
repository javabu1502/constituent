import { NextResponse } from 'next/server';
import { callClaude, extractJSON, deDash } from '@/lib/claude';
import { createAdminClient } from '@/lib/supabase';
import { STORY_COMPOSE_PROMPT, STORY_REVISE_PROMPT } from '@/lib/story-interview-prompt';
import { storyComposeSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, getClientIp } from '@/lib/rate-limit';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';
import { verifyTurnstile } from '@/lib/turnstile';
import { draftProblemDetails, draftWordBudget, draftWordFloor, tellerNotes, type DraftProblem } from '@/lib/story-draft-check';
import { detectLanguage } from '@/lib/language';
import { isRatherNotSay } from '@/lib/copy/storyteller';

// Two drafting passes plus parsing can run past the default function limit.
export const maxDuration = 60;

/**
 * POST /api/stories/compose
 * Compose a first-person story draft from the interview transcript.
 * Returns { title, body, notes }. The storyteller reviews + edits before consenting.
 */

const COPY = {
  en: {
    needMore: 'Could not compose a story yet. Try sharing a little more first.',
    editFailed: 'Could not make that edit. Try rewording the request.',
    failed: 'Something went wrong composing your story. Please try again.',
  },
  es: {
    needMore: 'Todavía no pudimos redactar una historia. Comparta un poco más primero.',
    editFailed: 'No pudimos hacer ese cambio. Intente expresar la solicitud de otra forma.',
    failed: 'Algo salió mal al redactar su historia. Inténtelo de nuevo.',
  },
} as const;

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

  const { campaignSlug, messages, turnstileToken, currentBody, currentTitle, revisionNote } = parsed.data;
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
  // "Rather not say" is a button, not the storyteller's words.
  const tellerText = messages.filter((m) => m.role === 'user' && !isRatherNotSay(m.content)).map((m) => m.content).join('\n');
  const tellerWords = tellerText.split(/\s+/).filter(Boolean).length;

  // Campaign language and names (best effort): the language picks which
  // messages the storyteller sees; the organization's name may appear in the
  // draft without counting as an invented proper noun.
  let language: 'en' | 'es' = detectLanguage(tellerText);
  const allow: string[] = [];
  try {
    const admin = createAdminClient();
    const { data: campaign } = await admin
      .from('campaigns')
      .select('language, org_name, headline')
      .eq('slug', campaignSlug)
      .single();
    if (campaign?.language === 'es' || campaign?.language === 'en') language = campaign.language;
    for (const v of [campaign?.org_name, campaign?.headline]) if (typeof v === 'string' && v.trim()) allow.push(v);
  } catch {
    // The transcript's own language and an empty allowlist are fine.
  }
  const copy = COPY[language];

  // Matches the client's lowest hand-off path (guide said ready + 30 words).
  if (!isRevision && tellerWords < 30) {
    return NextResponse.json({ error: copy.needMore }, { status: 422 });
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
    let remaining: DraftProblem[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      const text = await callClaude(`${systemBase}${lengthNote}${correction ? `\n\n${correction}` : ''}`, userContent, 1600);
      json = extractJSON(text) as { title?: string; body?: string; notes?: unknown } | null;
      if (!json || typeof json.body !== 'string' || json.body.trim().length < 20) break;
      const problems = draftProblemDetails(json.body, tellerText, isRevision ? null : maxWords, isRevision ? null : minWords, { allow });
      remaining = problems;
      if (problems.length === 0 || attempt === 1) break;
      correction = `YOUR PREVIOUS DRAFT HAD THESE PROBLEMS: ${problems.map((p) => p.message).join('; ')}. Rewrite it using only what the storyteller said.`;
    }

    if (!json || typeof json.body !== 'string' || json.body.trim().length < 20) {
      return NextResponse.json(
        { error: isRevision ? copy.editFailed : copy.needMore },
        { status: 422 }
      );
    }

    // A problem that survived the retry ships with the draft, but the
    // storyteller is told exactly what to check (audit 2026-10-23).
    if (remaining.length) {
      console.warn('[stories/compose] draft kept problems after retry:', remaining.map((p) => p.message).join('; '));
    }
    const modelNotes = Array.isArray(json.notes)
      ? (json.notes as unknown[]).filter((n): n is string => typeof n === 'string' && n.trim().length > 0).map((n) => deDash(n.trim()).slice(0, 240))
      : [];
    const notes = [...tellerNotes(remaining, language), ...modelNotes].slice(0, 8);
    return NextResponse.json({
      title: deDash((json.title || '').slice(0, 120)),
      body: deDash(json.body.trim().slice(0, 8000)),
      notes,
    });
  } catch (err) {
    console.error('Story compose API error:', err);
    return NextResponse.json({ error: copy.failed }, { status: 500 });
  }
}
