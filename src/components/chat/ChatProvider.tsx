'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { useTurnstile } from '@/components/ui/Turnstile';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface InterviewResult {
  ready: boolean;
  issue: string;
  issueCategory: string;
  level: 'federal' | 'state' | 'local' | 'both';
  ask: string;
  personalWhy: string;
  suggestedTone: 'personal' | 'professional' | 'passionate';
}

type ChatMode = 'general' | 'interview';

interface ChatContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => void;
  clearChat: () => void;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  interviewResult: InterviewResult | null;
  clearInterviewResult: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

function tryParseInterviewResult(content: string): InterviewResult | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.ready && parsed.issue && parsed.ask) {
      return parsed as InterviewResult;
    }
  } catch {
    // not valid JSON yet
  }
  return null;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setModeState] = useState<ChatMode>('general');
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timestampsRef = useRef<number[]>([]);
  const { getToken, TurnstileWidget } = useTurnstile();

  const setMode = useCallback((newMode: ChatMode) => {
    // Clear messages when switching modes
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setInterviewResult(null);
    setModeState(newMode);
  }, []);

  const clearInterviewResult = useCallback(() => {
    setInterviewResult(null);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    // Client-side rate limiting
    const now = Date.now();
    timestampsRef.current = timestampsRef.current.filter(
      (t) => now - t < RATE_LIMIT_WINDOW
    );
    if (timestampsRef.current.length >= RATE_LIMIT_MAX) {
      setError('You\'re sending messages too fast. Please wait a few minutes.');
      return;
    }
    timestampsRef.current.push(now);

    setError(null);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    // Build message history for the API (without IDs)
    const apiMessages = [...messages, userMsg].map(({ role, content: c }) => ({
      role,
      content: c,
    }));

    const endpoint = mode === 'interview' ? '/api/chat/interview' : '/api/chat';

    try {
      const turnstileToken = await getToken();
      abortRef.current = new AbortController();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, turnstileToken: turnstileToken || undefined }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      }

      // In interview mode, check if the assistant produced a structured result
      if (mode === 'interview') {
        const result = tryParseInterviewResult(fullContent);
        if (result) {
          setInterviewResult(result);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong');
      // Remove the empty assistant message on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading, messages, getToken, mode]);

  const clearChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setInterviewResult(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat,
        mode,
        setMode,
        interviewResult,
        clearInterviewResult,
      }}
    >
      {children}
      <TurnstileWidget />
    </ChatContext.Provider>
  );
}
