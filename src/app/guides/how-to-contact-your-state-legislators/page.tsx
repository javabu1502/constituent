import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Contact Your State Legislators | My Democracy',
  description: 'Learn how to find and contact your state senators and representatives. Discover why state-level advocacy is often more effective than federal.',
  keywords: ['state legislature', 'state senator', 'state representative', 'contact state government', 'state advocacy', 'local politics'],
  openGraph: {
    title: 'How to Contact Your State Legislators | My Democracy',
    description: 'Learn how to find and contact your state senators and representatives. Discover why state-level advocacy is often more effective than federal.',
    type: 'article',
    url: 'https://mydemocracy.app/guides/how-to-contact-your-state-legislators',
  },
};

export default function ContactStateLegislatorsGuidePage() {
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
          How to Contact Your State Legislators
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            While Congress gets most of the attention, your state legislators often have more direct impact on your daily life. Here&apos;s how to find them and make your voice heard at the state level.
          </p>

          {/* Why State Government Matters */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why State Government Matters
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>State legislatures control policies that directly affect your life:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Education</strong> — School funding, curriculum standards, higher education</li>
                <li><strong className="text-gray-900 dark:text-white">Healthcare</strong> — Medicaid expansion, insurance regulations, public health</li>
                <li><strong className="text-gray-900 dark:text-white">Criminal Justice</strong> — Sentencing, policing, prison reform</li>
                <li><strong className="text-gray-900 dark:text-white">Environment</strong> — Land use, water rights, state environmental regulations</li>
                <li><strong className="text-gray-900 dark:text-white">Elections</strong> — Voting access, redistricting, election administration</li>
                <li><strong className="text-gray-900 dark:text-white">Taxes</strong> — Income tax, sales tax, property tax</li>
                <li><strong className="text-gray-900 dark:text-white">Infrastructure</strong> — Roads, public transit, utilities</li>
              </ul>
            </div>
          </section>

          {/* Your State Representatives */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Your State Representatives
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>Most states have a bicameral legislature (like Congress):</p>
              <p>
                <strong className="text-gray-900 dark:text-white">State Senator</strong> — Represents a larger district, typically serves 4-year terms. Your state senate district usually contains multiple house districts.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">State Representative / Assembly Member</strong> — Represents a smaller district, typically serves 2-year terms. Titles vary by state (Representative, Delegate, Assembly Member).
              </p>
              <p className="text-sm italic">
                Note: Nebraska has a unicameral legislature with only senators. Some states have different structures.
              </p>
            </div>
          </section>

          {/* Why State Advocacy Is Often More Effective */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Why State Advocacy Is Often More Effective
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Smaller constituencies</strong> — Your state rep may represent 50,000 people vs. 760,000 for a US House member. Your voice carries more weight.</li>
                <li><strong className="text-gray-900 dark:text-white">Less competition for attention</strong> — State offices receive far fewer contacts than Congressional offices.</li>
                <li><strong className="text-gray-900 dark:text-white">More accessible</strong> — State legislators often have direct email, answer their own phones, and hold local office hours.</li>
                <li><strong className="text-gray-900 dark:text-white">Faster action</strong> — State legislatures can move quickly on issues. Policies can change in a single session.</li>
                <li><strong className="text-gray-900 dark:text-white">Testing ground</strong> — Many federal policies started as state experiments. State action can drive national change.</li>
              </ul>
            </div>
          </section>

          {/* How to Find Your State Legislators */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              How to Find Your State Legislators
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Use My Democracy</Link> — Enter your address and we&apos;ll find all your representatives, federal and state, in one lookup.
              </p>
              <p>
                You can also use <a href="https://openstates.org/find_your_legislator/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Open States</a> or your state legislature&apos;s official website.
              </p>
            </div>
          </section>

          {/* Contact Methods */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              How to Contact Them
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                <strong className="text-gray-900 dark:text-white">Email</strong> — Most state legislators list a direct email address. Unlike Congress, you&apos;re often emailing them personally, not a webform that goes to staff.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Phone</strong> — Call their capitol office during session or district office year-round. Many answer their own phones.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">In-Person</strong> — Attend town halls, legislative hearings, or request a meeting. State legislators are far more accessible than members of Congress.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Testify</strong> — Many state legislatures allow public testimony on bills. This is direct democracy in action.
              </p>
            </div>
          </section>

          {/* Tips for State Advocacy */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              Tips for Effective State Advocacy
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Know the bill number</strong> — State bills are tracked by number (e.g., HB 123, SB 456). Be specific.</li>
                <li><strong className="text-gray-900 dark:text-white">Time it right</strong> — Contact before committee hearings or floor votes for maximum impact.</li>
                <li><strong className="text-gray-900 dark:text-white">Build relationships</strong> — State legislators remember constituents who engage consistently.</li>
                <li><strong className="text-gray-900 dark:text-white">Attend hearings</strong> — Your physical presence matters, even if you don&apos;t testify.</li>
                <li><strong className="text-gray-900 dark:text-white">Connect local</strong> — Explain how state policy affects your community specifically.</li>
              </ul>
            </div>
          </section>

          {/* Track State Bills */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              Track State Legislation
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                <a href="https://openstates.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Open States</a> — Free, searchable database of state legislation across all 50 states. Track bills, see voting records, and find your legislators.
              </p>
              <p>
                Learn more about the legislative process in our <Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">How a Bill Becomes Law</Link> guide.
              </p>
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
                <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Write an Effective Letter to Congress
                </Link>
              </li>
              <li>
                <Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How a Bill Becomes Law
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to contact your state legislators?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find all your representatives — federal and state — with one address lookup.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Find Your Legislators
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
