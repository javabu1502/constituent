import { NextRequest, NextResponse } from 'next/server';
import { congressFetch } from '@/lib/congress-api';
import { callClaudeStream } from '@/lib/claude-stream';
import { researchLimiter, getClientIp } from '@/lib/rate-limit';

interface ResearchRequest {
  issue: string;
  issueCategory: string;
  ask?: string;
}

interface Bill {
  title?: string;
  type?: string;
  number?: string;
  congress?: number;
  latestAction?: { text?: string; actionDate?: string };
}

const TYPE_TO_SLUG: Record<string, string> = {
  hr: 'house-bill',
  s: 'senate-bill',
  hjres: 'house-joint-resolution',
  sjres: 'senate-joint-resolution',
  hconres: 'house-concurrent-resolution',
  sconres: 'senate-concurrent-resolution',
  hres: 'house-resolution',
  sres: 'senate-resolution',
};

const SYSTEM_PROMPT = `You are a nonpartisan legislative research assistant. The user is writing to their representative about a specific issue. Help them strengthen their message with factual research.

Given the user's issue and desired action, provide:

1. **Pending Legislation** — 2-3 relevant bills currently in Congress (use the provided bill data when available, or reference well-known bills from your knowledge). Include bill numbers when known.

2. **Key Talking Points** — 3-4 concise, factual points that support the user's position. Include specific data (statistics, dollar amounts, dates) when possible.

3. **Data & Context** — 1-2 relevant statistics or facts that add weight to the argument.

When citing legislation, use markdown link format: [Bill Number - Title](url). The bill URLs are provided in the context data. Always include clickable links for any bill you reference.

Keep the total response under 250 words. Use markdown: **bold** for section headers, - for bullet points, **bold** within bullets for emphasis on key facts. Be factual and specific — no vague platitudes.`;

async function fetchRecentBills(policyArea: string): Promise<string> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return '';

  try {
    const url = `https://api.congress.gov/v3/bill?policyArea=${encodeURIComponent(policyArea)}&sort=updateDate+desc&limit=5&api_key=${apiKey}`;
    const res = await congressFetch(url);
    if (!res.ok) return '';

    const data = await res.json();
    const bills: Bill[] = data.bills ?? [];
    if (bills.length === 0) return '';

    const lines = bills.map((b) => {
      const num = b.type && b.number ? `${b.type.toUpperCase()} ${b.number}` : '';
      const action = b.latestAction?.text ?? '';
      const slug = b.type ? TYPE_TO_SLUG[b.type.toLowerCase()] : null;
      const congress = b.congress ?? 119;
      const url = slug && b.number
        ? `https://www.congress.gov/bill/${congress}th-congress/${slug}/${b.number}`
        : '';
      const urlPart = url ? ` [View on Congress.gov](${url})` : '';
      return `- ${num ? num + ': ' : ''}${b.title ?? 'Untitled'}${action ? ' (Latest: ' + action + ')' : ''}${urlPart}`;
    });

    return `\n\nRecent bills in Congress related to "${policyArea}":\n${lines.join('\n')}`;
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = researchLimiter.check(ip);
  if (!success) {
    return new Response('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  let body: ResearchRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { issue, issueCategory, ask } = body;
  if (!issue || !issueCategory) {
    return NextResponse.json({ error: 'issue and issueCategory are required' }, { status: 400 });
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
