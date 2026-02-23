import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Contact Your Congressman | My Democracy',
  description: 'Step-by-step guide to contacting your US Representatives and Senators by phone, email, and letter. Learn which methods are most effective.',
  keywords: ['contact congressman', 'contact senator', 'call congress', 'email representative', 'write to congress', 'congressional office'],
  openGraph: {
    title: 'How to Contact Your Congressman | My Democracy',
    description: 'Step-by-step guide to contacting your US Representatives and Senators by phone, email, and letter. Learn which methods are most effective.',
    type: 'article',
    url: 'https://mydemocracy.app/guides/how-to-contact-your-congressman',
  },
};

export default function ContactCongressmanGuidePage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Guides
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          How to Contact Your Congressman
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Every American has three members of Congress: two US Senators representing your state and one US Representative for your district. Here&apos;s how to reach them effectively.
          </p>

          {/* Who Represents You */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Who Represents You?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                <strong className="text-gray-900 dark:text-white">US Senators (2)</strong> — Represent your entire state. Serve 6-year terms. Vote on federal legislation, confirm presidential appointments, and ratify treaties.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">US Representative (1)</strong> — Represents your congressional district. Serves 2-year terms. Votes on federal legislation and controls the federal budget.
              </p>
              <p>
                Not sure who represents you? <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline">Enter your address</Link> to find out instantly.
              </p>
            </div>
          </section>

          {/* Contact Methods */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              Contact Methods (Most to Least Effective)
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Phone Calls</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  The most effective way to contact Congress. A staff member answers, logs your position, and passes it to the legislator. During important votes, offices track call volume closely.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>Call the DC office for federal issues</li>
                  <li>Call district offices for local concerns</li>
                  <li>Expect to speak for 1-2 minutes</li>
                  <li>State your name, address, and position clearly</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Personalized Emails</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Emails written in your own words carry more weight than form letters. Congressional offices can tell the difference and prioritize original messages.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>Use the contact form on the official website</li>
                  <li>Include your full address (they verify constituents)</li>
                  <li>Be specific about the issue and your ask</li>
                  <li>Share a personal story if relevant</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Physical Letters</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Handwritten or typed letters demonstrate serious commitment. However, mail to Congress is screened for security and may be delayed.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>Send to the district office for faster delivery</li>
                  <li>DC mail undergoes irradiation and delays</li>
                  <li>Keep it to one page</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. In-Person Meetings</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Request a meeting through the scheduler. You&apos;ll likely meet with a staff member, which is valuable — they brief the legislator and often specialize in your issue area.
                </p>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Best Practices
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Be a constituent</strong> — Only contact your own representatives. They won&apos;t respond to non-constituents.</li>
                <li><strong className="text-gray-900 dark:text-white">Be specific</strong> — Reference bill numbers, ask for specific votes, name the issue clearly.</li>
                <li><strong className="text-gray-900 dark:text-white">Be brief</strong> — Staff handle hundreds of contacts daily. Get to the point.</li>
                <li><strong className="text-gray-900 dark:text-white">Be respectful</strong> — Even when frustrated. Rudeness gets you flagged and ignored.</li>
                <li><strong className="text-gray-900 dark:text-white">Share your story</strong> — Personal experiences are more persuasive than statistics. <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">Learn how</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Follow up</strong> — Multiple contacts on the same issue show sustained interest.</li>
              </ul>
            </div>
          </section>

          {/* What Happens to Your Message */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              What Happens to Your Message
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Congressional offices track and tally every constituent contact:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Staff logs your message by issue and position (support/oppose)</li>
                <li>Data is compiled into daily and weekly reports</li>
                <li>The legislator reviews constituent sentiment before key votes</li>
                <li>Compelling stories may be shared directly with the member</li>
              </ol>
              <p>
                Your message counts even if you don&apos;t get a personalized response. The numbers matter.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/how-to-contact-your-state-legislators" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your State Legislators
                </Link>
              </li>
              <li>
                <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Write an Effective Letter to Congress
                </Link>
              </li>
              <li>
                <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Tell Your Story: Make Your Message Stand Out
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to contact Congress?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find your representatives and send a personalized message in minutes.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Your Reps
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Back to Guides */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Guides
          </Link>
        </div>
      </div>
    </div>
  );
}
