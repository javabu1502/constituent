import { NextRequest, NextResponse } from 'next/server';
import { callClaude, extractJSON, stripTags } from '@/lib/claude';
import { createAdminClient } from '@/lib/supabase';
import type { BillSummary } from '@/lib/types';

interface BillSummaryRequest {
  bill_number: string;
  title: string;
  description?: string;
  sponsors: string[];
  status?: string;
  last_action?: string;
  policy_area?: string;
  committee?: string;
  level: 'federal' | 'state';
  userIssues?: string[];
}

const SUMMARY_SYSTEM_PROMPT = `You are a nonpartisan legislative analyst. Explain legislation in plain language for everyday citizens.

Respond with ONLY a JSON object — no other text, no markdown fences.

Guidelines:
- summary: 2-3 sentences explaining what the bill does in plain terms
- arguments_for: Who supports this and why (cite types of groups/perspectives, 2-3 sentences)
- arguments_against: Who opposes this and why (cite types of groups/perspectives, 2-3 sentences)
- Be factual, balanced, and specific about real stakeholder types`;

const RELEVANCE_SYSTEM_PROMPT = `You are a civic engagement assistant. In 1-2 sentences, connect this bill to the citizen's concerns. Respond with ONLY JSON: {"personal_relevance": "..."}`;

export async function POST(request: NextRequest) {
  let body: BillSummaryRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { bill_number, title, description, sponsors, status, last_action, policy_area, committee, level, userIssues } = body;

  if (!bill_number || !title) {
    return NextResponse.json({ error: 'bill_number and title are required' }, { status: 400 });
  }

  const cacheKey = `bill-summary-${level}-${bill_number}`;
  const admin = createAdminClient();

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', 'public')
    .eq('feed_type', cacheKey)
    .single();

  if (cached?.data) {
    const cachedSummary = cached.data as BillSummary;

    // If cached and user has issues, generate personal_relevance only
    if (userIssues && userIssues.length > 0 && !cachedSummary.personal_relevance) {
      try {
        const relevancePrompt = `BILL: ${bill_number} - ${title}\nSUMMARY: ${cachedSummary.summary}\nUSER CONCERNS: ${userIssues.join(', ')}`;
        const rawRelevance = await callClaude(RELEVANCE_SYSTEM_PROMPT, relevancePrompt, 200);
        const strippedRelevance = stripTags(rawRelevance);
        const parsed = extractJSON(strippedRelevance) as { personal_relevance?: string } | null;
        if (parsed?.personal_relevance) {
          cachedSummary.personal_relevance = parsed.personal_relevance;
        }
      } catch (err) {
        console.error('Error generating personal relevance:', err);
      }
      return NextResponse.json({ summary: cachedSummary, cached: true });
    }

    return NextResponse.json({ summary: cachedSummary, cached: true });
  }

  // Generate fresh summary
  try {
    const billDetails = [
      `BILL NUMBER: ${bill_number}`,
      `TITLE: ${title}`,
      description ? `DESCRIPTION: ${description}` : '',
      `LEVEL: ${level}`,
      sponsors.length > 0 ? `SPONSORS: ${sponsors.join(', ')}` : '',
      status ? `STATUS: ${status}` : '',
      last_action ? `LAST ACTION: ${last_action}` : '',
      policy_area ? `POLICY AREA: ${policy_area}` : '',
      committee ? `COMMITTEE: ${committee}` : '',
    ].filter(Boolean).join('\n');

    const userPrompt = `Analyze this bill and provide a plain-language summary with balanced arguments for and against.\n\n${billDetails}\n\nRespond with JSON: {"summary": "...", "arguments_for": "...", "arguments_against": "..."}`;

    const rawResponse = await callClaude(SUMMARY_SYSTEM_PROMPT, userPrompt, 800);
    const strippedResponse = stripTags(rawResponse);
    const parsed = extractJSON(strippedResponse) as {
      summary?: string;
      arguments_for?: string;
      arguments_against?: string;
    } | null;

    if (!parsed?.summary) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const billSummary: BillSummary = {
      summary: parsed.summary,
      arguments_for: parsed.arguments_for || 'Arguments for this bill are not yet available.',
      arguments_against: parsed.arguments_against || 'Arguments against this bill are not yet available.',
      bill_number,
      generated_at: new Date().toISOString(),
    };

    // Generate personal relevance if user has issues
    if (userIssues && userIssues.length > 0) {
      try {
        const relevancePrompt = `BILL: ${bill_number} - ${title}\nSUMMARY: ${billSummary.summary}\nUSER CONCERNS: ${userIssues.join(', ')}`;
        const rawRelevance = await callClaude(RELEVANCE_SYSTEM_PROMPT, relevancePrompt, 200);
        const strippedRelevance = stripTags(rawRelevance);
        const parsedRelevance = extractJSON(strippedRelevance) as { personal_relevance?: string } | null;
        if (parsedRelevance?.personal_relevance) {
          billSummary.personal_relevance = parsedRelevance.personal_relevance;
        }
      } catch (err) {
        console.error('Error generating personal relevance:', err);
      }
    }

    // Cache the summary (without personal_relevance, which is user-specific)
    const cacheData: BillSummary = { ...billSummary };
    delete cacheData.personal_relevance;
    await admin
      .from('feed_cache')
      .upsert(
        { user_id: 'public', feed_type: cacheKey, data: cacheData, fetched_at: new Date().toISOString() },
        { onConflict: 'user_id,feed_type' }
      );

    return NextResponse.json({ summary: billSummary, cached: false });
  } catch (error) {
    console.error('Error generating bill summary:', error);
    return NextResponse.json({ error: 'Failed to generate bill summary' }, { status: 500 });
  }
}
