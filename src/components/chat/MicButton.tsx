'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Voice (talk-to-text) input using the browser's built-in Web Speech API.
 * Works on iOS Safari and Android Chrome — no backend, no dependencies, no cost.
 * Renders nothing on browsers that don't support it.
 *
 * It reads/writes the same input state: tapping the mic appends spoken words to
 * whatever is already in the field; tapping again (or finishing) stops.
 */

// Minimal typings — the Web Speech API isn't in the default TS DOM lib.
interface SpeechRecognitionAlt {
  transcript: string;
}
interface SpeechRecognitionResultAlt {
  isFinal: boolean;
  0: SpeechRecognitionAlt;
}
interface SpeechRecognitionEventAlt {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultAlt>;
}
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventAlt) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function MicButton({
  text,
  setText,
  disabled,
  className,
}: {
  text: string;
  setText: (t: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseRef = useRef('');
  const finalRef = useRef('');
  const producedRef = useRef(false); // have we put any spoken text in the field this session?

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  // If the field gets cleared (e.g. the message was submitted) while the mic is
  // still on, stop listening so it doesn't re-fill the box with the old text.
  useEffect(() => {
    if (listening && text === '' && producedRef.current) {
      producedRef.current = false;
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    }
  }, [text, listening]);

  // Abort any active recognition on unmount.
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    baseRef.current = text.trim();
    finalRef.current = '';
    producedRef.current = false;

    rec.onresult = (e: SpeechRecognitionEventAlt) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      const session = (finalRef.current + interim).replace(/\s+/g, ' ').trim();
      const base = baseRef.current;
      if (session) producedRef.current = true;
      setText(base && session ? `${base} ${session}` : base || session);
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    rec.onerror = () => {
      setListening(false);
    };

    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, [text, setText]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      disabled={disabled}
      aria-label={listening ? 'Stop voice input' : 'Speak your message'}
      aria-pressed={listening}
      title={listening ? 'Stop' : 'Speak'}
      className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        listening
          ? 'bg-red-600 text-white animate-pulse'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${className ?? ''}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}
