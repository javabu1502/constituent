'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Withdraw a story without an account: the link carries the story id and the
 * signed token issued at submission. One click marks the story revoked; the
 * campaign can no longer see it.
 */
function WithdrawInner() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const withdraw = async () => {
    setState('working');
    try {
      const res = await fetch(`/api/stories/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'This link is not valid, or the story was already withdrawn.');
      setState('done');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setState('error');
    }
  };

  if (!id || !token) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">This withdraw link is incomplete. Use the full link from your submission.</p>;
  }
  if (state === 'done') {
    return <p className="text-sm text-gray-800 dark:text-gray-200">Your story was withdrawn. The campaign can no longer see it.</p>;
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        This removes your story from the campaign&apos;s dashboard and from any export. Anything the campaign already used before now may not be fully recallable.
      </p>
      {state === 'error' && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{message}</p>}
      <button
        type="button"
        onClick={withdraw}
        disabled={state === 'working'}
        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-medium"
      >
        {state === 'working' ? 'Withdrawing' : 'Withdraw my story'}
      </button>
    </div>
  );
}

export default function WithdrawStoryPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Withdraw your story</h1>
      <Suspense fallback={null}>
        <WithdrawInner />
      </Suspense>
    </div>
  );
}
