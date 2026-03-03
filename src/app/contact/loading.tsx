export default function ContactLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-pulse">
          {/* Progress bar skeleton */}
          <div className="h-1 bg-gray-200 dark:bg-gray-700" />

          <div className="p-6 sm:p-8">
            {/* Step header skeleton */}
            <div className="text-center mb-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto" />
            </div>

            {/* Address field skeleton */}
            <div className="mb-5">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>

            {/* Button skeleton */}
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
