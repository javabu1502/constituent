import { NextRequest, NextResponse } from 'next/server';
import { callClaude, extractJSON, cleanText } from '@/lib/claude';
import { generateCommentSchema, parseBody } from '@/lib/schemas';
import { generateLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

/**
 * POST /api/generate-comment
 *
 * Generates an AI-assisted public comment for a federal regulation.
 * Uses the Anthropic API (same as the contact message generator).
 */

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = generateLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI comment generation is not configured' },
      { status: 503 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = parseBody(generateCommentSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { regulationTitle, agency, abstract, position, personalStory, keyPoints, senderName, turnstileToken } = parsed.data;

  if (turnstileToken !== undefined || process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(turnstileToken || '');
    if (!valid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
    }
  }

  const positionLabel = position === 'support' ? 'supporting' : position === 'oppose' ? 'opposing' : 'raising concerns about';

  const systemPrompt = `You are an expert at writing effective public comments on proposed federal regulations. Help citizens participate in the notice-and-comment rulemaking process.

Writing guidelines:
- Write a substantive public comment that agencies take seriously
- Be specific and factual — vague comments carry less weight
- Reference the specific regulation and agency
- Include relevant data, examples, or personal experience when provided
- Maintain a respectful, professional tone
- Keep the comment between 200-400 words
- Structure: opening position → specific points/evidence → personal impact (if applicable) → conclusion with clear recommendation
- NEVER fabricate facts, statistics, or citations. Only reference specific data if the user provides it.
- If the user provides personal experience, weave it in naturally
- Make it sound like a real person wrote it, not a form letter

IMPORTANT:
- This is a public comment on a federal regulation, NOT a letter to an elected official
- Address the agency (e.g., "I am writing to comment on the proposed rule...")
- Include the commenter's name
- Be substantive — agencies must respond to substantive comments

CRITICAL: Respond with ONLY a JSON object with these fields:
{
  "comment": "The full public comment text"
}`;

  const userPrompt = `Write a public comment ${positionLabel} the following proposed regulation:

REGULATION: ${regulationTitle}
AGENCY: ${agency}
${abstract ? `SUMMARY: ${abstract}` : ''}

COMMENTER NAME: ${senderName}
POSITION: ${position}
${personalStory ? `PERSONAL EXPERIENCE: ${personalStory}` : ''}
${keyPoints ? `KEY POINTS TO INCLUDE: ${keyPoints}` : ''}

Generate a substantive, well-structured public comment.`;

  try {
    const raw = await callClaude(systemPrompt, userPrompt, 800);
    const parsed = extractJSON(raw) as { comment?: string } | null;

    if (!parsed?.comment) {
      return NextResponse.json({ error: 'Failed to generate comment' }, { status: 500 });
    }

    return NextResponse.json({
      comment: cleanText(parsed.comment),
    });
  } catch (err) {
    console.error('[generate-comment] Error:', err);
    return NextResponse.json({ error: 'Failed to generate comment' }, { status: 500 });
  }
}
