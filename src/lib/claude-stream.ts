/**
 * Streaming Claude API helper
 *
 * Uses the same raw-fetch pattern as claude.ts but with streaming enabled.
 * Returns a ReadableStream of plain text chunks.
 */

import { env } from './env';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Fast variant using Haiku — for chat/interview where speed matters more than depth.
 * ~5x faster and ~10x cheaper than Sonnet.
 */
export function callClaudeStreamFast(
  systemPrompt: string,
  messages: Message[],
  maxTokens = 800
): ReadableStream<Uint8Array> {
  return callClaudeStreamWithModel(systemPrompt, messages, maxTokens, 'claude-haiku-4-5-20251001');
}

export function callClaudeStream(
  systemPrompt: string,
  messages: Message[],
  maxTokens = 800
): ReadableStream<Uint8Array> {
  const { CLAUDE_MODEL } = env();
  return callClaudeStreamWithModel(systemPrompt, messages, maxTokens, CLAUDE_MODEL || 'claude-sonnet-4-6');
}

/**
 * Streaming variant with Anthropic's server-side web search tool enabled.
 * Claude decides when to search (current/time-sensitive questions only); each
 * search is billed at $10/1k. `max_uses` hard-caps searches per turn. Streams
 * the answer text, then appends a "Sources" footer of the cited URLs (citations
 * must be shown to end users). Defaults to Haiku for speed.
 */
export function callClaudeStreamWithSearch(
  systemPrompt: string,
  messages: Message[],
  maxTokens = 1024,
  model = 'claude-haiku-4-5-20251001',
): ReadableStream<Uint8Array> {
  const { ANTHROPIC_API_KEY } = env();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const cited = new Map<string, string>();   // url -> title (sources Claude cited)
      const found = new Map<string, string>();    // url -> title (all search results, fallback)
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages,
            stream: true,
            tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('Anthropic search-stream API error:', response.status, errText);
          controller.error(new Error(`Claude API error ${response.status}`));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              if (event.type === 'content_block_delta') {
                if (event.delta?.type === 'text_delta' && event.delta.text) {
                  controller.enqueue(encoder.encode(event.delta.text));
                } else if (event.delta?.type === 'citations_delta' && event.delta.citation?.url) {
                  const c = event.delta.citation;
                  cited.set(c.url, c.title || c.url);
                }
              } else if (
                event.type === 'content_block_start' &&
                event.content_block?.type === 'web_search_tool_result' &&
                Array.isArray(event.content_block.content)
              ) {
                for (const r of event.content_block.content) {
                  if (r?.type === 'web_search_result' && r.url && !found.has(r.url)) {
                    found.set(r.url, r.title || r.url);
                  }
                }
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // Append a Sources footer — prefer the sources Claude actually cited,
        // else the top search results. Required when showing search output to users.
        const sources = cited.size > 0 ? cited : found;
        if (sources.size > 0) {
          let footer = '\n\nSources:';
          let n = 0;
          for (const [url, title] of sources) {
            footer += `\n• ${title} — ${url}`;
            if (++n >= 5) break;
          }
          controller.enqueue(encoder.encode(footer));
        }

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

function callClaudeStreamWithModel(
  systemPrompt: string,
  messages: Message[],
  maxTokens: number,
  model: string,
): ReadableStream<Uint8Array> {
  const { ANTHROPIC_API_KEY } = env();

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('Anthropic streaming API error:', response.status, errText);
          controller.error(new Error(`Claude API error ${response.status}`));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last partial line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta' &&
                event.delta.text
              ) {
                controller.enqueue(encoder.encode(event.delta.text));
              } else if (event.type === 'message_stop') {
                break;
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
