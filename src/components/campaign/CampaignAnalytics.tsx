'use client';

import { useMemo, useState } from 'react';
import { STORY_USAGE_OPTIONS } from '@/lib/story-usage';
import { US_STATES } from '@/lib/constants';

interface OfficialContacted {
  name: string;
  party: string | null;
  count: number;
}

interface AdvocacyAnalytics {
  kind: 'advocacy';
  total_actions: number;
  total_messages: number;
  states_represented: string[];
  daily_counts: Record<string, number>;
  delivery_breakdown: Record<string, number>;
  top_states: Array<{ state: string; count: number }>;
  officials_contacted: OfficialContacted[];
  avg_messages_per_action: number;
}

interface StoryListItem {
  id: string;
  created_at: string;
  attribution_level: 'named' | 'first_name_only' | 'anonymous';
  display_name: string; // "Anonymous" for anonymous rows
  city: string | null;
  state: string | null;
  email: string | null;
  title: string | null;
  body: string;
  granted_uses: string[]; // human-readable labels
  granted_use_values: string[]; // raw values, for filtering
  officials: string[]; // names of officials representing this storyteller
  revoked: boolean;
  edited_at: string | null;
}

interface StoryOfficial {
  name: string;
  title: string | null;
  party: string | null;
  state: string | null;
  story_count: number;
  inferred: boolean; // true = senators inferred from state, not matched from address
}

interface StoryAnalytics {
  kind: 'storytelling';
  total_stories: number;
  subjects: Array<{ title: string; created_at: string }>;
  stories: StoryListItem[];
  officials: StoryOfficial[];
  campaign_slug: string;
}

interface CampaignAnalyticsProps {
  analytics: AdvocacyAnalytics | StoryAnalytics;
  campaignName: string;
}

function attributionBadge(level: StoryListItem['attribution_level']): string {
  if (level === 'anonymous') return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  if (level === 'first_name_only') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
}

function partyBadgeClass(party: string | null): string {
  const p = (party || '').toLowerCase();
  if (p.startsWith('d')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  if (p.startsWith('r')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

/** Normalize "NV" / "Nevada" (any case) to a display code like "NV". */
function stateCode(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  const match = US_STATES.find((s) => s.name.toLowerCase() === t.toLowerCase());
  return match?.code ?? t;
}

const PRESS_USE = 'shared_with_media';
const CONTACT_USE = 'contact_me_followup';

/** Shared 30-day bar chart for both campaign types. */
function DailyBarChart({ counts, unit }: { counts: Record<string, number>; unit: string }) {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  const values = dates.map((date) => counts[date] || 0);
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-end gap-[2px] h-40">
        {dates.map((date, i) => {
          const count = values[i];
          const heightPct = (count / max) * 100;
          const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          return (
            <div key={date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div
                className="w-full bg-purple-500 dark:bg-purple-400 rounded-t-sm transition-all hover:bg-purple-600 dark:hover:bg-purple-300"
                style={{
                  height: count > 0 ? `${Math.max(heightPct, 4)}%` : '0%',
                  minHeight: count > 0 ? '2px' : '0px',
                }}
              />
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                  {formattedDate}: {count} {unit}{count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
        <span>
          {new Date(dates[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span className="text-gray-500 dark:text-gray-400">{total} in the last 30 days</span>
        <span>
          {new Date(dates[dates.length - 1] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

function photoRequestMailto(story: StoryListItem, campaignName: string): string {
  const firstName = story.display_name.split(/\s+/)[0] || 'there';
  const subject = `A photo to go with your story — ${campaignName}`;
  const body =
    `Hi ${firstName},\n\n` +
    `Thank you again for sharing your story with the "${campaignName}" campaign. ` +
    `A photo makes stories like yours land even harder with decision-makers and the press.\n\n` +
    `If you're comfortable, could you reply with a photo of yourself (or one that fits your story)? ` +
    `We'll only use it the ways you've already approved, and you can say no or change your mind at any time.\n\n` +
    `Thank you!`;
  return `mailto:${story.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function StorytellingAnalytics({ analytics, campaignName }: { analytics: StoryAnalytics; campaignName: string }) {
  const [q, setQ] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [attributionFilter, setAttributionFilter] = useState('');
  const [useFilter, setUseFilter] = useState('');
  const [officialFilter, setOfficialFilter] = useState('');

  const active = useMemo(() => analytics.stories.filter((s) => !s.revoked), [analytics.stories]);

  // Filter options derived from the data itself.
  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of active) {
      const code = stateCode(s.state);
      if (code) set.add(code);
    }
    return Array.from(set).sort();
  }, [active]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of active) {
      if (s.city?.trim()) set.add(s.city.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [active]);

  const usedUseValues = useMemo(() => {
    const set = new Set<string>();
    for (const s of active) for (const u of s.granted_use_values) set.add(u);
    return set;
  }, [active]);

  const anyFilter = !!(q.trim() || stateFilter || cityFilter || attributionFilter || useFilter || officialFilter);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return analytics.stories.filter((s) => {
      // Revoked stories carry no content/identity; keep them visible (as flags)
      // only when no filters are active.
      if (s.revoked) return !anyFilter;
      if (stateFilter && stateCode(s.state) !== stateFilter) return false;
      if (cityFilter && (s.city?.trim().toLowerCase() ?? '') !== cityFilter.toLowerCase()) return false;
      if (attributionFilter && s.attribution_level !== attributionFilter) return false;
      if (useFilter && !s.granted_use_values.includes(useFilter)) return false;
      if (officialFilter && !s.officials.includes(officialFilter)) return false;
      if (needle) {
        const haystack = [s.display_name, s.title ?? '', s.body, s.city ?? '', s.state ?? '', s.email ?? '', ...s.officials]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [analytics.stories, q, stateFilter, cityFilter, attributionFilter, useFilter, officialFilter, anyFilter]);

  const clearFilters = () => {
    setQ('');
    setStateFilter('');
    setCityFilter('');
    setAttributionFilter('');
    setUseFilter('');
    setOfficialFilter('');
  };

  // Reach + consent stats.
  const pressReady = active.filter((s) => s.granted_use_values.includes(PRESS_USE)).length;
  const contactable = active.filter((s) => !!s.email).length;

  // Use over time (stories per day).
  const dailyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of active) {
      const date = new Date(s.created_at).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    }
    return counts;
  }, [active]);

  // Filter-aware CSV export.
  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (stateFilter) params.set('state', stateFilter);
    if (cityFilter) params.set('city', cityFilter);
    if (attributionFilter) params.set('attribution', attributionFilter);
    if (useFilter) params.set('use', useFilter);
    if (officialFilter) params.set('official', officialFilter);
    const qs = params.toString();
    return `/api/campaigns/${analytics.campaign_slug}/stories/export${qs ? `?${qs}` : ''}`;
  }, [analytics.campaign_slug, q, stateFilter, cityFilter, attributionFilter, useFilter, officialFilter]);

  const selectClass =
    'px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600';

  return (
    <div className="space-y-6">
      {/* Use / impact / reach at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Stories Shared</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{analytics.total_stories.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Including anonymous</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">States Reached</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stateOptions.length}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {cityOptions.length} cit{cityOptions.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Press-Ready</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{pressReady}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">OK to share with media</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Reachable</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{contactable}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Agreed to follow-up contact</p>
        </div>
      </div>

      {/* Use over time */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Stories Over Time (Last 30 Days)</h3>
        <DailyBarChart counts={dailyCounts} unit="story" />
      </div>

      {/* By elected official — target your outreach */}
      {analytics.officials.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">By Elected Official</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            How many storytellers each official represents. Click one to pull up their constituents&rsquo; stories —
            then bring exactly those stories to that office. &ldquo;State match&rdquo; officials are the state&rsquo;s US senators
            inferred from the storyteller&rsquo;s state; others were matched from the storyteller&rsquo;s own address.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analytics.officials.slice(0, 20).map((o) => {
              const selected = officialFilter === o.name;
              return (
                <button
                  key={`${o.name}|${o.state ?? ''}`}
                  onClick={() => setOfficialFilter(selected ? '' : o.name)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                    selected
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-400'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">{o.name}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                      {[o.title, stateCode(o.state)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {o.party && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${partyBadgeClass(o.party)}`}>
                        {o.party.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {o.inferred && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        state match
                      </span>
                    )}
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{o.story_count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Story browser */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Stories</h3>
          {analytics.stories.length > 0 && (
            <a
              href={exportHref}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
            >
              Download CSV{anyFilter ? ' (filtered)' : ''}
            </a>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Stories storytellers shared with your campaign. Anonymous stories show no name or contact details.
          Storytellers can change or revoke their story at any time — changes are flagged, and revoked stories are
          hidden and excluded from the CSV.
        </p>

        {analytics.stories.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search stories, names, places…"
                className={`${selectClass} flex-1 min-w-[200px]`}
              />
              <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className={selectClass} aria-label="Filter by state">
                <option value="">All states</option>
                {stateOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={selectClass} aria-label="Filter by city">
                <option value="">All cities</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select value={attributionFilter} onChange={(e) => setAttributionFilter(e.target.value)} className={selectClass} aria-label="Filter by attribution">
                <option value="">Any attribution</option>
                <option value="named">Named</option>
                <option value="first_name_only">First name only</option>
                <option value="anonymous">Anonymous</option>
              </select>
              <select value={useFilter} onChange={(e) => setUseFilter(e.target.value)} className={selectClass} aria-label="Filter by permitted use">
                <option value="">Any permitted use</option>
                {STORY_USAGE_OPTIONS.filter((o) => usedUseValues.has(o.value)).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => setUseFilter(useFilter === PRESS_USE ? '' : PRESS_USE)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                  useFilter === PRESS_USE
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                }`}
              >
                📰 Press-ready
              </button>
              <button
                onClick={() => setUseFilter(useFilter === CONTACT_USE ? '' : CONTACT_USE)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                  useFilter === CONTACT_USE
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                }`}
              >
                ✉️ OK to contact
              </button>
              <span className="text-gray-500 dark:text-gray-400 ml-auto">
                {filtered.length} of {analytics.stories.length} stor{analytics.stories.length === 1 ? 'y' : 'ies'}
                {officialFilter ? ` · constituents of ${officialFilter}` : ''}
              </span>
              {anyFilter && (
                <button onClick={clearFilters} className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {analytics.stories.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No stories yet.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No stories match these filters.{' '}
            <button onClick={clearFilters} className="text-purple-600 dark:text-purple-400 hover:underline">Clear filters</button>
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((s) => (
              <li key={s.id} className={`py-3 ${s.revoked ? 'opacity-70' : ''}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{s.display_name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${attributionBadge(s.attribution_level)}`}>
                    {s.attribution_level.replace('_', ' ')}
                  </span>
                  {s.revoked && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      revoked
                    </span>
                  )}
                  {!s.revoked && s.edited_at && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      edited {new Date(s.edited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {s.revoked ? (
                  <p className="text-xs text-red-600 dark:text-red-400 italic">
                    The storyteller revoked this story — please don&rsquo;t use it.
                  </p>
                ) : (
                  <>
                    {/* Contact + location, shown only when the storyteller shared them */}
                    {(s.city || s.state || s.email) && (
                      <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {(s.city || s.state) && <span>📍 {[s.city, s.state].filter(Boolean).join(', ')}</span>}
                        {s.email && <span>✉️ <a href={`mailto:${s.email}`} className="text-purple-600 dark:text-purple-400 hover:underline">{s.email}</a></span>}
                      </div>
                    )}
                    {s.officials.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        🏛️ Represented by:{' '}
                        {s.officials.map((name, i) => (
                          <button
                            key={name}
                            onClick={() => setOfficialFilter(officialFilter === name ? '' : name)}
                            className="text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            {name}{i < s.officials.length - 1 ? ', ' : ''}
                          </button>
                        ))}
                      </p>
                    )}
                    {s.title && <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.title}</p>}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 whitespace-pre-line">{s.body}</p>
                    {s.granted_uses.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.granted_uses.map((u) => (
                          <span key={u} className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {u}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Photo request — only for storytellers who agreed to follow-up contact */}
                    {s.email && s.granted_use_values.includes(CONTACT_USE) && (
                      <div className="mt-2">
                        <a
                          href={photoRequestMailto(s, campaignName)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          📷 Request a photo
                        </a>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function CampaignAnalytics({ analytics, campaignName }: CampaignAnalyticsProps) {
  if (analytics.kind === 'storytelling') {
    return <StorytellingAnalytics analytics={analytics} campaignName={campaignName} />;
  }

  const maxTopState = analytics.top_states.length > 0 ? analytics.top_states[0].count : 1;

  const deliveryEntries = Object.entries(analytics.delivery_breakdown).sort(
    (a, b) => b[1] - a[1]
  );
  const maxDelivery = deliveryEntries.length > 0 ? deliveryEntries[0][1] : 1;

  const maxOfficial = analytics.officials_contacted.length > 0 ? analytics.officials_contacted[0].count : 1;

  function formatDeliveryMethod(method: string): string {
    switch (method) {
      case 'email':
        return 'Email';
      case 'phone':
        return 'Phone Call';
      case 'form':
        return 'Web Form';
      case 'website':
        return 'Website';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  }

  return (
    <div className="space-y-8">
      {/* Stats cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Actions</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {analytics.total_actions.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {analytics.total_messages.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">States Reached</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {analytics.states_represented.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Officials Contacted</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {analytics.officials_contacted.length}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {analytics.avg_messages_per_action} msgs/participant
          </p>
        </div>
      </div>

      {/* Daily activity chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Daily Activity (Last 30 Days)
        </h3>
        <DailyBarChart counts={analytics.daily_counts} unit="action" />
      </div>

      {/* Officials contacted — where this campaign's pressure is landing */}
      {analytics.officials_contacted.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Officials Contacted</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Which lawmakers your campaign&rsquo;s messages went to — use this to see where pressure is landing and
            which offices to target next.
          </p>
          <div className="space-y-3">
            {analytics.officials_contacted.map(({ name, party, count }) => (
              <div key={name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                    {name}
                    {party && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${partyBadgeClass(party)}`}>
                        {party}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {count} message{count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-purple-500 dark:bg-purple-400 transition-all"
                    style={{ width: `${(count / maxOfficial) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top states and Delivery breakdown side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top states */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Top States
          </h3>
          {analytics.top_states.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.top_states.map(({ state, count }) => (
                <div key={state}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{state}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {count} action{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-500 dark:bg-purple-400 transition-all"
                      style={{ width: `${(count / maxTopState) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Delivery Methods
          </h3>
          {deliveryEntries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {deliveryEntries.map(([method, count]) => (
                <div key={method}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {formatDeliveryMethod(method)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {count} message{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 dark:bg-blue-400 transition-all"
                      style={{ width: `${(count / maxDelivery) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
