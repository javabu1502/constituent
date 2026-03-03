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
  userName: string;
  userEmail: string;
  issue: string;
  issueCategory: string;
  ask: string;
  personalWhy: string;
  messages: Record<string, { subject: string; body: string }>;
  timestamp: number;
}

interface AutoSaveState {
  step: string;
  address: { street: string; city: string; state: string; zip: string } | null;
  selectedReps: { id: string }[];
  contactMethod: 'email' | 'phone';
  userName: string;
  userEmail: string;
  issue: string;
  issueCategory: string;
  ask: string;
  personalWhy: string;
  messages: Record<string, { subject: string; body: string }>;
}

export function useAutoSave(
  state: AutoSaveState,
  wasReset: boolean
): {
  savedDraft: SavedDraft | null;
  dismissDraft: () => void;
  clearDraft: () => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null);
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
    // Don't save if on success or address step with no address
    if (state.step === 'success') return;
    if (state.step === 'address' && !state.address) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const draft: SavedDraft = {
        step: state.step,
        address: state.address,
        selectedRepIds: state.selectedReps.map((r) => r.id),
        contactMethod: state.contactMethod,
        userName: state.userName,
        userEmail: state.userEmail,
        issue: state.issue,
        issueCategory: state.issueCategory,
        ask: state.ask,
        personalWhy: state.personalWhy,
        messages: state.messages,
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // localStorage full or unavailable
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    state.step, state.address, state.selectedReps, state.contactMethod,
    state.userName, state.userEmail, state.issue, state.issueCategory,
    state.ask, state.personalWhy, state.messages,
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

  return { savedDraft, dismissDraft, clearDraft };
}
