export default function NewsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 max-w-full animate-pulse" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 mb-6 animate-pulse">
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-600 rounded-md" />
        <div className="h-9 w-24 bg-transparent rounded-md" />
        <div className="h-9 w-24 bg-transparent rounded-md" />
      </div>

      {/* News cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
