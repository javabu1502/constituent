'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface MyStory {
  id: string;
  created_at: string;
  attribution_level: 'named' | 'first_name_only' | 'anonymous';
  campaign_headline: string | null;
  title: string | null;
  preview: string;
}

function RevokeButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const revoke = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      router.refresh();
    } catch {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
      >
        Remove
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <button onClick={revoke} disabled={busy} className="text-red-600 dark:text-red-400 font-medium hover:underline disabled:opacity-50">
        {busy ? 'Removing…' : 'Confirm'}
      </button>
      <button onClick={() => setConfirming(false)} disabled={busy} className="text-gray-400 hover:underline">
        Cancel
      </button>
    </span>
  );
}

export function MyStoriesSection({ stories }: { stories: MyStory[] }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {stories.map((s) => (
        <li key={s.id} className="py-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{s.campaign_headline ?? 'A campaign'}</span>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {s.attribution_level.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
              {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          {s.title && <p className="text-sm text-gray-800 dark:text-gray-200">{s.title}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{s.preview}</p>
          <div className="mt-1.5">
            <RevokeButton id={s.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}
