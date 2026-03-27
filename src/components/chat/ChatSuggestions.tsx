'use client';

import { useChatContext } from './ChatProvider';

const GENERAL_SUGGESTIONS = [
  'What can I do on My Democracy?',
  'How do I contact my officials?',
  'How do I register to vote?',
];

const INTERVIEW_SUGGESTIONS = [
  'Something in my community needs to change',
  'I\'m not sure where to start',
  'I have a story I want to share',
];

export function ChatSuggestions() {
  const { sendMessage, mode, setMode } = useChatContext();

  if (mode === 'interview') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Let&apos;s craft your message
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Share only what feels comfortable. You review everything before it&apos;s sent.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {INTERVIEW_SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 text-xs rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
        <button
          onClick={() => setMode('general')}
          className="mt-4 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Back to general assistant
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        My Democracy Assistant
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        How can I help?
      </p>
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {GENERAL_SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
          >
            {q}
          </button>
        ))}
      </div>
      <div className="w-full border-t border-gray-100 dark:border-gray-700 pt-3">
        <button
          onClick={() => setMode('interview')}
          className="w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Help me write a message to my officials
        </button>
      </div>
    </div>
  );
}
