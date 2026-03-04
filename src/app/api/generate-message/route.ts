import { NextRequest, NextResponse } from 'next/server';
import { stripTags, extractJSON, cleanText } from '@/lib/claude';
import { getCommitteesForMember } from '@/lib/legislators';
import { z } from 'zod';
import { generateMessageSchema, parseBody } from '@/lib/schemas';
import { generateLimiter, getClientIp } from '@/lib/rate-limit';

type GenerateRequest = z.infer<typeof generateMessageSchema>;
type OfficialInput = GenerateRequest['officials'][number];
type AddressInput = NonNullable<GenerateRequest['address']>;

interface OfficialMessage {
  officialName: string;
  subject: string;
  body: string;
}

async function generateForOfficial(
  apiKey: string,
  official: OfficialInput,
  issue: string,
  ask: string,
  personalWhy: string | undefined,
  senderName: string,
  address: AddressInput | undefined,
  contactMethod: 'email' | 'phone' = 'email',
): Promise<OfficialMessage> {
  const isState = official.level === 'state';
  const titleLower = official.title.toLowerCase();

  // Determine official title based on level and title
  let officialTitle: string;
  if (isState) {
    if (titleLower.includes('senator')) {
      officialTitle = 'Senator';
    } else {
      officialTitle = 'Representative';
    }
  } else {
    officialTitle = titleLower.includes('senator') ? 'Senator' : 'Representative';
  }

  const officialLastName = official.lastName || official.name.split(' ').pop();

  const constituentContext = isState && official.district
    ? `${official.state} ${titleLower.includes('senator') ? 'Senate' : 'Assembly'} District ${official.district}`
    : official.state;

  const stafferNote = official.stafferFirstName
    ? `\n\nIMPORTANT: This email is addressed to ${official.stafferFirstName}, a Legislative Correspondent (staffer), NOT the official directly.
- The constituent's representative is ${officialTitle} ${officialLastName}, not the staffer
- NEVER say "As your constituent" to the staffer — the staffer is not their representative
- Opening should be like: "As a constituent of ${officialTitle} ${officialLastName}, I am writing to..." or "I'm writing as a constituent of ${officialTitle} ${officialLastName}..."
- Reference the official in third person: "I urge ${officialTitle} ${officialLastName} to..." not "I urge you to..."`
    : '';

  const stateNote = isState
    ? `\n\nIMPORTANT: This is a STATE legislator, not a federal official. Tailor the message appropriately:
- Reference state-level policy and legislation, not federal
- The constituent is in ${constituentContext}
- State legislators handle state laws, budgets, and regulations`
    : '';

  const emailSystemPrompt = `You are an expert constituent letter writer. Write a compelling, personalized letter from a constituent to ONE specific elected official.

Use your knowledge of this official's party affiliation, state, and likely positions to tailor the letter specifically to them.

Writing guidelines:
- If the official likely SUPPORTS the constituent's position: thank them specifically and urge continued leadership
- If the official likely OPPOSES it: respectfully urge them to reconsider, noting any relevant party or state context
- Include 1-2 relevant facts or recent events about the issue
- Weave in the constituent's personal story naturally if provided
- Identify the sender as a constituent in the opening (when writing to a staffer, say "constituent of [Official]", NOT "your constituent")
- Include a specific, actionable ask
- Maintain a respectful, firm tone
- Keep the letter under 250 words
- Do NOT include a greeting line (no "Dear Senator") or signature block (no "Sincerely") — the app handles those
- Write in first person
- Be direct and specific to THIS official, not generic${stafferNote}${stateNote}

SUBJECT LINE RULES:
- Maximum 6-8 words
- Sound like a real person wrote it — casual but clear
- NEVER use words like "constituent", "resident", "citizen", "voter", or "urges"
- NEVER use formats like "Constituent Urges Action" or "Nevada Resident Requests..."
- Good examples: "Please Support ICE Reform", "Concerned About ICE Enforcement", "We Need Better Road Infrastructure", "Please Protect Our Local Schools"
- Bad examples: "Constituent Urges Action on ICE", "Nevada Resident Requests Reform", "Urgent Constituent Request"

CRITICAL: Respond with ONLY a JSON object. No other text.`;

  const phoneSystemPrompt = `You are an expert at writing phone call scripts for constituents calling their elected officials.

Write a short, natural-sounding phone script that the caller can read or adapt when speaking to a staffer.

Use your knowledge of this official's party affiliation, state, and likely positions to tailor the script specifically to them.

Writing guidelines:
- Keep it under 150 words
- Conversational, first-person tone — NOT bullet points
- Structure: issue statement → personal connection → specific ask
- Do NOT include the opening line (e.g. "Hi, my name is...") or closing ("Thank you for your time.") — the app handles those
- IMPORTANT: The app already introduces the caller with their name and location. Do NOT mention the caller's city, state, or location anywhere in the script. Never say "as a [city] resident", "here in [state]", "in my community", or any other location reference. The caller's location is already established.
- Write as a flowing, natural script the caller reads aloud
- Be direct and specific to THIS official, not generic
- If the official likely SUPPORTS the position: acknowledge that and urge continued action
- If the official likely OPPOSES it: respectfully urge reconsideration${stateNote ? stateNote.replace('email', 'call') : ''}

CRITICAL: Respond with ONLY a JSON object. No other text.`;

  const systemPrompt = contactMethod === 'phone' ? phoneSystemPrompt : emailSystemPrompt;

  const locationStr = address ? `${address.city}, ${address.state}` : '';

  // Enrich with committee data for federal officials
  let committeeContext = '';
  if (!isState && official.bioguideId) {
    const committees = getCommitteesForMember(official.bioguideId);
    if (committees.length > 0) {
      committeeContext = `\nCOMMITTEE ASSIGNMENTS: ${committees.join(', ')}`;
    }
  }

  // Guidance on data-enriched writing
  const dataGuidance = committeeContext
    ? `\n\nDATA-DRIVEN WRITING TIPS:
- If the official sits on a committee relevant to the issue, reference it (e.g., "As a member of the [Committee], you have unique influence...")
- This makes the letter feel researched and serious, not generic`
    : '';

  const emailUserPrompt = `Write a letter to this specific official:

OFFICIAL: ${official.name} (${official.title}, ${official.party}, ${official.state})${committeeContext}

ISSUE: ${issue}
WHAT I WANT: ${ask}${personalWhy ? `\nMY PERSONAL STORY: ${personalWhy}` : ''}
SENDER: ${senderName}${locationStr ? ` from ${locationStr}` : ''}${dataGuidance}

Respond with ONLY this JSON:
{"subject": "max 8 words about the ask", "body": "the letter body"}`;

  const phoneUserPrompt = `Write a phone call script for calling this specific official's office:

OFFICIAL: ${official.name} (${official.title}, ${official.party}, ${official.state})${committeeContext}

ISSUE: ${issue}
WHAT I WANT: ${ask}${personalWhy ? `\nMY PERSONAL STORY: ${personalWhy}` : ''}
SENDER: ${senderName}${locationStr ? ` from ${locationStr}` : ''}${dataGuidance}

Respond with ONLY this JSON:
{"script": "the phone script body"}`;

  const userPrompt = contactMethod === 'phone' ? phoneUserPrompt : emailUserPrompt;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Anthropic API error for ${official.name}:`, response.status, errText);
    throw new Error(`API error ${response.status}`);
  }

  const data = await response.json();
  const textParts: string[] = [];
  for (const block of (data.content || [])) {
    if (block.type === 'text' && block.text) {
      textParts.push(block.text);
    }
  }

  const rawText = textParts.join('\n');
  const strippedText = stripTags(rawText);
  const parsed = extractJSON(strippedText) as { subject?: string; body?: string; script?: string } | null;

  if (contactMethod === 'phone') {
    let script: string;

    if (parsed && typeof parsed === 'object' && 'script' in parsed && parsed.script) {
      script = parsed.script;
    } else if (parsed && typeof parsed === 'object' && 'body' in parsed && parsed.body) {
      script = parsed.body;
    } else {
      script = strippedText;
    }

    const cleanedScript = cleanText(script);

    // Build phone opening and closing
    const opening = `Hi, my name is ${senderName} and I'm a constituent${locationStr ? ` from ${locationStr}` : ''}.`;
    const closing = `Thank you for your time.`;
    const fullScript = `${opening}\n\n${cleanedScript}\n\n${closing}`;

    return {
      officialName: official.name,
      subject: '',
      body: fullScript,
    };
  }

  // Email flow (default)
  let subj: string;
  let body: string;

  if (parsed && typeof parsed === 'object' && 'body' in parsed && parsed.body) {
    subj = parsed.subject || 'Reaching Out About an Important Issue';
    body = parsed.body;
  } else {
    subj = 'Reaching Out About an Important Issue';
    body = strippedText;
  }

  const cleanedBody = cleanText(body);
  const cleanedSubject = cleanText(subj).replace(/\n/g, ' ');

  // Build proper salutation
  let salutation: string;
  if (official.stafferFirstName) {
    // Address the staffer by first name
    salutation = `Dear ${official.stafferFirstName},`;
  } else {
    // Address the official — use lastName field if available (handles multi-word names like "Cortez Masto")
    const lastName = official.lastName || official.name.split(' ').pop() || official.name;
    if (titleLower.includes('senator')) {
      salutation = `Dear Senator ${lastName},`;
    } else if (titleLower.includes('representative') || titleLower.includes('rep.') || titleLower.includes('assemblymember') || titleLower.includes('assembly')) {
      salutation = `Dear ${officialTitle} ${lastName},`;
    } else {
      salutation = `Dear ${official.name},`;
    }
  }

  // Build closing with full address
  let emailClosing = `Sincerely,\n${senderName}`;
  if (address) {
    emailClosing += `\n${address.street}\n${address.city}, ${address.state} ${address.zip}`;
  }

  const fullBody = `${salutation}\n\n${cleanedBody}\n\n${emailClosing}`;

  return {
    officialName: official.name,
    subject: cleanedSubject,
    body: fullBody,
  };
}

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
    return NextResponse.json(
      { error: 'AI message generation is not configured' },
      { status: 503 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = parseBody(generateMessageSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { officials, issue, ask, personalWhy, senderName, address, contactMethod } = parsed.data;
  const method = contactMethod === 'phone' ? 'phone' : 'email';

  try {
    // Generate separate messages for each official in parallel
    const results = await Promise.all(
      officials.map(async (official) => {
        try {
          return await generateForOfficial(apiKey, official, issue, ask, personalWhy, senderName, address, method);
        } catch (err) {
          console.warn(`[generate-message] AI failed for ${official.name}, using template:`, err);
          return buildTemplateFallback(official, issue, ask, personalWhy, senderName, address, method);
        }
      })
    );

    return NextResponse.json({ messages: results });
  } catch (error) {
    console.error('Error generating messages:', error);
    // Final fallback: template messages for all officials
    const fallbacks = officials.map(official =>
      buildTemplateFallback(official, issue, ask, personalWhy, senderName, address, contactMethod === 'phone' ? 'phone' : 'email')
    );
    return NextResponse.json({ messages: fallbacks });
  }
}

function buildTemplateFallback(
  official: OfficialInput,
  issue: string,
  ask: string,
  personalWhy: string | undefined,
  senderName: string,
  address: AddressInput | undefined,
  contactMethod: 'email' | 'phone'
): OfficialMessage {
  const lastName = official.lastName || official.name.split(' ').pop() || official.name;
  const titleLower = official.title.toLowerCase();
  const isSenator = titleLower.includes('senator');
  const salutationTitle = isSenator ? 'Senator' : titleLower.includes('representative') ? 'Representative' : '';
  const locationStr = address ? `${address.city}, ${address.state}` : '';

  if (contactMethod === 'phone') {
    const parts = [
      `Hi, my name is ${senderName} and I'm a constituent${locationStr ? ` from ${locationStr}` : ''}.`,
      `I'm calling about ${issue}.`,
      ask,
      personalWhy ? personalWhy : '',
      `I hope ${salutationTitle ? `${salutationTitle} ${lastName}` : official.name} will take this issue seriously. Thank you for your time.`,
    ].filter(Boolean);
    return { officialName: official.name, subject: '', body: parts.join('\n\n') };
  }

  const salutation = salutationTitle ? `Dear ${salutationTitle} ${lastName},` : `Dear ${official.name},`;
  const bodyParts = [
    `I am writing to you as a constituent${locationStr ? ` from ${locationStr}` : ''} about ${issue}.`,
    ask,
    personalWhy ? personalWhy : '',
    `I respectfully ask that you consider the views of your constituents on this important matter. Thank you for your service and for taking the time to listen.`,
  ].filter(Boolean);

  let closing = `Sincerely,\n${senderName}`;
  if (address) {
    closing += `\n${address.street}\n${address.city}, ${address.state} ${address.zip}`;
  }

  return {
    officialName: official.name,
    subject: `Constituent Message: ${issue.slice(0, 60)}`,
    body: `${salutation}\n\n${bodyParts.join('\n\n')}\n\n${closing}`,
  };
}
