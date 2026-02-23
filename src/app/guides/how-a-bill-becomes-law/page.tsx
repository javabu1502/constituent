import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How a Bill Becomes Law | My Democracy',
  description: 'Understand the legislative process at federal and state levels. Learn how to track bills through Congress and state legislatures.',
  keywords: ['how a bill becomes law', 'legislative process', 'congress', 'state legislature', 'track bills', 'civics'],
  openGraph: {
    title: 'How a Bill Becomes Law | My Democracy',
    description: 'Understand the legislative process at federal and state levels. Learn how to track bills through Congress and state legislatures.',
    type: 'article',
    url: 'https://mydemocracy.app/guides/how-a-bill-becomes-law',
  },
};

export default function BillBecomesLawGuidePage() {
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
          How a Bill Becomes Law
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Understanding the legislative process helps you know when and how to make your voice heard. Here&apos;s how laws are made at both federal and state levels.
          </p>

          {/* Federal Legislative Process */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              The Federal Process
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Introduction</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  A bill is introduced by a member of Congress. In the House, it&apos;s dropped in the &quot;hopper.&quot; In the Senate, it&apos;s presented on the floor. The bill gets a number (HR for House, S for Senate) and is referred to committee.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Committee Review</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">This is where most bills die.</strong> The committee with jurisdiction holds hearings, debates, and may &quot;mark up&quot; (amend) the bill. If approved, it moves forward. If not, it stalls.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm italic">
                  Advocacy tip: Contact committee members before hearings. This is your highest-impact moment.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Floor Debate & Vote</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Bills that pass committee go to the full chamber for debate and voting. In the House, debate is limited. In the Senate, unlimited debate can lead to filibusters requiring 60 votes to overcome.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. The Other Chamber</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  If passed, the bill goes to the other chamber and repeats the process. Both chambers must pass identical text.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">5. Conference Committee</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  If the House and Senate pass different versions, a conference committee reconciles differences. Both chambers then vote on the final version.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">6. Presidential Action</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The President can sign the bill (becomes law), veto it (returns to Congress), or take no action. If Congress is in session and the President doesn&apos;t sign within 10 days, it becomes law. If Congress adjourns, it&apos;s a &quot;pocket veto.&quot;
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">7. Veto Override</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Congress can override a veto with a 2/3 majority in both chambers — rare but possible.
                </p>
              </div>
            </div>
          </section>

          {/* Visual Summary */}
          <section className="mb-10">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">Federal Process Summary</h3>
              <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Bill Introduced</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Committee</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Floor Vote</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Other Chamber</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Conference</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">President</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-medium">Law</span>
              </div>
            </div>
          </section>

          {/* State Legislative Process */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </span>
              The State Process
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                State legislatures follow a similar process, but with important differences:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Shorter sessions</strong> — Many state legislatures meet only part of the year. Bills must pass quickly or die.</li>
                <li><strong className="text-gray-900 dark:text-white">Fewer procedural hurdles</strong> — No filibuster in most states. Bills move faster.</li>
                <li><strong className="text-gray-900 dark:text-white">More accessible</strong> — Public testimony is common. You can directly address legislators.</li>
                <li><strong className="text-gray-900 dark:text-white">Governor action</strong> — Like the President, governors can sign, veto, or in some states, line-item veto specific provisions.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Nebraska is unique:</strong> It has a unicameral (single-chamber) legislature, so bills only need to pass once.
              </p>
            </div>
          </section>

          {/* When to Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              When to Contact Your Representatives
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Your advocacy has the most impact at these moments:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Before committee hearings</strong> — When the bill is being debated and can be amended</li>
                <li><strong className="text-gray-900 dark:text-white">Before floor votes</strong> — When legislators are finalizing their positions</li>
                <li><strong className="text-gray-900 dark:text-white">During conference</strong> — When differences are being reconciled</li>
                <li><strong className="text-gray-900 dark:text-white">Before the President/Governor acts</strong> — To encourage signature or veto</li>
              </ul>
              <p>
                Even if you miss these windows, contact still matters. Offices track constituent sentiment over time, and your message helps shape future votes.
              </p>
            </div>
          </section>

          {/* Track Legislation */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Track Legislation
            </h2>
            <div className="pl-10 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Federal Bills</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Congress.gov</a> — The official source for federal legislation. Search by bill number, keyword, or sponsor. Track status, read full text, and see voting records.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">State Bills</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <a href="https://openstates.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Open States</a> — Free, searchable database covering all 50 state legislatures. Track bills, see voting records, and find your legislators.
                </p>
              </div>
            </div>
          </section>

          {/* Key Terms */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              Key Terms
            </h2>
            <div className="pl-10">
              <dl className="space-y-3 text-gray-600 dark:text-gray-300">
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Co-sponsor</dt>
                  <dd>A legislator who formally supports a bill. More co-sponsors signal broader support.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Mark up</dt>
                  <dd>When a committee amends a bill. This is when significant changes happen.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Filibuster</dt>
                  <dd>Extended debate in the Senate to delay or block a vote. Requires 60 votes to end.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Cloture</dt>
                  <dd>A vote to end debate and proceed to a final vote. Requires 60 votes in the Senate.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Reconciliation</dt>
                  <dd>A special budget process that bypasses the filibuster, requiring only 51 votes.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Omnibus</dt>
                  <dd>A large bill combining multiple measures, often used for must-pass legislation.</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your Congressman
                </Link>
              </li>
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
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to influence the process?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find your representatives and let them know where you stand.
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
