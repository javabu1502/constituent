import { NextResponse } from 'next/server';
import { callClaude, extractJSON, deDash } from '@/lib/claude';
import { followUpQuestionsSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, getClientIp } from '@/lib/rate-limit';
import { enforceDailyQuota, resolveUsageIdentity } from '@/lib/usage-quota';

/**
 * POST /api/follow-up-questions
 * After a campaign supporter writes why they care, ask 1-4 very short
 * follow-up questions that draw out concrete detail for their letter.
 *
 * This step is a bonus, never a gate: every failure path (no API key, AI
 * error, unparseable output) returns { questions: [] } with HTTP 200 so the
 * participate flow can skip straight to drafting. No Turnstile here — the
 * drafting call that follows is the protected one.
 */

const FOLLOW_UP_QUESTIONS_PROMPT = `You help a constituent add concrete detail to a letter to their elected officials. You will see the campaign headline, their stance if they chose one, and what they wrote about why they care.

Respond with ONLY valid JSON, no other text:
{"questions": ["...", "..."]}

Rules:
- Ask 1 to 4 questions. If what they wrote is already rich and specific, ask just 1. If they wrote nothing, ask up to 4 gentle starter questions.
- Each question is under 15 words, in plain conversational language.
- Each question digs for ONE concrete detail: a specific moment, a person affected, or what would change for them.
- Build only on what they actually said. NEVER presume an identity, role, or experience they did not state. Do not assume they are a parent, veteran, patient, worker, or anything else.
- Never push for medical, financial, or traumatic detail.
- No em dashes. No exclamation marks.`;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success, retryAfter } = chatLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseBody(followUpQuestionsSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // No key configured: degrade before spending any of the caller's quota.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ questions: [] });
  }

  const identity = await resolveUsageIdentity(ip);
  const { allowed } = await enforceDailyQuota(ip, 'chat', identity);
  if (!allowed) {
    return NextResponse.json({ error: 'Daily limit reached. Try again tomorrow.' }, { status: 429 });
  }

  const { headline, stance, personalWhy } = parsed.data;
  const userContent = [
    `CAMPAIGN HEADLINE: ${headline}`,
    stance ? `THEIR STANCE: ${stance}` : null,
    `WHAT THEY WROTE ABOUT WHY THEY CARE:\n${personalWhy.trim() || '(nothing yet)'}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const text = await callClaude(FOLLOW_UP_QUESTIONS_PROMPT, userContent, 400);
    const json = extractJSON(text) as { questions?: unknown } | null;
    const questions = Array.isArray(json?.questions)
      ? json.questions
          .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
          .map((q) => deDash(q.trim()))
          .slice(0, 4)
      : [];
    return NextResponse.json({ questions });
  } catch (err) {
    console.error('Follow-up questions API error:', err);
    return NextResponse.json({ questions: [] });
  }
}
