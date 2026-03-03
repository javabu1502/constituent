export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
        </div>
      </div>

      {/* Getting started checklist skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Representatives skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-1" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
