'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The organization assistant.
 *
 * It answers from the organization's own data and drafts language. It cannot
 * change anything on its own: when it wants to create a campaign or record a
 * meeting it returns a proposal, which is shown here as something to approve
 * or discard. Approving posts to a route that re-validates every field.
 */
type Turn = { role: 'user' | 'assistant'; content: string };
type Proposal = { kind: string; input: Record<string, unknown> };

const SUGGESTIONS = [
  'How is my campaign doing?',
  'Draft talking points for a letter about child care funding',
  'I met with Senator Rosen on Tuesday about AB 156',
  'Which legislators have I not spoken to yet?',
];

export function OrgAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, proposal, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    const next = [...turns, { role: 'user' as const, content: message }];
    setTurns(next);
    setInput('');
    setBusy(true);
    setError(null);
    setProposal(null);
    setSaved(null);
    try {
      const res = await fetch('/api/org/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map((t) => ({ role: t.role, content: t.content })) }),
      });
      const data = res.ok ? await res.json().catch(() => null) : null;
      if (!res.ok || !data) {
        const msg = res.status === 429
          ? 'That is a lot of questions at once. Wait a moment and try again.'
          : 'The assistant is unavailable right now. Try again shortly.';
        setError(msg);
        return;
      }
      if (data.reply) setTurns([...next, { role: 'assistant', content: data.reply }]);
      if (data.proposal) setProposal(data.proposal as Proposal);
    } catch {
      setError('Could not reach the assistant. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    if (!proposal || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/org/assistant/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal),
      });
      const data = res.ok ? await res.json().catch(() => null) : null;
      if (!res.ok || !data?.ok) {
        setError((data as { error?: string } | null)?.error || 'Could not save that. Nothing was changed.');
        return;
      }
      setProposal(null);
      setSaved(
        data.saved === 'campaign'
          ? 'Campaign created as a draft. Open it to check it over and launch it when you are ready.'
          : data.positionSaved
            ? 'Meeting saved, and the whip board updated.'
            : 'Meeting saved.',
      );
      router.refresh();
    } catch {
      setError('Could not save that. Nothing was changed.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
      >
        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center" aria-hidden="true">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.4-3.5A7.9 7.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </span>
        <span>
          <span className="block font-semibold text-gray-900 dark:text-white">Ask about your campaigns</span>
          <span className="block text-sm text-gray-600 dark:text-gray-400">
            Check your numbers, draft language, log a meeting.
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">Campaign assistant</h2>
        <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          Close
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-3" aria-live="polite">
        {turns.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              It reads your campaigns to answer, and it never changes anything without showing you first.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 text-xs rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'text-right' : ''}>
            <div
              className={`inline-block max-w-[90%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap text-left ${
                t.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              {t.content}
            </div>
          </div>
        ))}

        {busy && <p className="text-sm text-gray-500 dark:text-gray-400" role="status">Looking that up.</p>}

        {proposal && (
          <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {proposal.kind === 'propose_campaign' ? 'Create this campaign?' : 'Save this meeting?'}
            </p>
            <dl className="text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-3">
              {Object.entries(proposal.input).map(([k, v]) => (
                <div key={k}>
                  <dt className="inline font-medium">{k.replace(/_/g, ' ')}: </dt>
                  <dd className="inline whitespace-pre-wrap">{String(v)}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {proposal.kind === 'propose_campaign'
                ? 'It will be created as a draft. Nothing goes out until you launch it yourself.'
                : 'This goes into your campaign record and your funder report.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={approve}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {saving ? 'Saving' : 'Yes, save it'}
              </button>
              <button
                onClick={() => setProposal(null)}
                disabled={saving}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {saved && (
          <p className="p-2 text-sm rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300" role="status">
            {saved}
          </p>
        )}
        {error && (
          <p className="p-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700"
      >
        <label htmlFor="org-assistant-input" className="sr-only">Ask the campaign assistant</label>
        <input
          id="org-assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a campaign, or describe a meeting"
          disabled={busy}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
