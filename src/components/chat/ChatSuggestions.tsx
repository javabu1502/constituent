'use client';

import { useChatContext } from './ChatProvider';

const SUGGESTIONS = [
  'How do I contact my representative?',
  'How does a bill become a law?',
  'How do I register to vote?',
  'What can I do on My Democracy?',
  'How do I comment on a federal regulation?',
  'How do I start an advocacy campaign?',
];

export function ChatSuggestions() {
  const { sendMessage } = useChatContext();

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <div className="mb-1 text-3xl">🏛️</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Welcome!
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Ask me anything about My Democracy or U.S. civics.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="px-3 py-1.5 text-xs rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors text-left"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
