'use client';

import { useChatContext } from './ChatProvider';

const GENERAL_SUGGESTIONS = [
  'How do I contact my officials?',
  'How does a bill become a law?',
  'How do I register to vote?',
  'What can I do on My Democracy?',
  'How do I comment on a federal regulation?',
  'How do I start an advocacy campaign?',
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
        <div className="mb-3 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Let&apos;s craft your message
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          I&apos;ll help you figure out what to say and who to say it to.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Share only what feels comfortable. You&apos;ll review everything before it&apos;s sent.
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
          Switch to general assistant
        </button>
      </div>
    );
  }

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
        {GENERAL_SUGGESTIONS.map((q) => (
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
        onClick={() => setMode('interview')}
        className="mt-4 px-4 py-2 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors"
      >
        Help me write a message to my officials
      </button>
    </div>
  );
}
