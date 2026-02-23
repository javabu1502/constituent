import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Write an Effective Letter to Congress | My Democracy',
  description: 'Learn the structure, tips, and examples for writing messages that congressional offices actually read and respond to.',
  keywords: ['write to congress', 'letter to congressman', 'email representative', 'congressional correspondence', 'effective advocacy'],
  openGraph: {
    title: 'Write an Effective Letter to Congress | My Democracy',
    description: 'Learn the structure, tips, and examples for writing messages that congressional offices actually read and respond to.',
    type: 'article',
    url: 'https://mydemocracy.app/guides/write-effective-letter-to-congress',
  },
};

export default function WriteLetterGuidePage() {
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
          Write an Effective Letter to Congress
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Congressional offices receive thousands of messages. Here&apos;s how to write one that gets read, logged accurately, and potentially flagged for the legislator&apos;s personal attention.
          </p>

          {/* Why Personalized Letters Matter */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why Personalized Letters Matter
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Congressional staff can instantly recognize form letters and mass campaigns. While these still get tallied, they carry less weight than original correspondence.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">A personalized message signals:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>You took time to write — you&apos;re an engaged voter</li>
                <li>You have a real stake in the issue</li>
                <li>You might tell others and influence their votes</li>
                <li>Your story could be useful for the legislator&apos;s own advocacy</li>
              </ul>
            </div>
          </section>

          {/* The Essential Structure */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </span>
              The Essential Structure
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Identify Yourself as a Constituent</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Start with your full name and address. This is critical — offices only respond to and track messages from constituents. Include your city and ZIP code at minimum.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. State Your Purpose Immediately</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  In the first sentence, state the issue and your position. Staff sort messages by topic — make it easy for them to categorize yours correctly.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Good:</span> &quot;I&apos;m writing to urge you to vote YES on HR 1234, the Clean Water Act.&quot;<br />
                  <span className="text-red-600 dark:text-red-400">Avoid:</span> &quot;I&apos;ve been thinking a lot about the environment lately...&quot;
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Explain Why It Matters to You</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Share your personal connection to the issue. This is what separates your message from form letters. <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">Learn how to tell your story effectively</Link>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. Make a Specific Ask</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Tell them exactly what you want them to do: vote yes/no, co-sponsor a bill, sign a letter, request a hearing. Vague requests get vague responses.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">5. Close Professionally</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Thank them for their time and service. Include your contact information if you&apos;d like a response.
                </p>
              </div>
            </div>
          </section>

          {/* Example Letter */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Example Letter
            </h2>
            <div className="pl-10">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                <p>Dear Senator [Name],</p>
                <p>
                  My name is [Your Name], and I live in [City, State ZIP]. I&apos;m writing to urge you to vote YES on S. 1234, the Affordable Insulin Act.
                </p>
                <p>
                  My daughter was diagnosed with Type 1 diabetes at age 12. Last year, even with insurance, we paid over $4,000 out of pocket for her insulin. For many families, this cost is impossible — I&apos;ve heard stories of people rationing doses, which can be fatal.
                </p>
                <p>
                  This bill would cap insulin costs at $35 per month. That&apos;s the difference between my daughter living a normal life and our family facing impossible choices.
                </p>
                <p>
                  Please support S. 1234 and help make insulin affordable for the 7 million Americans who depend on it.
                </p>
                <p>
                  Thank you for your service and consideration.
                </p>
                <p>
                  Sincerely,<br />
                  [Your Name]<br />
                  [Address]<br />
                  [Email/Phone]
                </p>
              </div>
            </div>
          </section>

          {/* What to Include */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What to Include
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Bill number</strong> — If there&apos;s specific legislation, reference it (HR 1234, S. 5678)</li>
                <li><strong className="text-gray-900 dark:text-white">Your position</strong> — Support, oppose, or requesting action</li>
                <li><strong className="text-gray-900 dark:text-white">Personal story</strong> — How this issue affects you, your family, or community</li>
                <li><strong className="text-gray-900 dark:text-white">Specific ask</strong> — Vote, co-sponsor, hold a hearing, etc.</li>
                <li><strong className="text-gray-900 dark:text-white">Your contact info</strong> — So they can verify you&apos;re a constituent and respond</li>
              </ul>
            </div>
          </section>

          {/* What to Avoid */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What to Avoid
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Threats</strong> — Threatening language gets your message flagged and ignored</li>
                <li><strong className="text-gray-900 dark:text-white">Personal attacks</strong> — Insults won&apos;t change minds</li>
                <li><strong className="text-gray-900 dark:text-white">Lengthy manifestos</strong> — Keep it under one page. Staff don&apos;t have time for essays</li>
                <li><strong className="text-gray-900 dark:text-white">Multiple issues</strong> — One letter, one topic. Multi-issue letters get miscategorized</li>
                <li><strong className="text-gray-900 dark:text-white">Form letter language</strong> — If it sounds like a template, it gets treated like one</li>
                <li><strong className="text-gray-900 dark:text-white">All caps</strong> — It reads as shouting and looks like spam</li>
              </ul>
            </div>
          </section>

          {/* Tips from Congressional Staff */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              Tips from Congressional Staff
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Former congressional staffers consistently share these insights:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>&quot;We can tell a real letter in three seconds. Personal details matter.&quot;</li>
                <li>&quot;The best letters tell us something we can use — a story for the floor, a local angle for press.&quot;</li>
                <li>&quot;Timing matters. Before a vote is ideal. After, we still log it, but it&apos;s too late to influence that decision.&quot;</li>
                <li>&quot;We remember repeat contacts. Constituents who write multiple times on an issue get noticed.&quot;</li>
                <li>&quot;Professional and personal beats angry and generic every time.&quot;</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Tell Your Story: Make Your Message Stand Out
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your Congressman
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
            Ready to write your message?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            My Democracy helps you craft a personalized message with AI assistance. You control the final words.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Write Your Message
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
