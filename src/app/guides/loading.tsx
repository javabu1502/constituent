export default function GuidesLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 max-w-full animate-pulse" />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 mb-8 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-10 bg-gray-200 dark:bg-gray-700 rounded-full"
            style={{ width: `${60 + i * 16}px` }}
          />
        ))}
      </div>

      {/* Guide cards grid */}
      <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
