import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | My Democracy',
  description: 'Learn how My Democracy helps you contact your elected representatives with AI-assisted messaging. Free, private, and easy to use.',
};

export default function AboutPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-10">
          About My Democracy
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          {/* What It Does Today */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What It Does Today
            </h2>
            <div className="space-y-6 text-gray-600 dark:text-gray-300 pl-10">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Your Representatives</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="text-gray-900 dark:text-white">Find all your elected officials</strong> — federal, state, and local — from one address lookup
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Write personalized messages with AI assistance</strong> — emails or phone scripts — that you review and edit before sending
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Contact via email or phone</strong> — send emails directly or call with an AI-generated script
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Personalized Dashboard</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="text-gray-900 dark:text-white">Activity feed</strong> — see your message history and engagement at a glance
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Voting records</strong> — track how your representatives vote on legislation
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Campaign finance</strong> — follow the money behind your representatives
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Lobbying activity</strong> — see who&apos;s lobbying your representatives
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">AI-generated bios</strong> — understand your representatives&apos; backgrounds and priorities
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Committee assignments</strong> — know where your reps have influence
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Bill tracking with AI summaries</strong> — follow legislation that matters to you
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Per-representative news</strong> — stay informed about what your reps are doing
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Civic Tools</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="text-gray-900 dark:text-white">Campaigns</strong> — create shareable issue campaigns to rally others
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Voter information</strong> — find your polling place and registration status
                  </li>
                  <li>
                    <strong className="text-gray-900 dark:text-white">Trending issues</strong> — see what topics people are contacting their reps about
                  </li>
                </ul>
              </div>
              <div>
                <p>
                  <strong className="text-gray-900 dark:text-white">Privacy-forward:</strong> your data is stored securely, never sold, and deletion is available anytime.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              How It Works
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <strong className="text-gray-900 dark:text-white">Enter your address</strong> — we find your federal, state, and local representatives
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Tell us what you care about</strong> — AI writes personalized messages for each representative
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Reach out</strong> — send an email or make a call
                </li>
              </ol>
            </div>
          </section>

          {/* Why It Matters */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why It Matters
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-gray-900 dark:text-white">Congressional offices track and tally every constituent contact</strong> — emails, calls, everything
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Personalized messages carry more weight</strong> than form letters or scripts
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Your representatives work for you</strong> — but only if they hear from you
                </li>
              </ul>
            </div>
          </section>

          {/* What Makes This Different */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </span>
              What Makes This Different
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-gray-900 dark:text-white">Not a form letter</strong> — every message is unique, written by AI based on your words
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Federal, state, AND local</strong> — contact all your representatives from one place
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Every contact counts</strong> — congressional offices tally every constituent message
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Your personal story matters most</strong> — real constituent stories are what move legislators to act
                </li>
              </ul>
            </div>
          </section>

          {/* What's Coming */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
              What&apos;s Next
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-gray-900 dark:text-white">Direct delivery to congressional inboxes</strong> via the official CWC API (application pending)
                </li>
              </ul>
            </div>
          </section>

          {/* Built By */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Built By
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                <strong className="text-gray-900 dark:text-white">My Democracy LLC</strong>, based in Reno, Nevada
              </p>
              <p>
                Questions? Contact{' '}
                <a href="mailto:info@mydemocracy.app" className="text-purple-600 dark:text-purple-400 hover:underline">
                  info@mydemocracy.app
                </a>
              </p>
            </div>
          </section>

          {/* Support the Project */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              Support the Project
            </h2>
            <div className="pl-10">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                My Democracy is a passion project. If you find it useful, consider supporting its development.
              </p>
              <a
                href="https://buymeacoffee.com/mydemocracy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFDD00] hover:bg-[#e6c800] text-gray-900 font-semibold rounded-lg transition-colors shadow-sm"
              >
                <span className="text-xl">☕</span>
                Support My Democracy
              </a>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
