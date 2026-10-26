'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

const STORAGE_KEY = 'mydemocracy:contact:draft';
const DEBOUNCE_MS = 500;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SavedDraft {
  step: string;
  address: { street: string; city: string; state: string; zip: string } | null;
  selectedRepIds: string[];
  contactMethod: 'email' | 'phone';
  tone: 'professional' | 'personal' | 'passionate';
  userName: string;
  userPrefix?: string;
  userEmail: string;
  issue: string;
  issueCategory: string;
  ask: string;
  personalWhy: string;
  messages: Record<string, { subject: string; body: string }>;
  sentStatus?: Record<string, string>;
  /** False when the representatives lookup could not place the street. */
  districtResolved?: boolean;
  timestamp: number;
}

interface AutoSaveState {
  step: string;
  address: { street: string; city: string; state: string; zip: string } | null;
  selectedReps: { id: string }[];
  contactMethod: 'email' | 'phone';
  tone: 'professional' | 'personal' | 'passionate';
  userName: string;
  userPrefix?: string;
  userEmail: string;
  issue: string;
  issueCategory: string;
  ask: string;
  personalWhy: string;
  messages: Record<string, { subject: string; body: string }>;
  sentStatus?: Record<string, string>;
  districtResolved?: boolean;
}

export function useAutoSave(
  state: AutoSaveState,
  wasReset: boolean
): {
  savedDraft: SavedDraft | null;
  dismissDraft: () => void;
  clearDraft: () => void;
  justSaved: boolean;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const hasChecked = useRef(false);

  // On mount: check for existing draft
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const draft: SavedDraft = JSON.parse(raw);

      // Check age
      if (Date.now() - draft.timestamp > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Only offer restore if the draft had meaningful progress
      if (draft.step === 'address' && !draft.address) return;

      setSavedDraft(draft);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Debounced save on state change
  useEffect(() => {
    // A finished flow leaves no draft behind: a draft that survives the
    // success step comes back as "Resume your draft?" with every send button
    // live again (two emails to one senator, four hours apart, 2026-10-20).
    if (state.step === 'success') {
      if (timerRef.current) clearTimeout(timerRef.current);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setSavedDraft(null);
      return;
    }
    if (state.step === 'address' && !state.address) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const draft: SavedDraft = {
        step: state.step,
        address: state.address,
        selectedRepIds: state.selectedReps.map((r) => r.id),
        contactMethod: state.contactMethod,
        tone: state.tone,
        userName: state.userName,
        userPrefix: state.userPrefix,
        userEmail: state.userEmail,
        issue: state.issue,
        issueCategory: state.issueCategory,
        ask: state.ask,
        personalWhy: state.personalWhy,
        messages: state.messages,
        sentStatus: state.sentStatus ?? {},
        districtResolved: state.districtResolved ?? true,
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        setJustSaved(true);
        if (fadeRef.current) clearTimeout(fadeRef.current);
        fadeRef.current = setTimeout(() => setJustSaved(false), 2000);
      } catch {
        // localStorage full or unavailable
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    state.step, state.address, state.selectedReps, state.contactMethod, state.tone,
    state.userName, state.userPrefix, state.userEmail, state.issue, state.issueCategory,
    state.ask, state.personalWhy, state.messages, state.sentStatus, state.districtResolved,
  ]);

  // Clear on reset
  useEffect(() => {
    if (wasReset) {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setSavedDraft(null);
    }
  }, [wasReset]);

  const dismissDraft = useCallback(() => {
    setSavedDraft(null);
  }, []);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setSavedDraft(null);
  }, []);

  return { savedDraft, dismissDraft, clearDraft, justSaved };
}

// --- Campaign participation session (sessionStorage) ---
//
// The campaign flow keeps everything in React state, so a refresh after
// "Sent to Congress" restarted at the stance step and the re-drafted letter
// was a second CWC delivery and a second participant row. This small record
// is what a refresh must not lose. Keyed by campaign slug, 24h stamp,
// cleared when the person presses Done.

const PARTICIPATE_KEY_PREFIX = 'mydemocracy:participate:';

export interface ParticipateSession {
  step: string;
  stance: 'support' | 'oppose' | 'undecided' | null;
  /** Official id -> status recorded this session (cwc_submitted, cwc_held, email_opened...). */
  sentStatus: Record<string, string>;
  actionId: string | null;
  sentCount: number;
  savedAt: number;
}

function participateKey(slug: string): string {
  return `${PARTICIPATE_KEY_PREFIX}${slug}`;
}

function sessionStore(storage?: Storage | null): Storage | null {
  if (storage) return storage;
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function readParticipateSession(slug: string, storage?: Storage | null, now: number = Date.now()): ParticipateSession | null {
  const store = sessionStore(storage);
  if (!store) return null;
  try {
    const raw = store.getItem(participateKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ParticipateSession>;
    if (typeof parsed.savedAt !== 'number' || now - parsed.savedAt > MAX_AGE_MS) {
      store.removeItem(participateKey(slug));
      return null;
    }
    return {
      step: typeof parsed.step === 'string' ? parsed.step : 'compose',
      stance: parsed.stance === 'support' || parsed.stance === 'oppose' || parsed.stance === 'undecided' ? parsed.stance : null,
      sentStatus: parsed.sentStatus && typeof parsed.sentStatus === 'object' ? parsed.sentStatus : {},
      actionId: typeof parsed.actionId === 'string' ? parsed.actionId : null,
      sentCount: typeof parsed.sentCount === 'number' ? parsed.sentCount : 0,
      savedAt: parsed.savedAt,
    };
  } catch {
    try { store.removeItem(participateKey(slug)); } catch {}
    return null;
  }
}

export function writeParticipateSession(slug: string, session: Omit<ParticipateSession, 'savedAt'>, storage?: Storage | null, now: number = Date.now()): void {
  const store = sessionStore(storage);
  if (!store) return;
  try {
    store.setItem(participateKey(slug), JSON.stringify({ ...session, savedAt: now }));
  } catch {
    // Storage full or unavailable: the flow still works, it just forgets on refresh.
  }
}

export function clearParticipateSession(slug: string, storage?: Storage | null): void {
  const store = sessionStore(storage);
  if (!store) return;
  try { store.removeItem(participateKey(slug)); } catch {}
}
