/**
 * Shared Claude API utilities
 *
 * Provides callClaude(), extractJSON(), stripTags(), and cleanText()
 * for use across API routes that interact with the Anthropic API.
 */

export function stripTags(text: string): string {
  let cleaned = text.replace(/<[^>]+\/>/g, '');
  cleaned = cleaned.replace(/<search>[\s\S]*?<\/search>/gi, '');
  cleaned = cleaned.replace(/<result>[\s\S]*?<\/result>/gi, '');
  cleaned = cleaned.replace(/<source>[\s\S]*?<\/source>/gi, '');
  cleaned = cleaned.replace(/<sources>[\s\S]*?<\/sources>/gi, '');
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<\/?[a-zA-Z_][a-zA-Z0-9_]*[^>]*>/g, '');
  return cleaned.trim();
}

export function extractJSON(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch { /* continue */ }

  // Try to find a JSON object or array
  const braceStart = cleaned.indexOf('{');
  const bracketStart = cleaned.indexOf('[');
  const start = (bracketStart >= 0 && (braceStart < 0 || bracketStart < braceStart))
    ? bracketStart : braceStart;

  if (start >= 0) {
    const sub = cleaned.slice(start);
    try {
      return JSON.parse(sub);
    } catch { /* continue */ }

    // Try to find the matching closing bracket/brace
    const opener = sub[0];
    const closer = opener === '[' ? ']' : '}';
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = 0; i < sub.length; i++) {
      const ch = sub[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === opener) depth++;
      if (ch === closer) { depth--; if (depth === 0) {
        try { return JSON.parse(sub.slice(0, i + 1)); } catch { break; }
      }}
    }
  }

  return null;
}

export function cleanText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Call the Anthropic Claude API with a system prompt and user prompt.
 * Returns the raw text response.
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1200
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Anthropic API error:', response.status, errText);
    throw new Error(`Claude API error ${response.status}`);
  }

  const data = await response.json();
  const textParts: string[] = [];
  for (const block of (data.content || [])) {
    if (block.type === 'text' && block.text) {
      textParts.push(block.text);
    }
  }

  return textParts.join('\n');
}
