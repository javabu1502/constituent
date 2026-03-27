import { NextRequest, NextResponse } from 'next/server';
import { callClaudeStream } from '@/lib/claude-stream';
import { researchLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { fetchRecentBills } from '@/lib/research';

interface ResearchRequest {
  issue: string;
  issueCategory: string;
  ask?: string;
}

const SYSTEM_PROMPT = `You are a nonpartisan legislative research assistant. The user is writing to their representative about a specific issue. Help them strengthen their message with factual research.

Given the user's issue and desired action, provide:

1. **Pending Legislation** — 2-3 relevant bills currently in Congress (use the provided bill data when available, or reference well-known bills from your knowledge). Include bill numbers when known.

2. **Key Talking Points** — 3-4 concise, factual points that support the user's position. Include specific data (statistics, dollar amounts, dates) when possible.

3. **Data & Context** — 1-2 relevant statistics or facts that add weight to the argument.

When citing legislation, use markdown link format: [Bill Number - Title](url). The bill URLs are provided in the context data. Always include clickable links for any bill you reference.

Keep the total response under 250 words. Use markdown: **bold** for section headers, - for bullet points, **bold** within bullets for emphasis on key facts. Be factual and specific — no vague platitudes.`;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = researchLimiter.check(ip);
  if (!success) {
    return new Response('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  let body: ResearchRequest & { turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { issue, issueCategory, ask, turnstileToken } = body;
  if (!issue || !issueCategory) {
    return NextResponse.json({ error: 'issue and issueCategory are required' }, { status: 400 });
  }

  if (turnstileToken !== undefined || process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(turnstileToken || '');
    if (!valid) {
      return new Response('CAPTCHA verification failed', { status: 403 });
    }
  }

  const billContext = await fetchRecentBills(issueCategory);

  const userPrompt = `Issue category: ${issueCategory}
Specific issue: ${issue}${ask ? `\nThe user's ask: ${ask}` : ''}${billContext}`;

  const stream = callClaudeStream(SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }], 600);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
