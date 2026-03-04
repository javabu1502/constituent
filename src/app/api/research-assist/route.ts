import { NextRequest, NextResponse } from 'next/server';
import { congressFetch } from '@/lib/congress-api';
import { callClaudeStream } from '@/lib/claude-stream';

interface ResearchRequest {
  issue: string;
  issueCategory: string;
  ask?: string;
}

interface Bill {
  title?: string;
  type?: string;
  number?: string;
  latestAction?: { text?: string; actionDate?: string };
}

const SYSTEM_PROMPT = `You are a nonpartisan legislative research assistant. The user is writing to their representative about a specific issue. Help them strengthen their message with factual research.

Given the user's issue and desired action, provide:

1. **Pending Legislation** — 2-3 relevant bills currently in Congress (use the provided bill data when available, or reference well-known bills from your knowledge). Include bill numbers when known.

2. **Key Talking Points** — 3-4 concise, factual points that support the user's position. Include specific data (statistics, dollar amounts, dates) when possible.

3. **Data & Context** — 1-2 relevant statistics or facts that add weight to the argument.

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
      const num = b.type && b.number ? `${b.type} ${b.number}` : '';
      const action = b.latestAction?.text ?? '';
      return `- ${num ? num + ': ' : ''}${b.title ?? 'Untitled'}${action ? ' (Latest: ' + action + ')' : ''}`;
    });

    return `\n\nRecent bills in Congress related to "${policyArea}":\n${lines.join('\n')}`;
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
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
