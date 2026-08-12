'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { WHIP_POSITIONS, WHIP_LABELS, WHIP_STYLES, isSupportive, emptyWhipTally } from '@/lib/whip';

/**
 * The whip board — the org's vote count for a campaign initiative. Every
 * relevant legislator with: the org's position on them, live sponsor status,
 * committee membership, constituent-message pressure, and meeting notes.
 * Header math answers the question that matters: does this pass committee?
 */

type Row = {
  id: string;
  name: string;
  party: string | null;
  chamber: string | null;
  position: string | null;
  sponsor: boolean;
  onCommittee: boolean;
  committeeRole: string | null;
  messages: number;
  noteCount: number;
};

type Note = {
  id: string;
  legislator_id: string | null;
  legislator_name: string | null;
  body: string;
  created_at: string;
  billRef?: string | null;
  fromThisCampaign?: boolean;
};

// lower/house -> House side, upper/senate -> Senate side.
function chamberOf(chamber: string | null): 'house' | 'senate' | null {
  if (chamber === 'lower' || chamber === 'house') return 'house';
  if (chamber === 'upper' || chamber === 'senate') return 'senate';
  return null;
}

export function WhipBoard({ slug }: { slug: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [committee, setCommittee] = useState<{ id: string; name: string; size: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [chamberFilter, setChamberFilter] = useState('');
  const [committeeOnly, setCommitteeOnly] = useState(false);
  const [openLegislator, setOpenLegislator] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteHours, setNoteHours] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${slug}/whip`);
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.rows || []);
      setNotes(data.notes || []);
      setCommittee(data.committee ?? null);
    } finally {
      setLoaded(true);
    }
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  const setPosition = async (row: Row, position: string) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, position } : r)));
    await fetch(`/api/campaigns/${slug}/whip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legislator_id: row.id, legislator_name: row.name,
        legislator_party: row.party, legislator_chamber: row.chamber, position,
      }),
    }).catch(() => {});
  };

  const addNote = async (row: Row | null) => {
    if (!noteDraft.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/campaigns/${slug}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: noteDraft.trim(),
          legislator_id: row?.id ?? null,
          legislator_name: row?.name ?? null,
          hours: noteHours.trim() ? Number(noteHours) : null,
        }),
      });
      if (res.ok) {
        const { note } = await res.json();
        setNotes((prev) => [note, ...prev]);
        if (row) setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, noteCount: r.noteCount + 1 } : r)));
        setNoteDraft('');
        setNoteHours('');
      }
    } finally {
      setSavingNote(false);
    }
  };

  const tally = useMemo(() => {
    const t = emptyWhipTally();
    for (const r of rows) if (r.position && r.position in t) t[r.position as keyof typeof t] += 1;
    return t;
  }, [rows]);

  const committeeTally = useMemo(() => {
    if (!committee) return null;
    let supportive = 0;
    for (const r of rows) {
      if (r.onCommittee && (isSupportive(r.position) || r.sponsor)) supportive += 1;
    }
    return { supportive, size: committee.size, majority: Math.floor(committee.size / 2) + 1 };
  }, [rows, committee]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (committeeOnly && !r.onCommittee) return false;
      if (chamberFilter && chamberOf(r.chamber) !== chamberFilter) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, chamberFilter, committeeOnly]);

  if (!loaded) return null;
  if (rows.length === 0) return null;

  return (
    <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Whip count</h2>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {WHIP_POSITIONS.map((p) => (
            <span key={p} className={`px-2 py-0.5 rounded-full font-medium ${WHIP_STYLES[p]}`}>
              {WHIP_LABELS[p]} {tally[p]}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Your private vote count, relative to YOUR campaign&apos;s ask. <span className="font-medium">Yes / No</span> = they
        told you how they&apos;ll vote · <span className="font-medium">Leaning</span> = your read, no promise yet ·{' '}
        <span className="font-medium">Uncommitted</span> = still winnable — your to-do list. Sponsor badges sync
        automatically from the bill record. Click a name for full intel; log hours on notes to track lobbying time.
      </p>

      {committeeTally && committee && (
        <div className={`mb-4 p-3 rounded-lg border text-sm ${
          committeeTally.supportive >= committeeTally.majority
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        }`}>
          <span className="font-semibold">{committee.name}:</span> {committeeTally.supportive} of {committeeTally.size} supportive
          (need {committeeTally.majority}) — {committeeTally.supportive >= committeeTally.majority ? 'passes if the whip holds.' : `${committeeTally.majority - committeeTally.supportive} more to a majority.`}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search legislators…"
          className="flex-1 min-w-40 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        />
        <select
          value={chamberFilter}
          onChange={(e) => setChamberFilter(e.target.value)}
          className="px-2 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        >
          <option value="">Both chambers</option>
          <option value="house">House / Assembly</option>
          <option value="senate">Senate</option>
        </select>
        {committee && (
          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
            <input type="checkbox" checked={committeeOnly} onChange={(e) => setCommitteeOnly(e.target.checked)} />
            Committee only
          </label>
        )}
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {visible.map((r) => (
          <li key={r.id} className="py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <Link
                  href={`/dashboard/legislator?id=${encodeURIComponent(r.id)}`}
                  className="text-sm font-medium text-purple-700 dark:text-purple-300 hover:underline truncate"
                  title="Full intel on this legislator"
                >
                  {r.name}
                </Link>
                {r.party && <span className="text-xs text-gray-400 shrink-0">({r.party.charAt(0)})</span>}
                {chamberOf(r.chamber) && (
                  <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                    chamberOf(r.chamber) === 'senate'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                      : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                  }`}>
                    {chamberOf(r.chamber) === 'senate' ? 'Senate' : 'House'}
                  </span>
                )}
                {r.sponsor && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Sponsor
                  </span>
                )}
                {r.onCommittee && (
                  <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    {r.committeeRole ? r.committeeRole.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Committee'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.messages > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400" title="Constituent messages across this initiative">
                    ✉ {r.messages}
                  </span>
                )}
                <select
                  value={r.position ?? ''}
                  onChange={(e) => e.target.value && setPosition(r, e.target.value)}
                  className={`text-xs rounded-lg border border-gray-200 dark:border-gray-600 px-1.5 py-1 ${r.position ? WHIP_STYLES[r.position as keyof typeof WHIP_STYLES] : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'}`}
                >
                  <option value="">— set —</option>
                  {WHIP_POSITIONS.map((p) => (
                    <option key={p} value={p}>{WHIP_LABELS[p]}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { setOpenLegislator(openLegislator === r.id ? null : r.id); setNoteDraft(''); }}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Notes{r.noteCount > 0 ? ` (${r.noteCount})` : ''}
                </button>
              </div>
            </div>

            {openLegislator === r.id && (
              <div className="mt-2 ml-1 pl-3 border-l-2 border-purple-200 dark:border-purple-800 space-y-2">
                {notes.filter((n) => n.legislator_id === r.id).map((n) => (
                  <div key={n.id} className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 mr-2">
                      {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {n.fromThisCampaign === false && n.billRef && (
                      <span className="text-[10px] font-semibold text-purple-500 dark:text-purple-400 mr-1.5">[{n.billRef}]</span>
                    )}
                    {n.body}
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void addNote(r); }}
                    placeholder={`Meeting note about ${r.name.split(' ').pop()}…`}
                    className="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    value={noteHours}
                    onChange={(e) => setNoteHours(e.target.value)}
                    placeholder="hrs"
                    title="Lobbying hours spent on this touchpoint"
                    className="w-16 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => void addNote(r)}
                    disabled={savingNote || !noteDraft.trim()}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
