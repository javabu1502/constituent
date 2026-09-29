'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Landing page for the approve/decline links in a permission-request email.
 * Loads the request, shows what is being asked, and confirms with one click.
 * Nothing is recorded until the storyteller presses the button.
 */

interface RequestView {
  id: string;
  use_label: string;
  note: string;
  status: string;
  org_name: string | null;
  campaign_headline: string | null;
}

function PermissionInner() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const answer = params.get('answer') ?? '';
  const token = params.get('token') ?? '';
  const qs = `id=${encodeURIComponent(id)}&answer=${encodeURIComponent(answer)}&token=${encodeURIComponent(token)}`;

  const [req, setReq] = useState<RequestView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id || !token || (answer !== 'approve' && answer !== 'decline')) {
      setError('This link is not valid.');
      return;
    }
    fetch(`/api/stories/permission?${qs}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Could not load this request.');
        setReq(j.request);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load this request.'));
  }, [id, answer, token, qs]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/stories/permission?${qs}`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not record your answer.');
      setReq(j.request);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record your answer.');
    } finally {
      setBusy(false);
    }
  };

  const org = req?.org_name || 'The organization';
  const settled = req && req.status !== 'requested';

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Permission to use your story</h1>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
      {req && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {org} is asking to use the story you shared with <strong>{req.campaign_headline}</strong> in this way:
          </p>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{req.use_label}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line">{req.note}</p>
          </div>
          {settled ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {req.status === 'approved' ? 'You said yes to this use.' : 'You said no to this use.'}
              {done ? ' The organization will see your answer.' : ' This request was already answered.'}
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {answer === 'approve'
                  ? 'Confirm that they may use your story this way. This covers only the use described above.'
                  : 'Confirm that they may not use your story this way. Nothing else about your story changes.'}
              </p>
              <button
                onClick={confirm}
                disabled={busy}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${answer === 'approve' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-800'}`}
              >
                {busy ? 'Saving' : answer === 'approve' ? 'Yes, they may use it this way' : 'No, they may not'}
              </button>
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
        You can withdraw your story at any time from your <Link href="/dashboard" className="underline">dashboard</Link> or with the withdraw link you received when you shared it.
      </p>
    </main>
  );
}

export default function StoryPermissionPage() {
  return (
    <Suspense fallback={null}>
      <PermissionInner />
    </Suspense>
  );
}
