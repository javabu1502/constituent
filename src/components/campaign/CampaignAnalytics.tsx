'use client';

interface AdvocacyAnalytics {
  kind: 'advocacy';
  total_actions: number;
  total_messages: number;
  states_represented: string[];
  daily_counts: Record<string, number>;
  delivery_breakdown: Record<string, number>;
  top_states: Array<{ state: string; count: number }>;
  avg_messages_per_action: number;
}

interface StoryListItem {
  id: string;
  created_at: string;
  attribution_level: 'named' | 'first_name_only' | 'anonymous';
  display_name: string; // "Anonymous" for anonymous rows
  title: string | null;
  preview: string;
  revoked: boolean;
  edited_at: string | null;
}

interface StoryAnalytics {
  kind: 'storytelling';
  total_stories: number;
  subjects: Array<{ title: string; created_at: string }>;
  stories: StoryListItem[];
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

function StorytellingAnalytics({ analytics }: { analytics: StoryAnalytics }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 max-w-xs">
        <p className="text-sm text-gray-500 dark:text-gray-400">Stories Shared</p>
        <p className="text-4xl font-bold text-gray-900 dark:text-white mt-1">{analytics.total_stories.toLocaleString()}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Including anonymous</p>
      </div>

      {/* Saved stories + export */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Stories</h3>
          {analytics.stories.length > 0 && (
            <a
              href={`/api/campaigns/${analytics.campaign_slug}/stories/export`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
            >
              Download CSV
            </a>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Stories storytellers shared with your campaign. Anonymous stories show no name or contact details.
          Storytellers can change or revoke their story at any time — changes are flagged, and revoked stories are
          hidden and excluded from the CSV.
        </p>
        {analytics.stories.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No stories yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {analytics.stories.map((s) => (
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
                    The storyteller revoked this story — please don’t use it.
                  </p>
                ) : (
                  <>
                    {s.title && <p className="text-sm text-gray-800 dark:text-gray-200">{s.title}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{s.preview}</p>
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
    return <StorytellingAnalytics analytics={analytics} />;
  }
  // Generate all 30 dates for the chart
  const today = new Date();
  const dailyDates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dailyDates.push(d.toISOString().split('T')[0]);
  }

  const dailyValues = dailyDates.map((date) => analytics.daily_counts[date] || 0);
  const maxDaily = Math.max(...dailyValues, 1);

  const maxTopState = analytics.top_states.length > 0 ? analytics.top_states[0].count : 1;

  const deliveryEntries = Object.entries(analytics.delivery_breakdown).sort(
    (a, b) => b[1] - a[1]
  );
  const maxDelivery = deliveryEntries.length > 0 ? deliveryEntries[0][1] : 1;

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
          <p className="text-sm text-gray-500 dark:text-gray-400">Unique States</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {analytics.states_represented.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Msgs/Participant</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {analytics.avg_messages_per_action}
          </p>
        </div>
      </div>

      {/* Daily activity chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Daily Activity (Last 30 Days)
        </h3>
        <div className="flex items-end gap-[2px] h-40">
          {dailyDates.map((date, i) => {
            const count = dailyValues[i];
            const heightPct = (count / maxDaily) * 100;
            const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            return (
              <div
                key={date}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                <div
                  className="w-full bg-purple-500 dark:bg-purple-400 rounded-t-sm transition-all hover:bg-purple-600 dark:hover:bg-purple-300"
                  style={{
                    height: count > 0 ? `${Math.max(heightPct, 4)}%` : '0%',
                    minHeight: count > 0 ? '2px' : '0px',
                  }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                    {formattedDate}: {count} action{count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
          <span>
            {new Date(dailyDates[0] + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span>
            {new Date(dailyDates[dailyDates.length - 1] + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

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
