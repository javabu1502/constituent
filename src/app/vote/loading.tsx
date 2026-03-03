export default function VoteLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 max-w-full animate-pulse" />
      </div>

      {/* State selector skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-1" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-64" />
      </div>

      {/* Empty state skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center animate-pulse">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto" />
      </div>
    </div>
  );
}
