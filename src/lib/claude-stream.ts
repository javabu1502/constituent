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
  return callClaudeStreamWithModel(systemPrompt, messages, maxTokens, CLAUDE_MODEL || 'claude-sonnet-4-20250514');
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
