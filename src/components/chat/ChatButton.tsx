'use client';

import { useChatContext } from './ChatProvider';

export function ChatButton() {
  const { isOpen, setIsOpen } = useChatContext();

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed bottom-6 right-4 sm:right-6 z-40 w-14 h-14 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 hover:shadow-xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
    >
      {isOpen ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
}
