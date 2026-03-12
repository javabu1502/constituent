import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How Impeachment Works | My Democracy',
  description: 'Learn how the impeachment process works in the United States — from House investigation and articles of impeachment to the Senate trial and historical examples.',
  keywords: ['impeachment', 'impeachment process', 'how impeachment works', 'articles of impeachment', 'Senate trial', 'high crimes and misdemeanors', 'presidential impeachment'],
  alternates: {
    canonical: 'https://www.mydemocracy.app/guides/how-impeachment-works',
  },
  openGraph: {
    title: 'How Impeachment Works | My Democracy',
    description: 'Learn how the impeachment process works in the United States — from House investigation and articles of impeachment to the Senate trial and historical examples.',
    type: 'article',
  },
};

export default function ImpeachmentGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How Impeachment Works', href: '/guides/how-impeachment-works' }]} />
      <FaqJsonLd items={[
        { question: 'Does impeachment mean a president is removed from office?', answer: 'No. Impeachment is only the first step — it is the formal charging of an official by the House of Representatives. Removal requires a separate trial in the Senate, where a two-thirds vote is needed to convict and remove. No US president has ever been removed through impeachment. Andrew Johnson, Bill Clinton, and Donald Trump (twice) were all impeached by the House but acquitted by the Senate.' },
        { question: 'How many presidents have been impeached?', answer: 'Three presidents have been impeached: Andrew Johnson in 1868, Bill Clinton in 1998, and Donald Trump in 2019 and 2021 (twice). Richard Nixon faced impeachment proceedings but resigned before the full House voted. None of the impeached presidents were convicted and removed by the Senate.' },
        { question: 'Can officials other than the president be impeached?', answer: 'Yes. The Constitution allows impeachment of "the President, Vice President and all civil Officers of the United States." This includes federal judges, cabinet secretaries, and other senior officials. In fact, most impeachments in US history have been of federal judges. Fifteen federal judges have been impeached, and eight have been convicted and removed from office.' },
      ]} />
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
          How Impeachment Works
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Impeachment is the Constitution&apos;s mechanism for holding federal officials accountable for serious misconduct. It&apos;s one of the most powerful checks in the American system — and one of the most misunderstood.
          </p>

          {/* What Is Impeachment? */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What Is Impeachment?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Impeachment is the process by which Congress can charge and potentially remove federal officials — including the president — for serious misconduct. It&apos;s laid out in Article I and Article II of the Constitution.
              </p>
              <p>
                A critical distinction: <strong className="text-gray-900 dark:text-white">impeachment is not removal</strong>. Impeachment is the formal accusation, similar to an indictment in criminal law. The House of Representatives impeaches (charges), and the Senate holds the trial. Only if the Senate convicts by a two-thirds vote is the official removed from office.
              </p>
            </div>
          </section>

          {/* Grounds for Impeachment */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Grounds for Impeachment
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                The Constitution specifies that officials can be impeached for <strong className="text-gray-900 dark:text-white">&quot;Treason, Bribery, or other high Crimes and Misdemeanors.&quot;</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Treason</strong>: Defined in the Constitution as levying war against the United States or giving aid and comfort to its enemies.</li>
                <li><strong className="text-gray-900 dark:text-white">Bribery</strong>: Accepting or soliciting something of value in exchange for official action.</li>
                <li><strong className="text-gray-900 dark:text-white">High crimes and misdemeanors</strong>: This phrase has been debated since the founding. It broadly refers to serious abuses of power, violations of public trust, or conduct incompatible with the office. It does not necessarily require a violation of criminal law.</li>
              </ul>
              <p>
                In practice, Congress has significant discretion in defining impeachable conduct. As Gerald Ford once said, &quot;An impeachable offense is whatever a majority of the House of Representatives considers it to be.&quot;
              </p>
            </div>
          </section>

          {/* The House Process */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              The House Process
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                The impeachment process begins in the House of Representatives:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Investigation</strong>: A House committee (typically Judiciary) investigates the allegations, holds hearings, and gathers evidence. Witnesses may testify and documents may be subpoenaed.</li>
                <li><strong className="text-gray-900 dark:text-white">Articles of impeachment</strong>: If the committee finds sufficient evidence, it drafts articles of impeachment — formal charges specifying the alleged misconduct.</li>
                <li><strong className="text-gray-900 dark:text-white">Committee vote</strong>: The Judiciary Committee votes on whether to send the articles to the full House.</li>
                <li><strong className="text-gray-900 dark:text-white">Full House vote</strong>: The full House debates and votes on each article. A <strong className="text-gray-900 dark:text-white">simple majority</strong> (218 votes) is required to pass each article. If any article passes, the official is impeached.</li>
              </ol>
            </div>
          </section>

          {/* The Senate Trial */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </span>
              The Senate Trial
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                After impeachment by the House, the case moves to the Senate for trial:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Presiding officer</strong>: For presidential impeachments, the Chief Justice of the Supreme Court presides. For all other officials, the Vice President or the president pro tempore of the Senate presides.</li>
                <li><strong className="text-gray-900 dark:text-white">House managers</strong>: Members of the House serve as prosecutors, presenting the case against the official.</li>
                <li><strong className="text-gray-900 dark:text-white">Defense</strong>: The impeached official has the right to legal representation and can present witnesses and evidence.</li>
                <li><strong className="text-gray-900 dark:text-white">Senators as jurors</strong>: All 100 senators serve as jurors. They take a special oath to do &quot;impartial justice.&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">Conviction</strong>: A <strong className="text-gray-900 dark:text-white">two-thirds vote</strong> (67 senators) is required to convict and remove the official from office.</li>
              </ul>
              <p>
                If convicted, the official is immediately removed. The Senate may also vote (by simple majority) to bar the official from holding future federal office.
              </p>
            </div>
          </section>

          {/* Historical Impeachments */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              Historical Impeachments
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Andrew Johnson (1868)</h3>
                <p className="text-sm">
                  Impeached for violating the Tenure of Office Act by firing Secretary of War Edwin Stanton. Acquitted by the Senate by a single vote.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Richard Nixon (1974)</h3>
                <p className="text-sm">
                  Faced impeachment for obstruction of justice, abuse of power, and contempt of Congress related to the Watergate scandal. Resigned before the full House voted, making him the only president to resign.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bill Clinton (1998)</h3>
                <p className="text-sm">
                  Impeached on charges of perjury and obstruction of justice related to the Monica Lewinsky scandal. Acquitted by the Senate on both counts.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Donald Trump (2019 &amp; 2021)</h3>
                <p className="text-sm">
                  First impeached for abuse of power and obstruction of Congress related to Ukraine. Acquitted. Impeached a second time for incitement of insurrection following the January 6 Capitol attack. Acquitted again, though the second trial drew the most bipartisan support for conviction in any presidential impeachment.
                </p>
              </div>
            </div>
          </section>

          {/* What You Can Do */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </span>
              What You Can Do
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Contact your representatives during proceedings</strong>: Your House member votes on whether to impeach, and your senators vote on whether to convict. Let them know where you stand. <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">Learn how to contact them effectively</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Stay informed with primary sources</strong>: Read the actual articles of impeachment and watch hearings rather than relying solely on commentary. C-SPAN broadcasts proceedings live and archives them.</li>
                <li><strong className="text-gray-900 dark:text-white">Understand the stakes</strong>: Impeachment is a political process, not a criminal one. Your voice as a constituent matters because members of Congress weigh public opinion in their votes.</li>
                <li><strong className="text-gray-900 dark:text-white">Vote for accountability</strong>: How your representatives handle impeachment proceedings is part of their record. Factor their votes into your decisions at election time.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How a Bill Becomes Law
                </Link>
              </li>
              <li>
                <Link href="/guides/how-congress-votes" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How Congress Votes and What It Means
                </Link>
              </li>
              <li>
                <Link href="/guides/what-does-my-congressman-do" className="text-purple-600 dark:text-purple-400 hover:underline">
                  What Does My Elected Official Actually Do?
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your Elected Officials
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Want to hold your officials accountable?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Contact your representatives and senators to make your voice heard.
          </p>
          <Link
            href="/guides/how-to-contact-your-congressman"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Your Officials
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
