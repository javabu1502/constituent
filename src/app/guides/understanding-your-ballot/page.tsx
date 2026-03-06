import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Understanding Your Ballot | My Democracy',
  description: 'Learn how to read and understand your election ballot. Types of races, ballot measures, judicial retentions, and how to research candidates before you vote.',
  keywords: ['understanding ballot', 'how to read a ballot', 'ballot measures', 'sample ballot', 'what is on my ballot', 'ballot propositions', 'election ballot guide'],
  openGraph: {
    title: 'Understanding Your Ballot | My Democracy',
    description: 'Learn how to read and understand your election ballot so you can vote with confidence.',
    type: 'article',
  },
};

export default function UnderstandingYourBallotPage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Understanding Your Ballot', href: '/guides/understanding-your-ballot' }]} />
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
          Understanding Your Ballot
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Your ballot contains more than just the big races. From local judges to statewide ballot measures, each item affects your community. Here&apos;s how to understand every part of your ballot so you can vote with confidence.
          </p>

          {/* Types of Races */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Types of Races on Your Ballot
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Federal Offices</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  President (every four years), US Senate (six-year terms, staggered), and US House of Representatives (every two years). These appear at the top of most ballots.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">State Offices</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Governor, state legislators, attorney general, secretary of state, and other statewide officers. Terms and election cycles vary by state. Check your <Link href="/states" className="text-purple-600 dark:text-purple-400 hover:underline">state&apos;s page</Link> for details.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Local Offices</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  City council, mayor, county commissioners, school board, sheriff, and other local positions. These officials make decisions that directly affect your daily life — from property taxes to school curricula to local policing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Judicial Races</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Many states elect judges at the state and local level. Some use &quot;retention elections&quot; where you vote yes or no on whether to keep a sitting judge. Others have contested judicial elections with multiple candidates. Research judicial candidates through your state or local bar association.
                </p>
              </div>
            </div>
          </section>

          {/* Ballot Measures */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Ballot Measures and Propositions
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Ballot measures let voters decide on specific policy questions directly. They may appear as propositions, initiatives, referendums, or constitutional amendments depending on your state. Common topics include tax changes, bond issues, minimum wage, and criminal justice reform.
              </p>
              <p>
                Ballot measure language can be confusing. A &quot;yes&quot; vote doesn&apos;t always mean what you might expect — some measures are worded so that &quot;yes&quot; repeals an existing law. Always read the full summary and any official voter guide provided by your state. <a href="https://ballotpedia.org/ballot_measures" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Ballotpedia</a> provides plain-language explanations and analysis of ballot measures across all states.
              </p>
            </div>
          </section>

          {/* How to Research */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              How to Research Before You Vote
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Get your sample ballot</strong>: Most states let you preview your exact ballot online through your county election office website or <a href="https://www.vote.org/sample-ballot/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Vote.org</a>.</li>
                <li><strong className="text-gray-900 dark:text-white">Use nonpartisan voter guides</strong>: <a href="https://ballotpedia.org/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Ballotpedia</a> and <a href="https://www.vote411.org/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Vote411.org</a> (from the League of Women Voters) offer candidate questionnaires and race previews.</li>
                <li><strong className="text-gray-900 dark:text-white">Read official voter pamphlets</strong>: Many states mail voter guides with arguments for and against each ballot measure. These are also available online through your secretary of state&apos;s website.</li>
                <li><strong className="text-gray-900 dark:text-white">Check voting records for incumbents</strong>: Use the <Link href="/vote" className="text-purple-600 dark:text-purple-400 hover:underline">My Democracy voting records page</Link> to see how current officeholders have voted.</li>
              </ul>
            </div>
          </section>

          {/* Tips for Voting Day */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Tips for Voting Day
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Bring notes</strong>: In most states, you can bring a printed or handwritten list of your choices into the voting booth. You cannot bring a phone in some jurisdictions — check your state rules.</li>
                <li><strong className="text-gray-900 dark:text-white">It&apos;s OK to leave items blank</strong>: You don&apos;t have to vote on every race. Skipping a race does not invalidate your other votes.</li>
                <li><strong className="text-gray-900 dark:text-white">Ask for help</strong>: Poll workers can explain how to use the voting equipment. They cannot tell you who to vote for, but they can help with the process.</li>
                <li><strong className="text-gray-900 dark:text-white">Know your rights</strong>: If the polls close while you&apos;re still in line, you have the right to vote. If your name isn&apos;t on the rolls, you can cast a provisional ballot.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">How to Register to Vote</Link></li>
              <li><Link href="/guides/how-to-vote-in-a-primary-election" className="text-purple-600 dark:text-purple-400 hover:underline">How to Vote in a Primary Election</Link></li>
              <li><Link href="/guides/who-are-my-representatives" className="text-purple-600 dark:text-purple-400 hover:underline">Who Are My Elected Officials?</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ready to research your ballot?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Find your officials and see their voting records.</p>
          <Link href="/legislators" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Find Your Officials
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
