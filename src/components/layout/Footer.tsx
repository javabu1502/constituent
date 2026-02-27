import Link from 'next/link';
import { BRAND } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {BRAND.name} &copy; {currentYear}
          </span>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Terms
            </Link>
            <Link href="/vote" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Vote
            </Link>
            <Link href="/contact" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Contact Your Reps
            </Link>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          {BRAND.description}
        </div>
      </div>
    </footer>
  );
}
