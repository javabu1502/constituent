import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-semibold text-xl text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            {BRAND.name}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/contact"
              className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Contact Your Reps
            </Link>
            <Link
              href="/news"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              News
            </Link>
            <Link
              href="/trends"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Trends
            </Link>
            <Link
              href="/vote"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Vote
            </Link>
            <Link
              href="/guides"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Guides
            </Link>
            <Link
              href="/regulations"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Regulations
            </Link>
            <Link
              href="/campaigns"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Campaigns
            </Link>
            <UserMenu user={user} />
          </nav>

          {/* Mobile hamburger */}
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}
