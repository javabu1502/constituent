import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">404</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/contact"
          className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Contact your reps
        </Link>
      </div>
    </div>
  );
}
