'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

/**
 * Parse markdown-style links [text](/path) into Next.js Link components.
 * Also handles **bold** text.
 */
function renderContent(content: string) {
  // Split on [text](/path) links and **bold**
  const parts = content.split(/(\[.+?\]\(\/.+?\)|\*\*.+?\*\*)/g);

  return parts.map((part, i) => {
    // Match [text](/path)
    const linkMatch = part.match(/^\[(.+?)\]\((\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <Link
          key={i}
          href={linkMatch[2]}
          className="underline font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
        >
          {linkMatch[1]}
        </Link>
      );
    }

    // Match **bold**
    const boldMatch = part.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch) {
      return <strong key={i}>{boldMatch[1]}</strong>;
    }

    return <span key={i}>{part}</span>;
  });
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  // Hide JSON code blocks from interview results — the UI handles the handoff
  const displayContent = content.replace(/```json\s*[\s\S]*?```/g, '').trim();

  // If the entire message was just JSON, don't render an empty bubble
  if (!isUser && !displayContent && !isStreaming) return null;

  return (
    <div className={cn('flex mb-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-purple-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
        )}
      >
        {renderContent(displayContent)}
        {isStreaming && !content && (
          <span className="inline-block w-2 h-4 bg-gray-400 dark:bg-gray-500 animate-pulse rounded-sm" />
        )}
        {isStreaming && content && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-400 dark:bg-gray-500 animate-pulse rounded-sm align-text-bottom" />
        )}
      </div>
    </div>
  );
}
