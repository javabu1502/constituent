'use client';

interface CampaignAnalyticsProps {
  analytics: {
    total_actions: number;
    total_messages: number;
    states_represented: string[];
    daily_counts: Record<string, number>;
    delivery_breakdown: Record<string, number>;
    top_states: Array<{ state: string; count: number }>;
    avg_messages_per_action: number;
  };
  campaignName: string;
}

export function CampaignAnalytics({ analytics, campaignName }: CampaignAnalyticsProps) {
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
