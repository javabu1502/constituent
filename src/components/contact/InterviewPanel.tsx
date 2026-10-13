'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MicButton } from '@/components/chat/MicButton';
import { useTurnstile } from '@/components/ui/Turnstile';
import { tryParseInterviewResult, type InterviewResult } from '@/components/chat/ChatProvider';
import type { ContactAction } from './ContactFlow';

/**
 * The website's default way to say what you want: a short guided interview
 * (like the storytelling and campaign guides) instead of topic chips and
 * text boxes. The guide draws out the issue, the ask, the person's own
 * reasons, and which level of government can act, then hands back a
 * structured result that fills the flow. (Jared, 2026-10-13: "All of these
 * shouldn't exist and should instead be an AI interview similar to what
 * happens with the stories.")
 *
 * The CAPTCHA widget is mounted here, in this same view, because every send
 * waits on it.
 */

type Msg = { role: 'user' | 'assistant'; content: string };

const GREETING =
  'Hi. I’m here to help you write to the people who represent you. There is no rush, and you can skip anything.\n\nTo start: what is on your mind, or what would you like to change?';

const LEVEL_LABEL: Record<InterviewResult['level'], string> = {
  federal: 'your members of Congress',
  state: 'your state legislators',
  local: 'your local officials',
  both: 'your members of Congress and your state legislators',
};

/** Hide the structured hand-off from the transcript; the summary card shows it. */
function displayText(content: string): string {
  return content.replace(/```json[\s\S]*?```/g, '').replace(/\s*[—–]\s*/g, ', ').replace(/\*\*/g, '').trim();
}

export function InterviewPanel({
  dispatch,
  onContinue,
}: {
  dispatch: React.Dispatch<ContactAction>;
  onContinue: () => void;
}) {
  const { getToken, TurnstileWidget } = useTurnstile();
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const applyResult = (r: InterviewResult) => {
    dispatch({ type: 'SET_ISSUE', payload: { issue: r.issue, category: r.issueCategory || '' } });
    dispatch({ type: 'SET_ASK', payload: r.ask });
    dispatch({ type: 'SET_PERSONAL_WHY', payload: r.personalWhy || '' });
    if (r.suggestedTone) dispatch({ type: 'SET_TONE', payload: r.suggestedTone });
    dispatch({ type: 'SET_INTERVIEW_LEVEL', payload: r.level });
    setResult(r);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setStreaming(true);
    try {
      const turnstileToken = await getToken().catch(() => '');
      const res = await fetch('/api/chat/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-30), turnstileToken: turnstileToken || undefined }),
      });
      if (!res.ok || !res.body) {
        throw new Error((await res.text().catch(() => '')) || 'We could not connect just now. Please try again.');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const shown = acc;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: shown };
          return copy;
        });
      }
      const parsed = tryParseInterviewResult(acc);
      if (parsed) applyResult(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages((prev) => (prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="space-y-4">
      <TurnstileWidget />
      <div ref={scrollRef} className="max-h-[24rem] overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => {
          const text = m.role === 'assistant' ? displayText(m.content) : m.content;
          if (!text && !streaming) return null;
          return (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                }`}
              >
                {text || (streaming ? '…' : '')}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl space-y-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Here is what your message will say</p>
          <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">The issue:</span> {result.issue}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">What you want:</span> {result.ask}</p>
          {result.personalWhy && (
            <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Why it matters to you:</span> {result.personalWhy}</p>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Who gets it:</span> {LEVEL_LABEL[result.level] ?? LEVEL_LABEL.both}</p>
          <div className="flex gap-2 pt-1">
            <Button onClick={onContinue} className="flex-1">Looks good. Next: your address</Button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Change something
            </button>
          </div>
        </div>
      )}

      {!result && (
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Share as much or as little as you like…"
            rows={2}
            disabled={streaming}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />
          <button type="button" onClick={() => setInput('I’d rather not say.')} disabled={streaming} className="self-end text-xs text-gray-500 dark:text-gray-400 underline whitespace-nowrap pb-3">Rather not say</button>
          <MicButton text={input} setText={setInput} disabled={streaming} className="self-end" />
          <Button onClick={() => void send()} isLoading={streaming} className="self-end">Send</Button>
        </div>
      )}
    </div>
  );
}
