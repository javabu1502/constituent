'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface MyStory {
  id: string;
  created_at: string;
  attribution_level: 'named' | 'first_name_only' | 'anonymous';
  campaign_headline: string | null;
  title: string | null;
  body: string;
}

function StoryCard({ story }: { story: MyStory }) {
  const router = useRouter();
  const [mode, setMode] = useState<'view' | 'edit' | 'confirmRevoke'>('view');
  const [body, setBody] = useState(story.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = story.body.length > 180 ? story.body.slice(0, 180) + '…' : story.body;

  const saveEdit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: story.title, body }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Could not save');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
      setBusy(false);
    }
  };

  const revoke = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stories/${story.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not revoke');
      router.refresh();
    } catch {
      setError('Could not revoke');
      setBusy(false);
      setMode('view');
    }
  };

  return (
    <li className="py-3">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="text-sm font-medium text-gray-900 dark:text-white">{story.campaign_headline ?? 'A campaign'}</span>
        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {story.attribution_level.replace('_', ' ')}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {new Date(story.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {mode === 'edit' ? (
        <div className="mt-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {story.attribution_level === 'anonymous' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your story stays anonymous — we re-check it for identifying details when you save.
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <button onClick={saveEdit} disabled={busy} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg">
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={() => { setMode('view'); setBody(story.body); }} disabled={busy} className="px-3 py-1.5 text-xs text-gray-500 hover:underline">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {story.title && <p className="text-sm text-gray-800 dark:text-gray-200">{story.title}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{preview}</p>

          {mode === 'confirmRevoke' ? (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                Revoke this story? The campaign will be told you withdrew it and asked not to use it.
              </p>
              <div className="flex items-center gap-2">
                <button onClick={revoke} disabled={busy} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg">
                  {busy ? 'Revoking…' : 'Yes, revoke'}
                </button>
                <button onClick={() => setMode('view')} disabled={busy} className="px-3 py-1.5 text-xs text-gray-500 hover:underline">
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 flex items-center gap-3">
              <button onClick={() => setMode('edit')} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">Change</button>
              <button onClick={() => setMode('confirmRevoke')} className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400">Revoke</button>
            </div>
          )}
        </>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </li>
  );
}

export function MyStoriesSection({ stories }: { stories: MyStory[] }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {stories.map((s) => (
        <StoryCard key={s.id} story={s} />
      ))}
    </ul>
  );
}
