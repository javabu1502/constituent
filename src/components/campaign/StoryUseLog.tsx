'use client';

import { useState } from 'react';
import { STORY_USAGE_OPTIONS } from '@/lib/story-usage';

/**
 * The organization's use log for one story, plus the form to record a new
 * use. A use the storyteller granted is logged on the spot. A use they did
 * not grant is sent to them as a permission request (email with approve and
 * decline links). A storyteller with no contact email cannot be asked.
 */

export interface StoryUse {
  id: string;
  use_type: string;
  note: string;
  status: 'logged' | 'requested' | 'approved' | 'declined';
  created_at: string;
  responded_at: string | null;
}

const STATUS_LABEL: Record<StoryUse['status'], string> = {
  logged: 'permitted',
  requested: 'waiting for the storyteller',
  approved: 'approved by the storyteller',
  declined: 'declined by the storyteller',
};

const STATUS_CLASS: Record<StoryUse['status'], string> = {
  logged: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  requested: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const LABELS = new Map(STORY_USAGE_OPTIONS.map((o) => [o.value, o.label]));

export function StoryUseLog({
  storyId,
  grantedUseValues,
  hasEmail,
  initialUses,
  disabled = false,
}: {
  storyId: string;
  grantedUseValues: string[];
  hasEmail: boolean;
  initialUses: StoryUse[];
  disabled?: boolean;
}) {
  const [uses, setUses] = useState<StoryUse[]>(initialUses);
  const [open, setOpen] = useState(false);
  const [useType, setUseType] = useState(grantedUseValues[0] ?? STORY_USAGE_OPTIONS[0].value);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const granted = grantedUseValues.includes(useType);
  const canSubmit = note.trim().length >= 10 && (granted || hasEmail) && !busy;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stories/${encodeURIComponent(storyId)}/uses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_type: useType, note: note.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not record the use.');
      setUses((prev) => [json.use as StoryUse, ...prev]);
      setNote('');
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record the use.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      {uses.length > 0 && (
        <ul className="space-y-1 mb-2">
          {uses.map((u) => (
            <li key={u.id} className="text-xs text-gray-600 dark:text-gray-300 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${STATUS_CLASS[u.status]}`}>{STATUS_LABEL[u.status]}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{LABELS.get(u.use_type) ?? u.use_type}</span>
              <span>{u.note}</span>
              <span className="text-gray-400 dark:text-gray-500">
                {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          Record a use
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2 bg-gray-50 dark:bg-gray-800/60">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            How are you using this story?
            <select
              value={useType}
              onChange={(e) => setUseType(e.target.value)}
              className="mt-1 block w-full text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {STORY_USAGE_OPTIONS.map((o) => {
                const ok = grantedUseValues.includes(o.value);
                return (
                  <option key={o.value} value={o.value}>
                    {o.label} {ok ? '(permitted)' : hasEmail ? '(needs permission)' : '(cannot be requested)'}
                  </option>
                );
              })}
            </select>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {granted
              ? 'The storyteller allowed this use. It will be logged so they can see how their story was used.'
              : hasEmail
                ? 'The storyteller did not allow this use. They will get an email asking for permission, and you will see their answer here. Do not use the story this way until they say yes.'
                : 'The storyteller did not allow this use and left no contact email, so it cannot be requested.'}
          </p>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            What, where, and when
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g., Quoted in our written testimony to the Assembly Education Committee on Oct 3"
              className="mt-1 block w-full text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </label>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {busy ? 'Saving' : granted ? 'Log this use' : 'Ask the storyteller'}
            </button>
            <button onClick={() => { setOpen(false); setError(null); }} disabled={busy} className="text-xs text-gray-500 hover:underline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
