export default function CampaignsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 max-w-full animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse" />
      </div>

      {/* Filter chips skeleton */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
        ))}
      </div>

      {/* Campaign cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
            <div className="flex items-center gap-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
