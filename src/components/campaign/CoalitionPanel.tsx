'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Coalition + outcome panel — the org's map of who else is in the fight.
 * Supporting and opposing organizations, what each said publicly, and the
 * conversation log with them; plus how the legislation ultimately ended.
 */

type Stakeholder = { id: string; name: string; side: 'support' | 'oppose' | 'neutral'; statement: string | null; created_at: string };
type SNote = { id: string; stakeholder_id: string | null; body: string; created_at: string };

const OUTCOMES: { value: string; label: string }[] = [
  { value: '', label: 'Ongoing' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'died_committee', label: 'Died in committee' },
  { value: 'vetoed', label: 'Vetoed' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export function CoalitionPanel({ slug, initialOutcome }: { slug: string; initialOutcome: string | null }) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [notes, setNotes] = useState<SNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [outcome, setOutcome] = useState(initialOutcome ?? '');
  const [open, setOpen] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSide, setNewSide] = useState<'support' | 'oppose'>('support');
  const [newStatement, setNewStatement] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${slug}/stakeholders`);
      if (!res.ok) return;
      const data = await res.json();
      setStakeholders(data.stakeholders || []);
      setNotes(data.notes || []);
    } finally {
      setLoaded(true);
    }
  }, [slug]);
  useEffect(() => { void load(); }, [load]);

  const saveOutcome = async (value: string) => {
    setOutcome(value);
    await fetch(`/api/campaigns/${slug}/outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: value || null }),
    }).catch(() => {});
  };

  const addStakeholder = async () => {
    if (!newName.trim()) return;
    const res = await fetch(`/api/campaigns/${slug}/stakeholders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), side: newSide, statement: newStatement.trim() || null }),
    });
    if (res.ok) {
      const { stakeholder } = await res.json();
      setStakeholders((prev) => [...prev, stakeholder]);
      setNewName(''); setNewStatement(''); setAdding(false);
    }
  };

  const addNote = async (s: Stakeholder) => {
    if (!noteDraft.trim()) return;
    const res = await fetch(`/api/campaigns/${slug}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: noteDraft.trim(), stakeholder_id: s.id }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNoteDraft('');
    }
  };

  if (!loaded) return null;

  const side = (s: 'support' | 'oppose') => stakeholders.filter((x) => x.side === s);

  const column = (title: string, list: Stakeholder[], tone: 'support' | 'oppose') => (
    <div className="flex-1 min-w-56">
      <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${tone === 'support' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {title} ({list.length})
      </h3>
      <div className="space-y-2">
        {list.map((s) => {
          const convos = notes.filter((n) => n.stakeholder_id === s.id);
          return (
            <div key={s.id} className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</span>
                <button type="button" onClick={() => { setOpen(open === s.id ? null : s.id); setNoteDraft(''); }} className="text-xs text-purple-600 dark:text-purple-400 hover:underline shrink-0">
                  Convos{convos.length ? ` (${convos.length})` : ''}
                </button>
              </div>
              {s.statement && <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1">&ldquo;{s.statement}&rdquo;</p>}
              {open === s.id && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
                  {convos.map((n) => (
                    <p key={n.id} className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-gray-400 dark:text-gray-500 mr-1.5">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      {n.body}
                    </p>
                  ))}
                  {convos.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 italic">No conversations logged yet.</p>}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void addNote(s); }}
                      placeholder="Log a conversation…"
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <button type="button" onClick={() => void addNote(s)} className="text-xs px-2 py-1 rounded bg-purple-600 text-white">Add</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500 italic">None tracked yet.</p>}
      </div>
    </div>
  );

  return (
    <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Coalition &amp; outcome</h2>
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          Legislation outcome:
          <select
            value={outcome}
            onChange={(e) => void saveOutcome(e.target.value)}
            className="text-xs rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            {OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Who else was in the fight — what they said publicly, and your conversations with them.
      </p>

      <div className="flex flex-wrap gap-5">
        {column('Supporting', side('support'), 'support')}
        {column('Opposing', side('oppose'), 'oppose')}
      </div>

      {adding ? (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2 items-start">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Organization name" className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          <select value={newSide} onChange={(e) => setNewSide(e.target.value as 'support' | 'oppose')} className="px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <option value="support">Supports</option>
            <option value="oppose">Opposes</option>
          </select>
          <input value={newStatement} onChange={(e) => setNewStatement(e.target.value)} placeholder="What did they say? (public position)" className="flex-1 min-w-48 px-2.5 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
          <button type="button" onClick={() => void addStakeholder()} className="text-sm px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">Save</button>
          <button type="button" onClick={() => setAdding(false)} className="text-sm px-2 py-1.5 text-gray-500 hover:underline">Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-4 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">
          + Track an organization
        </button>
      )}
    </div>
  );
}
