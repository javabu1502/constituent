'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface QueueItem {
  id: string;
  message_id: string | null;
  decision: string;
  reasons: string[];
  categories: Record<string, boolean>;
  message_excerpt: string | null;
  legislator_name: string | null;
  created_at: string;
  messages: {
    id: string;
    advocate_name: string;
    advocate_city: string;
    advocate_state: string;
    issue_area: string;
    issue_subtopic: string;
    delivery_status: string;
  } | null;
}

export default function AdminCompliancePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/compliance')
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error ${res.status}`);
        }
        return res.json();
      })
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (item: QueueItem, action: 'approve' | 'reject') => {
    setActionLoading(item.id);
    try {
      const res = await fetch('/api/admin/compliance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complianceId: item.id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResolved((prev) => ({
        ...prev,
        [item.id]:
          action === 'approve'
            ? data.delivered
              ? 'Approved & delivered'
              : `Approved but delivery failed: ${data.error ?? 'unknown error'}`
            : 'Rejected — not delivered',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Pre-Send Review Queue</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Messages the automated compliance gate flagged for a human look before delivery to Congress.
      </p>

      {items.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">Nothing awaiting review. 🎉</p>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const flagged = Object.entries(item.categories || {})
            .filter(([, v]) => v)
            .map(([k]) => k);
          const outcome = resolved[item.id];
          return (
            <div
              key={item.id}
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {item.messages?.advocate_name ?? '(unknown sender)'}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      review
                    </span>
                    {flagged.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap mb-2">
                    {item.messages && (
                      <span>
                        {item.messages.advocate_city}, {item.messages.advocate_state}
                      </span>
                    )}
                    {item.legislator_name && <span>→ {item.legislator_name}</span>}
                    <span>{item.messages?.issue_area}</span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>

                  {item.reasons?.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {item.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}

                  {item.message_excerpt && (
                    <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Message excerpt
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {item.message_excerpt}
                      </p>
                    </div>
                  )}
                </div>

                {!outcome && item.message_id && (
                  <div className="flex flex-col gap-2 flex-shrink-0 w-28">
                    <Button
                      size="sm"
                      onClick={() => handleAction(item, 'approve')}
                      isLoading={actionLoading === item.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAction(item, 'reject')}
                      isLoading={actionLoading === item.id}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              {outcome && (
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-200">{outcome}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
