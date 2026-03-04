import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How Congress Votes and What It Means | My Democracy',
  description: 'Learn how voting works in the US Congress: roll call votes, voice votes, quorum requirements, and how to look up how your representative voted on any bill.',
  keywords: ['how congress votes', 'roll call vote', 'congressional voting', 'how does congress vote', 'voice vote', 'voting records congress', 'how my representative voted'],
  openGraph: {
    title: 'How Congress Votes and What It Means | My Democracy',
    description: 'Learn how voting works in Congress and how to find your representative\'s voting record.',
    type: 'article',
  },
};

export default function HowCongressVotesPage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How Congress Votes', href: '/guides/how-congress-votes' }]} />
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
          How Congress Votes and What It Means
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Congress uses several types of votes to make decisions. Understanding the difference between a voice vote and a roll call vote — and knowing how to find your representative&apos;s voting record — is key to holding your elected officials accountable.
          </p>

          {/* Types of Votes */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              Types of Votes in Congress
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Voice Vote</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The presiding officer asks members to say &quot;aye&quot; or &quot;no&quot; and judges the result by volume. No individual votes are recorded. Voice votes are commonly used for noncontroversial measures like naming post offices or approving routine procedural motions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Roll Call (Recorded) Vote</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Each member&apos;s vote is individually recorded. In the House, members vote electronically using a voting card. In the Senate, the clerk calls each senator&apos;s name and they respond from the floor. Roll call votes are required for final passage of most legislation and can be requested by any member. These are the votes you can look up on <a href="https://www.congress.gov/roll-call-votes" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a>.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Unanimous Consent</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The presiding officer asks if there is any objection to a proposal. If no one objects, it passes without a formal vote. This is used frequently in the Senate for procedural matters and scheduling. Any single senator can block a unanimous consent request.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Division Vote (Standing Vote)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Members stand to be counted for and against. The chair announces the count, but individual positions are not recorded. This is relatively rare and is sometimes used as an intermediate step before requesting a roll call.
                </p>
              </div>
            </div>
          </section>

          {/* Key Thresholds */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              Key Voting Thresholds
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Simple majority</strong>: Most legislation passes with a majority of those present and voting (not necessarily a majority of all members).</li>
                <li><strong className="text-gray-900 dark:text-white">Three-fifths (60 votes in the Senate)</strong>: Required to invoke cloture and end a filibuster. This effectively means most Senate legislation needs 60 votes to advance.</li>
                <li><strong className="text-gray-900 dark:text-white">Two-thirds</strong>: Required to override a presidential veto, propose constitutional amendments, convict in impeachment trials, and expel a member.</li>
                <li><strong className="text-gray-900 dark:text-white">Quorum</strong>: A majority of members must be present for official business. In the House, that means 218 of 435 members; in the Senate, 51 of 100.</li>
              </ul>
            </div>
          </section>

          {/* How to Look Up Votes */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              How to Look Up Voting Records
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Several free resources let you see exactly how your representative voted:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">My Democracy</strong>: Visit the <Link href="/vote" className="text-purple-600 dark:text-purple-400 hover:underline">voting records page</Link> or any <Link href="/legislators" className="text-purple-600 dark:text-purple-400 hover:underline">legislator profile</Link> to see recent votes.</li>
                <li><strong className="text-gray-900 dark:text-white">Congress.gov</strong>: The official source for all <a href="https://www.congress.gov/roll-call-votes" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">roll call votes</a>, searchable by date, bill, or member.</li>
                <li><strong className="text-gray-900 dark:text-white">Senate.gov and Clerk.house.gov</strong>: Each chamber publishes its own vote records.</li>
              </ul>
            </div>
          </section>

          {/* What "Not Voting" Means */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Understanding &quot;Not Voting&quot; and &quot;Present&quot;
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                When you see a member listed as &quot;Not Voting,&quot; it can mean several things: they were absent due to illness or travel, they had a conflict of interest, or they chose to abstain. Members can also vote &quot;Present&quot; — which counts for quorum purposes but not as a vote for or against.
              </p>
              <p>
                A pattern of missed votes can be significant. If your representative has a high rate of missed votes, that may be worth asking about through <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">direct contact</Link> or at a <Link href="/guides/how-to-attend-a-town-hall" className="text-purple-600 dark:text-purple-400 hover:underline">town hall</Link>.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">How a Bill Becomes Law</Link></li>
              <li><Link href="/guides/what-does-my-congressman-do" className="text-purple-600 dark:text-purple-400 hover:underline">What Does My Congressman Actually Do?</Link></li>
              <li><Link href="/guides/how-to-track-legislation" className="text-purple-600 dark:text-purple-400 hover:underline">How to Track Legislation</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">See how your representatives voted</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Look up recent votes and hold your elected officials accountable.</p>
          <Link href="/vote" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            View Voting Records
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
