import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Track Legislation | Bills, Votes & Committees | My Democracy',
  description: 'Learn how to track bills in Congress and your state legislature. Tools, resources, and strategies for staying on top of legislation that affects you.',
  keywords: ['track legislation', 'track bills', 'Congress.gov', 'bill tracking', 'how to follow a bill', 'state legislature bills', 'committee hearings', 'legislative tracker'],
  openGraph: {
    title: 'How to Track Legislation | Bills, Votes & Committees | My Democracy',
    description: 'Learn how to track bills in Congress and your state legislature with free tools and strategies.',
    type: 'article',
  },
};

export default function TrackLegislationGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How to Track Legislation', href: '/guides/how-to-track-legislation' }]} />
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/guides" className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Guides
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          How to Track Legislation
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Thousands of bills are introduced each year in Congress and state legislatures. Knowing how to track the ones that matter to you is essential for effective advocacy. Here are the best free tools and strategies.
          </p>

          {/* Federal Bills */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Tracking Federal Bills
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Congress.gov (Official Source)</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a> is the official website of the Library of Congress. It provides the most authoritative and complete information on federal legislation.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>Search by keyword, bill number, or sponsor</li>
                  <li>Track a bill&apos;s status through the legislative process</li>
                  <li>Read full bill text, summaries, and committee reports</li>
                  <li>View roll call votes and see how your representative voted</li>
                  <li>Set up email alerts for specific bills or topics</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">GovTrack.us</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <a href="https://www.govtrack.us/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">GovTrack</a> makes Congressional data more accessible with visualizations, prognosis scores (likelihood a bill will pass), and email tracking alerts.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">ProPublica Congress API</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <a href="https://projects.propublica.org/represent/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">ProPublica Represent</a> tracks votes, statements, and bill sponsorship with an emphasis on accountability journalism.
                </p>
              </div>
            </div>
          </section>

          {/* State Bills */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </span>
              Tracking State Legislation
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Open States</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <a href="https://openstates.org/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Open States</a> is the best free resource for tracking state legislation across all 50 states. Search bills by keyword, state, or topic. View bill text, sponsor information, and committee referrals.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your State Legislature&apos;s Website</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Every state legislature has an official website with bill search, committee schedules, and session calendars. Visit your <Link href="/states" className="text-purple-600 dark:text-purple-400 hover:underline">state&apos;s page on My Democracy</Link> for direct links.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Public Comment Systems</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Many states have online systems where you can submit testimony, register your position on bills, and request to testify at hearings. Nevada&apos;s NELIS system and Oregon&apos;s OLIS are examples. Check your state&apos;s page for details.
                </p>
              </div>
            </div>
          </section>

          {/* Understanding the Process */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
              Key Stages to Watch
            </h2>
            <div className="pl-10 space-y-4 text-gray-600 dark:text-gray-300">
              <p>A bill passes through several stages. Knowing where a bill is tells you when and how to act:</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Introduction</p>
                    <p className="text-sm">A bill is filed by a sponsor. This is a good time to contact your rep to co-sponsor if you support it, or to express early opposition.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Committee</p>
                    <p className="text-sm">Most bills die in committee. If you care about a bill, contacting committee members is critical at this stage. Public hearings may be held.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Floor Vote</p>
                    <p className="text-sm">The bill reaches the full chamber for debate and vote. This is the highest-impact moment for constituent contact. Call before the vote.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">4</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Conference / Reconciliation</p>
                    <p className="text-sm">If the House and Senate pass different versions, a conference committee reconciles them. Contact can still influence the final language.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">5</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Presidential Action</p>
                    <p className="text-sm">The President can sign or veto. Contact the White House at <a href="https://www.whitehouse.gov/contact/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">whitehouse.gov/contact</a>.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Strategies */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Effective Tracking Strategies
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Set up alerts</strong>: Use Congress.gov email alerts or GovTrack to get notified when your bill moves.</li>
                <li><strong className="text-gray-900 dark:text-white">Follow committees</strong>: If your issue is in a specific committee, track that committee&apos;s schedule and hearings.</li>
                <li><strong className="text-gray-900 dark:text-white">Follow advocacy organizations</strong>: Groups that work on your issue will alert you when action is needed. Check our <Link href="/states" className="text-purple-600 dark:text-purple-400 hover:underline">state pages</Link> for organizations by issue area.</li>
                <li><strong className="text-gray-900 dark:text-white">Check voting records</strong>: After a vote, check how your representatives voted. The <Link href="/legislators" className="text-purple-600 dark:text-purple-400 hover:underline">My Democracy legislator profiles</Link> show recent votes.</li>
                <li><strong className="text-gray-900 dark:text-white">Act at the right time</strong>: Contact during committee markup or right before floor votes has the most impact.</li>
              </ul>
            </div>
          </section>

          {/* Related */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">How a Bill Becomes Law</Link></li>
              <li><Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">How to Contact Your Congressman</Link></li>
              <li><Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">Write an Effective Letter to Congress</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Found a bill you care about?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Contact your representatives and tell them your position.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Contact Your Reps
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guides" className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            All Guides
          </Link>
        </div>
      </div>
    </div>
  );
}
