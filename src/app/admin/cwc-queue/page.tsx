'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Operator view of the CWC send queue (House + Senate delivery). Every row
 * here already passed the content screen (or sits HELD for review). Buttons
 * act on ONE row at a time through the same gated production path the cron
 * uses; nothing on this page can bypass a gate. Send asks for a second click.
 * Access control is the API's job; this page just renders 403s honestly.
 */

type DeliveryLog = {
  delivery_id: string;
  status: 'pending' | 'delivered' | 'rejected' | 'error';
  http_status: number | null;
  errors: string[] | null;
  raw_response: string | null;
  updated_at: string;
} | null;

type QueueRow = {
  id: number;
  status: string;
  environment: string;
  chamber: 'house' | 'senate';
  office_code: string;
  campaign_id: string;
  bill_level: string;
  attempts: number;
  max_attempts: number;
  run_after: string;
  last_error: string | null;
  created_at: string;
  message_key: string;
  constituent: { name: string; city: string; state: string; zip: string; email: string };
  subject: string;
  topics: string[];
  bills: Array<{ congress: number; type: string; number: number }>;
  stance: string | null;
  body: string;
  delivery_log: DeliveryLog;
};

const STATUS_STYLE: Record<string, string> = {
  queued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  held: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  leased: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  sent: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  routed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  refused: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  failed: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

export default function CwcQueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading');
  const [busy, setBusy] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/cwc-queue');
    if (res.status === 403) return setStatus('forbidden');
    if (!res.ok) return setStatus('error');
    setRows(await res.json());
    setStatus('ready');
  }, []);
  useEffect(() => { void load(); }, [load]);

  const act = async (id: number, action: 'send' | 'hold' | 'requeue') => {
    setBusy(id);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/cwc-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: [id], ...(action === 'send' ? { confirm: 'SEND' } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice(`${action} failed: ${data.error ?? res.status}`);
      } else if (action === 'send') {
        const s = data.summary ?? {};
        setNotice(`Row ${id}: sent ${s.sent ?? 0}, failed ${s.failed ?? 0}, deferred ${s.deferred ?? 0}, routed ${s.routed ?? 0}, refused ${s.refused ?? 0}. Check the delivery log line below the row.`);
      } else {
        setNotice(`Row ${id}: ${action} applied to ${data.updated?.length ?? 0} row(s).`);
      }
    } catch (e) {
      setNotice(`${action} failed: ${(e as Error).message}`);
    } finally {
      setBusy(null);
      setArmed(null);
      await load();
    }
  };

  if (status === 'loading') return null;
  if (status === 'forbidden') return <p className="max-w-4xl mx-auto px-4 py-12 text-sm text-gray-500">Admin access required.</p>;
  if (status === 'error') return <p className="max-w-4xl mx-auto px-4 py-12 text-sm text-red-600">Failed to load the send queue.</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">CWC send queue</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Messages waiting for, or already through, delivery to House and Senate offices. Send now drains one row
        through the same gated path the cron uses. A row only counts as delivered when the delivery log shows
        an HTTP 2xx from the chamber.
      </p>
      <div className="flex items-center gap-3 mb-6 text-xs text-gray-500 dark:text-gray-400">
        <button type="button" onClick={() => void load()} className="underline">Refresh</button>
        <span>{rows.length} row(s), newest first</span>
      </div>

      {notice && (
        <p className="mb-4 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-gray-800 dark:text-gray-200">
          {notice}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">The queue is empty.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const log = r.delivery_log;
            const delivered = log?.status === 'delivered';
            return (
              <li key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLE[r.status] ?? STATUS_STYLE.routed}`}>{r.status}</span>
                  <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{r.office_code}</span>
                  <span className="text-xs text-gray-500">{r.chamber} · {r.environment}</span>
                  {r.bills.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {r.bills.map((b) => `${b.type} ${b.number} (${b.congress}th)`).join(', ')}{r.stance ? ` · ${r.stance}` : ''}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-gray-400">
                    #{r.id} · {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{r.subject}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {r.constituent.name} · {r.constituent.city}, {r.constituent.state} {r.constituent.zip} · {r.constituent.email} · topics: {r.topics.join(', ')}
                </p>
                <details className="mb-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Message text</summary>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap border-l-2 border-gray-200 dark:border-gray-600 pl-3">{r.body}</p>
                </details>
                {r.last_error && <p className="text-xs text-rose-700 dark:text-rose-300 mb-2">last: {r.last_error}</p>}
                <p className="text-xs text-gray-500 mb-3">
                  attempts {r.attempts}/{r.max_attempts}
                  {log ? (
                    <>
                      {' · '}delivery log: <span className={delivered ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-rose-700 dark:text-rose-300 font-medium'}>{log.status}</span>
                      {log.http_status != null && ` (HTTP ${log.http_status})`}
                      {' · '}id {log.delivery_id}
                      {log.raw_response && <span className="block font-mono text-[11px] text-gray-500 mt-1 break-all">{log.raw_response.slice(0, 300)}</span>}
                    </>
                  ) : ' · no send attempted yet'}
                </p>
                <div className="flex items-center gap-2">
                  {r.status === 'queued' && (
                    <>
                      {armed === r.id ? (
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => void act(r.id, 'send')}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white"
                        >
                          {busy === r.id ? 'Sending…' : `Confirm: send to ${r.office_code}`}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy != null}
                          onClick={() => setArmed(r.id)}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
                        >
                          Send now
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy != null}
                        onClick={() => void act(r.id, 'hold')}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        Hold
                      </button>
                    </>
                  )}
                  {(r.status === 'held' || r.status === 'failed' || r.status === 'refused') && (
                    <button
                      type="button"
                      disabled={busy != null}
                      onClick={() => void act(r.id, 'requeue')}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      Requeue
                    </button>
                  )}
                  {armed === r.id && (
                    <button type="button" onClick={() => setArmed(null)} className="text-xs text-gray-500 underline">cancel</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
