'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WHIP_POSITIONS, WHIP_LABELS } from '@/lib/whip';

/**
 * Log a meeting from the legislator's page — the meeting is the unit, not the
 * bill. Write the note once, check the bills discussed, capture any leanings
 * that came out of it, and it fans out: a note lands on each campaign (with
 * the lobbying hours counted once), and whip positions update per bill.
 */

type BillRow = { slug: string; billRef: string | null; headline: string; position: string | null };

export function LogMeeting({
  legislator,
  bills,
}: {
  legislator: { id: string; name: string; party: string | null; chamber: string | null };
  bills: BillRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [hours, setHours] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [leanings, setLeanings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const save = async () => {
    if (!body.trim() || selected.size === 0) {
      setError('Write the note and pick at least one bill you discussed.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let first = true;
      for (const slug of selected) {
        const res = await fetch(`/api/campaigns/${slug}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body: body.trim(),
            legislator_id: legislator.id,
            legislator_name: legislator.name,
            // Hours count ONCE per meeting, not once per bill discussed.
            hours: first && hours.trim() ? Number(hours) : null,
          }),
        });
        if (!res.ok) throw new Error('note failed');
        first = false;

        const leaning = leanings[slug];
        if (leaning) {
          await fetch(`/api/campaigns/${slug}/whip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              legislator_id: legislator.id,
              legislator_name: legislator.name,
              legislator_party: legislator.party,
              legislator_chamber: legislator.chamber,
              position: leaning,
            }),
          });
        }
      }
      setBody(''); setHours(''); setSelected(new Set()); setLeanings({}); setOpen(false);
      router.refresh();
    } catch {
      setError('Something failed while saving — check the whip boards and retry what’s missing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 p-5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          + Log a meeting with {legislator.name.split(' ').slice(-1)[0]}
        </button>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Log a meeting</h3>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={`What happened in the meeting with ${legislator.name}?`}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">Lobbying hours:</label>
            <input
              type="number" min="0" max="24" step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="1.0"
              className="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <span className="text-[11px] text-gray-400 dark:text-gray-500">counted once for the meeting</span>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bills discussed — and any leaning you picked up:</p>
            <div className="space-y-1.5">
              {bills.map((b) => (
                <div key={b.slug} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-white cursor-pointer select-none min-w-0 flex-1">
                    <input type="checkbox" checked={selected.has(b.slug)} onChange={() => toggle(b.slug)} />
                    <span className="truncate">{b.billRef ? `${b.billRef} — ` : ''}{b.headline}</span>
                  </label>
                  {selected.has(b.slug) && (
                    <select
                      value={leanings[b.slug] ?? ''}
                      onChange={(e) => setLeanings((prev) => ({ ...prev, [b.slug]: e.target.value }))}
                      className="shrink-0 text-xs rounded-lg border border-gray-300 dark:border-gray-600 px-1.5 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                    >
                      <option value="">{b.position ? `keep: ${WHIP_LABELS[b.position as keyof typeof WHIP_LABELS] ?? b.position}` : 'no read'}</option>
                      {WHIP_POSITIONS.map((p) => (
                        <option key={p} value={p}>{WHIP_LABELS[p]}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button" onClick={() => void save()} disabled={saving}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white transition-colors"
            >
              {saving ? 'Saving…' : 'Save meeting'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm px-3 py-2 text-gray-500 hover:underline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
