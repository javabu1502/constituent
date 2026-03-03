import { callClaudeStream } from '@/lib/claude-stream';
import { CHAT_SYSTEM_PROMPT } from '@/lib/chat-system-prompt';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('AI assistant is temporarily unavailable', { status: 503 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('Messages array is required', { status: 400 });
  }

  if (messages.length > 50) {
    return new Response('Too many messages', { status: 400 });
  }

  const last = messages[messages.length - 1];
  if (last.role !== 'user') {
    return new Response('Last message must be from user', { status: 400 });
  }

  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return new Response('Each message must have role and content', { status: 400 });
    }
    if (msg.content.length > 2000) {
      return new Response('Message too long (max 2000 characters)', { status: 400 });
    }
  }

  try {
    const stream = callClaudeStream(CHAT_SYSTEM_PROMPT, messages, 800);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return new Response('Something went wrong', { status: 500 });
  }
}
