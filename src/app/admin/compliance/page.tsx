'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Admin review queue for the CWC content-compliance gate: messages the
 * screener flagged 'review' sit here as HELD queue rows until a human
 * approves (release to the send queue) or rejects (refuse) them.
 * Access control is the API's job; this page just renders 403s honestly.
 */

type ReviewItem = {
  id: string;
  message_key: string | null;
  reasons: string[];
  categories: Record<string, boolean>;
  message_excerpt: string | null;
  model: string | null;
  created_at: string;
};

export default function ComplianceReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/compliance');
    if (res.status === 403) return setStatus('forbidden');
    if (!res.ok) return setStatus('error');
    setItems(await res.json());
    setStatus('ready');
  }, []);
  useEffect(() => { void load(); }, [load]);

  const resolve = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id);
    try {
      const res = await fetch('/api/admin/compliance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complianceId: id, action }),
      });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setBusy(null);
    }
  };

  if (status === 'loading') return null;
  if (status === 'forbidden') return <p className="max-w-3xl mx-auto px-4 py-12 text-sm text-gray-500">Admin access required.</p>;
  if (status === 'error') return <p className="max-w-3xl mx-auto px-4 py-12 text-sm text-red-600">Failed to load the review queue.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Compliance review</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Messages the pre-send screener held before CWC delivery. Approve releases the message to the send queue;
        reject refuses it permanently. Political viewpoint and tone are never grounds for rejection.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nothing waiting for review.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const flags = Object.entries(item.categories ?? {}).filter(([, v]) => v).map(([k]) => k);
            return (
              <li key={item.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {flags.map((f) => (
                    <span key={f} className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {f}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                {item.reasons?.length > 0 && (
                  <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside mb-2">
                    {item.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap border-l-2 border-gray-200 dark:border-gray-600 pl-3 mb-3">
                  {item.message_excerpt || '(no excerpt recorded)'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => void resolve(item.id, 'approve')}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
                  >
                    Approve &amp; send
                  </button>
                  <button
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => void resolve(item.id, 'reject')}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <span className="text-xs text-gray-400 truncate">{item.message_key}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
