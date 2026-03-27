import { callClaudeStream, callClaudeStreamFast } from '@/lib/claude-stream';
import { INTERVIEW_SYSTEM_PROMPT } from '@/lib/interview-system-prompt';
import { chatRequestSchema, parseBody } from '@/lib/schemas';
import { chatLimiter, dailyChatCap, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { buildResearchContext } from '@/lib/research';

/**
 * Scan conversation to extract the issue category once it emerges.
 * Looks for common civic issue keywords in user + assistant messages.
 */
const ISSUE_CATEGORIES: Record<string, string[]> = {
  'Healthcare': ['healthcare', 'health care', 'insurance', 'medical', 'hospital', 'medicare', 'medicaid', 'prescription', 'drug prices', 'mental health'],
  'Education': ['education', 'school', 'student', 'teacher', 'college', 'university', 'tuition', 'student loan'],
  'Environment': ['environment', 'climate', 'pollution', 'clean energy', 'renewable', 'emissions', 'water quality', 'conservation'],
  'Housing': ['housing', 'rent', 'affordable housing', 'homeless', 'mortgage', 'eviction', 'zoning'],
  'Immigration': ['immigration', 'immigrant', 'border', 'visa', 'asylum', 'daca', 'citizenship', 'deportation'],
  'Economy': ['economy', 'jobs', 'wages', 'minimum wage', 'inflation', 'taxes', 'tax', 'unemployment', 'cost of living'],
  'Criminal Justice': ['criminal justice', 'police', 'prison', 'incarceration', 'sentencing', 'bail', 'reform'],
  'Gun Policy': ['gun', 'firearm', 'second amendment', 'background check', 'gun violence', 'gun control'],
  'Veterans': ['veteran', 'military', 'va ', 'service member'],
  'Civil Rights': ['civil rights', 'discrimination', 'voting rights', 'equality', 'lgbtq', 'disability'],
  'Transportation': ['transportation', 'infrastructure', 'roads', 'transit', 'highway', 'bridge'],
  'Social Security': ['social security', 'retirement', 'pension', 'seniors'],
  'Agriculture': ['agriculture', 'farming', 'farm bill', 'food stamp', 'snap', 'rural'],
  'Technology': ['technology', 'privacy', 'data', 'ai ', 'artificial intelligence', 'social media', 'internet'],
};

function detectIssueCategory(messages: { role: string; content: string }[]): string | null {
  // Only look at enough messages to detect — usually by message 3-4 the issue is clear
  const text = messages
    .slice(0, 6)
    .map(m => m.content.toLowerCase())
    .join(' ');

  let bestMatch: string | null = null;
  let bestCount = 0;

  for (const [category, keywords] of Object.entries(ISSUE_CATEGORIES)) {
    const count = keywords.filter(kw => text.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestMatch = category;
    }
  }

  return bestCount > 0 ? bestMatch : null;
}

function detectSpecificIssue(messages: { role: string; content: string }[]): string {
  // Use the first substantive user message as the issue description
  for (const msg of messages) {
    if (msg.role === 'user' && msg.content.length > 10) {
      return msg.content.slice(0, 200);
    }
  }
  return '';
}

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

  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(turnstileToken || '');
    if (!valid) {
      return new Response('CAPTCHA verification failed', { status: 403 });
    }
  }

  const { success: dailyOk } = dailyChatCap.check(ip);
  if (!dailyOk) {
    return new Response('Daily chat limit reached. Try again tomorrow.', { status: 429 });
  }

  const last = messages[messages.length - 1];
  if (last.role !== 'user') {
    return new Response('Last message must be from user', { status: 400 });
  }

  // After a few exchanges, try to enrich with real legislative data
  let researchContext = '';
  if (messages.length >= 3) {
    const category = detectIssueCategory(messages);
    if (category) {
      const issue = detectSpecificIssue(messages);
      researchContext = await buildResearchContext(category, issue);
    }
  }

  const systemPrompt = INTERVIEW_SYSTEM_PROMPT + researchContext;

  try {
    const stream = callClaudeStreamFast(systemPrompt, messages, 800);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Interview chat API error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}
