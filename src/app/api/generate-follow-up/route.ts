import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateFollowUpSchema, parseBody } from '@/lib/schemas';
import { generateLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = generateLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI generation is not configured' }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = parseBody(generateFollowUpSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { originalMessageId, followUpType, senderName, additionalContext, turnstileToken } = parsed.data;

  if (turnstileToken !== undefined || process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(turnstileToken || '');
    if (!valid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
    }
  }

  // Fetch original message
  const supabase = createAdminClient();
  const { data: originalMsg, error: fetchError } = await supabase
    .from('messages')
    .select('legislator_name, legislator_party, issue_area, issue_subtopic, delivery_method, message_body, created_at')
    .eq('id', originalMessageId)
    .single();

  if (fetchError || !originalMsg) {
    return NextResponse.json({ error: 'Original message not found' }, { status: 404 });
  }

  const originalDate = new Date(originalMsg.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isEmail = originalMsg.delivery_method !== 'phone';

  // Build system prompt based on follow-up type
  let typeInstructions: string;
  if (followUpType === 'no_response') {
    typeInstructions = `The constituent sent a message on ${originalDate} and has received no response.
Write a follow-up that:
- Notes that no response was received to the original message
- Reiterates the ask firmly but respectfully
- Expresses the importance of constituent communication
- Is slightly more urgent in tone than the original`;
  } else {
    typeInstructions = `The constituent received a response to their message sent on ${originalDate}.
Write a follow-up that:
- Thanks the official for their response
- Expresses continued engagement on this issue
- Reaffirms commitment to civic participation
- Is warm but maintains the constituent's position`;
  }

  const formatInstructions = isEmail
    ? `Format as an email. Include a subject line.
Do NOT include a greeting line (no "Dear Senator") or signature block (no "Sincerely") — the app handles those.
Respond with ONLY this JSON: {"officialName": "${originalMsg.legislator_name}", "subject": "max 8 words", "body": "the letter body"}`
    : `Format as a phone script. Keep it under 120 words. Conversational, first-person tone.
Do NOT include opening ("Hi, my name is...") or closing ("Thank you for your time.") — the app handles those.
Respond with ONLY this JSON: {"officialName": "${originalMsg.legislator_name}", "subject": "", "body": "the phone script"}`;

  const systemPrompt = `You are an expert at writing constituent follow-up messages. ${typeInstructions}

${formatInstructions}

CRITICAL: Respond with ONLY a JSON object. No other text.`;

  const userPrompt = `Write a follow-up ${isEmail ? 'email' : 'phone script'} for:

OFFICIAL: ${originalMsg.legislator_name} (${originalMsg.legislator_party})
ORIGINAL DATE: ${originalDate}
ORIGINAL ISSUE: ${originalMsg.issue_area}${originalMsg.issue_subtopic ? ` — ${originalMsg.issue_subtopic}` : ''}
ORIGINAL METHOD: ${originalMsg.delivery_method}
SENDER: ${senderName}${additionalContext ? `\nADDITIONAL CONTEXT: ${additionalContext}` : ''}

ORIGINAL MESSAGE EXCERPT:
${originalMsg.message_body.slice(0, 500)}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[generate-follow-up] Anthropic API error:', response.status, errText);
      return NextResponse.json({ error: 'Failed to generate follow-up' }, { status: 502 });
    }

    const data = await response.json();
    const textParts: string[] = [];
    for (const block of (data.content || [])) {
      if (block.type === 'text' && block.text) {
        textParts.push(block.text);
      }
    }

    const rawText = textParts.join('\n');

    // Try to parse JSON
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 });
    }

    const result = JSON.parse(jsonMatch[0]) as { officialName: string; subject: string; body: string };

    return NextResponse.json({
      officialName: result.officialName || originalMsg.legislator_name,
      subject: result.subject || '',
      body: result.body || rawText,
    });
  } catch (err) {
    console.error('[generate-follow-up] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
