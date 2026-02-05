import Link from 'next/link';
import { BRAND } from '@/lib/constants';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-semibold text-xl text-gray-900">
              {BRAND.name}
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/contact"
              className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors"
            >
              Contact Officials
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors"
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
