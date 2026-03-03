export default function LegislatorsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 max-w-full animate-pulse" />
      </div>

      {/* Tab toggle skeleton */}
      <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 mb-6 w-fit animate-pulse">
        <div className="h-9 w-36 bg-gray-200 dark:bg-gray-600 rounded-md" />
        <div className="h-9 w-32 bg-transparent rounded-md" />
      </div>

      {/* State selector skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-64" />
      </div>

      {/* State grid skeleton */}
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
