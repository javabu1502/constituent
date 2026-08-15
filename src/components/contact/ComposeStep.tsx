'use client';

import { useState } from 'react';
import type { ContactState, ContactAction } from './ContactFlow';
import { Button } from '@/components/ui/Button';
import { useTurnstile } from '@/components/ui/Turnstile';

/**
 * Message-first compose step for the general contact flow: draft ONE core
 * message from the constituent's issue + goal + story, let them edit and
 * approve it — before any address is asked for. Each selected official later
 * gets a deterministic envelope around this exact text.
 */
export function ComposeStep({
  state,
  dispatch,
}: {
  state: ContactState;
  dispatch: React.Dispatch<ContactAction>;
}) {
  const [drafting, setDrafting] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken, TurnstileWidget } = useTurnstile();

  const draft = async () => {
    setError(null);
    setDrafting(true);
    try {
      const turnstileToken = await getToken().catch(() => '');
      const res = await fetch('/api/generate-core-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: state.issue || state.issueCategory || 'an issue that matters to me',
          ask: state.ask || undefined,
          personalWhy: state.personalWhy?.trim() || undefined,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Drafting failed');
      dispatch({ type: 'SET_CORE', payload: data.body });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not draft your message — you can write it yourself below or try again.');
      // Let them write the core by hand if drafting is down.
      setManual(true);
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <TurnstileWidget />
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {!state.coreMessage && !manual && !drafting && (
        <div className="text-center py-4">
          <Button onClick={() => void draft()}>Draft my message</Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            One message, built from what you just told us. You&apos;ll see it and edit it before anything else happens.
          </p>
        </div>
      )}

      {drafting && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">Writing your message…</p>
      )}

      {(state.coreMessage !== '' || manual) && !drafting && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your message <span className="text-gray-400 dark:text-gray-500 font-normal">(edit anything — these are your words)</span>
            </label>
            <textarea
              value={state.coreMessage}
              onChange={(e) => dispatch({ type: 'SET_CORE', payload: e.target.value })}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              We add the greeting, each official&apos;s name, and your signature automatically — your words are never changed.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!state.coreMessage.trim()) {
                  setError('Write or draft a message first.');
                  return;
                }
                dispatch({ type: 'GO_TO_STEP', payload: 'address' });
              }}
              className="flex-1"
            >
              Looks good — find my officials
            </Button>
            <button
              type="button"
              onClick={() => void draft()}
              disabled={drafting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Redraft
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => dispatch({ type: 'GO_TO_STEP', payload: 'topic' })}
        className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
      >
        &larr; Back to your issue
      </button>
    </div>
  );
}
