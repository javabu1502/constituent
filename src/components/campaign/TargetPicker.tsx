'use client';

import { useEffect, useRef, useState } from 'react';
import { US_STATES } from '@/lib/constants';

export interface TargetOfficial {
  id: string;
  name: string;
  level: 'federal' | 'state';
  state: string;
}

export interface TargetParty {
  party: 'D' | 'R' | 'I';
  chamber: 'house' | 'senate' | 'both';
  level: 'federal' | 'state';
  state?: string;
}

export type TargetMode = 'all' | 'officials' | 'party';

interface SavedList {
  id: string;
  name: string;
  officials: TargetOfficial[];
}

/**
 * Who should messages go to? Defaults to everyone at the campaign's level;
 * orgs can narrow to hand-picked officials (with saved, reusable lists) or a
 * party slice. Committee targeting stays on committee actions.
 */
export function TargetPicker({
  mode,
  officials,
  party,
  billState,
  onModeChange,
  onOfficialsChange,
  onPartyChange,
}: {
  mode: TargetMode;
  officials: TargetOfficial[];
  party: TargetParty;
  billState?: string;
  onModeChange: (m: TargetMode) => void;
  onOfficialsChange: (o: TargetOfficial[]) => void;
  onPartyChange: (p: TargetParty) => void;
}) {
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState(billState || '');
  const [results, setResults] = useState<{ id: string; name: string; title: string; level: 'federal' | 'state'; party: string | null; state: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [lists, setLists] = useState<SavedList[]>([]);
  const [saveName, setSaveName] = useState('');
  const [savingList, setSavingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== 'officials') return;
    fetch('/api/target-lists')
      .then((r) => (r.ok ? r.json() : { lists: [] }))
      .then((d) => setLists(d.lists || []))
      .catch(() => {});
  }, [mode]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/legislators/search?q=${encodeURIComponent(q)}${searchState ? `&state=${searchState}` : ''}`);
        const data = await res.json();
        setResults(res.ok ? data.results || [] : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, searchState]);

  const addOfficial = (r: { id: string; name: string; level: 'federal' | 'state'; state: string }) => {
    if (officials.some((o) => o.id === r.id)) return;
    onOfficialsChange([...officials, { id: r.id, name: r.name, level: r.level, state: r.state }]);
    setQuery('');
    setResults([]);
  };

  const saveList = async () => {
    const name = saveName.trim();
    if (!name || officials.length === 0 || savingList) return;
    setListError(null);
    setSavingList(true);
    try {
      const res = await fetch('/api/target-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, officials }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save list');
      setLists((prev) => [data, ...prev]);
      setSaveName('');
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to save list');
    } finally {
      setSavingList(false);
    }
  };

  const inputClass =
    'px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Who should messages go to?
      </label>
      <div className="flex gap-2 mb-3">
        {([['all', 'Everyone at the level above'], ['officials', 'Specific officials'], ['party', 'A party']] as const).map(([val, lbl]) => (
          <label
            key={val}
            className={`flex-1 text-center px-3 py-2 rounded-lg border-2 cursor-pointer text-sm font-medium transition-colors ${
              mode === val
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
            }`}
          >
            <input type="radio" name="targetMode" value={val} checked={mode === val} onChange={() => onModeChange(val)} className="sr-only" />
            {lbl}
          </label>
        ))}
      </div>

      {mode === 'officials' && (
        <div className="space-y-3">
          {lists.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const list = lists.find((l) => l.id === e.target.value);
                if (list) onOfficialsChange([...officials, ...list.officials.filter((o) => !officials.some((x) => x.id === o.id))]);
              }}
              className={`${inputClass} w-full`}
            >
              <option value="">Add from a saved list…</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.officials.length})</option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, e.g. Rosen"
              className={`${inputClass} flex-1`}
            />
            <select value={searchState} onChange={(e) => setSearchState(e.target.value)} className={inputClass} aria-label="Include a state legislature">
              <option value="">Federal only</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>+ {s.code} legislature</option>
              ))}
            </select>
          </div>

          {searching && <p className="text-xs text-gray-400">Searching…</p>}
          {results.length > 0 && (
            <ul className="border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-100 dark:divide-gray-700 max-h-56 overflow-y-auto">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => addOfficial(r)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
                  >
                    <span className="text-gray-900 dark:text-white">{r.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {r.title}{r.party ? `, ${r.party.charAt(0)}` : ''}, {r.state}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {officials.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {officials.map((o) => (
                  <span key={o.id} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    {o.name}
                    <button
                      type="button"
                      onClick={() => onOfficialsChange(officials.filter((x) => x.id !== o.id))}
                      aria-label={`Remove ${o.name}`}
                      className="hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  maxLength={80}
                  placeholder="Save these as a list, e.g. Our champions"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={saveList}
                  disabled={!saveName.trim() || savingList}
                  className="px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                >
                  {savingList ? 'Saving…' : 'Save list'}
                </button>
              </div>
              {listError && <p className="text-xs text-red-600 dark:text-red-400">{listError}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Participants whose representatives are on this list write to them. Everyone else is shown other ways to help.
              </p>
            </>
          )}
        </div>
      )}

      {mode === 'party' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <select value={party.party} onChange={(e) => onPartyChange({ ...party, party: e.target.value as TargetParty['party'] })} className={inputClass} aria-label="Party">
              <option value="D">Democrats</option>
              <option value="R">Republicans</option>
              <option value="I">Independents</option>
            </select>
            <select value={party.chamber} onChange={(e) => onPartyChange({ ...party, chamber: e.target.value as TargetParty['chamber'] })} className={inputClass} aria-label="Chamber">
              <option value="both">Both chambers</option>
              <option value="house">House only</option>
              <option value="senate">Senate only</option>
            </select>
            <select value={party.level} onChange={(e) => onPartyChange({ ...party, level: e.target.value as TargetParty['level'] })} className={inputClass} aria-label="Level">
              <option value="federal">Federal</option>
              <option value="state">State</option>
            </select>
            <select value={party.state || ''} onChange={(e) => onPartyChange({ ...party, state: e.target.value || undefined })} className={inputClass} aria-label="Limit to one state">
              <option value="">Any state</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.code} only</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Participants write only to their own representatives who match. Everyone else is shown other ways to help.
          </p>
        </div>
      )}
    </div>
  );
}
