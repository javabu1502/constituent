import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tell Your Story: Effective Advocacy Through Personal Stories | My Democracy',
  description: 'Learn why personal stories matter when contacting elected officials and how to structure them so staffers flag your message for attention.',
  keywords: ['advocacy storytelling', 'contact congress', 'personal story', 'constituent stories', 'effective advocacy', 'civic engagement'],
  openGraph: {
    title: 'Tell Your Story: Effective Advocacy Through Personal Stories | My Democracy',
    description: 'Learn why personal stories matter when contacting elected officials and how to structure them so staffers flag your message for attention.',
    type: 'article',
    url: 'https://mydemocracy.app/guides/tell-your-story',
  },
};

export default function TellYourStoryGuidePage() {
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
          Tell Your Story
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Personal stories are the most powerful tool in constituent advocacy. Here&apos;s why they matter, how to structure them, and what makes staffers flag a message for the legislator&apos;s personal attention.
          </p>

          {/* Why Stories Matter */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              Why Personal Stories Matter
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Congressional offices process thousands of messages. Statistics and policy arguments blur together. But a real story from a real constituent? That stands out.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Stories work because:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">They&apos;re memorable</strong> — A staffer might forget the tenth email about healthcare costs, but they&apos;ll remember the parent who couldn&apos;t afford insulin for their child.</li>
                <li><strong className="text-gray-900 dark:text-white">They&apos;re credible</strong> — You&apos;re the expert on your own life. No one can challenge your personal experience.</li>
                <li><strong className="text-gray-900 dark:text-white">They&apos;re usable</strong> — Legislators use constituent stories in floor speeches, press releases, and committee hearings. Your story could shape the national conversation.</li>
                <li><strong className="text-gray-900 dark:text-white">They humanize policy</strong> — Abstract debates become real when tied to real people.</li>
              </ul>
            </div>
          </section>

          {/* What Gets Flagged */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </span>
              What Gets Flagged for the Member
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Not every message reaches the legislator personally — most are logged and categorized by staff. But certain messages get elevated. Former staffers say they flag messages that:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Tell a compelling personal story</strong> with specific, concrete details</li>
                <li><strong className="text-gray-900 dark:text-white">Could be used publicly</strong> — in a speech, hearing, or press statement</li>
                <li><strong className="text-gray-900 dark:text-white">Come from key constituents</strong> — business owners, community leaders, or people directly affected by pending legislation</li>
                <li><strong className="text-gray-900 dark:text-white">Offer a unique perspective</strong> the office hasn&apos;t heard before</li>
                <li><strong className="text-gray-900 dark:text-white">Are well-written and professional</strong> — demonstrating the constituent took time and care</li>
              </ul>
            </div>
          </section>

          {/* How to Structure Your Story */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </span>
              How to Structure Your Story
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. The Hook (1-2 sentences)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Start with what makes your situation compelling. Lead with the human element, not policy details.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Example:</span> &quot;Last month, I had to choose between buying groceries and buying my daughter&apos;s asthma medication.&quot;
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. The Context (2-3 sentences)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Briefly explain your situation. Include relevant details: where you live, your job, family circumstances.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Example:</span> &quot;I&apos;m a teacher in Springfield and a single mom. My daughter Emma, age 8, has severe asthma. Our insurance covers the medication, but the copay is still $250 a month.&quot;
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. The Impact (2-3 sentences)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Describe concrete effects on your life. Use specific details — numbers, dates, consequences.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Example:</span> &quot;That&apos;s 10% of my take-home pay, just for one medication. Last winter, I stretched her prescription to make it last longer. She ended up in the emergency room.&quot;
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. The Ask (1-2 sentences)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Connect your story to specific action. Reference a bill if possible.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Example:</span> &quot;Please support HR 1234, the Prescription Drug Affordability Act. No parent should have to gamble with their child&apos;s health because medication costs too much.&quot;
                </div>
              </div>
            </div>
          </section>

          {/* Story Elements That Work */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Story Elements That Work
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Specific numbers</strong> — &quot;$847 a month&quot; is more powerful than &quot;expensive&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">Names and ages</strong> — &quot;My son Marcus, 12&quot; is more real than &quot;my child&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">A turning point</strong> — The moment things changed, the decision you faced</li>
                <li><strong className="text-gray-900 dark:text-white">Local details</strong> — Mention your town, local businesses, community connections</li>
                <li><strong className="text-gray-900 dark:text-white">The impossible choice</strong> — Two options that shouldn&apos;t be in conflict</li>
                <li><strong className="text-gray-900 dark:text-white">What you tried</strong> — Shows you&apos;re not just complaining, but exhausted alternatives</li>
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
                <li><strong className="text-gray-900 dark:text-white">Generalizations</strong> — &quot;Many people struggle&quot; is less powerful than your specific struggle</li>
                <li><strong className="text-gray-900 dark:text-white">Statistics without story</strong> — Numbers support your story; they don&apos;t replace it</li>
                <li><strong className="text-gray-900 dark:text-white">Exaggeration</strong> — Stick to the truth. Credibility is everything.</li>
                <li><strong className="text-gray-900 dark:text-white">Blaming the legislator</strong> — Focus on the problem and solution, not attacks</li>
                <li><strong className="text-gray-900 dark:text-white">Too much context</strong> — Get to the emotional core quickly</li>
                <li><strong className="text-gray-900 dark:text-white">Oversharing</strong> — Include what&apos;s relevant, not your entire life history</li>
              </ul>
            </div>
          </section>

          {/* Example Full Message */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Example: A Complete Story-Driven Message
            </h2>
            <div className="pl-10">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                <p>Dear Representative Johnson,</p>
                <p>
                  My name is Maria Chen, and I live at 142 Oak Street in Riverside. I&apos;m writing about childcare costs.
                </p>
                <p>
                  Two years ago, my husband and I both worked full-time. Then we had twins. When we looked at childcare costs — $2,400 a month for two infants in our area — we did the math. After taxes, it would cost more than my entire salary to have both kids in daycare.
                </p>
                <p>
                  I quit my job as an accountant. I didn&apos;t want to. I loved my career. But paying to work made no financial sense. Now we&apos;re a single-income family in a two-income economy. We&apos;ve burned through our savings and postponed buying a home indefinitely.
                </p>
                <p>
                  I&apos;m not asking for a handout. I want to work. I want to contribute to my family and pay taxes. But until childcare is affordable, I&apos;m stuck.
                </p>
                <p>
                  Please support HR 5678, the Childcare for Working Families Act. Families like mine are counting on you.
                </p>
                <p>
                  Thank you for your time,<br />
                  Maria Chen<br />
                  Riverside, [State] [ZIP]
                </p>
              </div>
            </div>
          </section>

          {/* What Happens to Your Story */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              What Happens to Your Story
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>When you share a compelling personal story:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Staff may flag it for the legislator to read personally</li>
                <li>It might be saved in a file of &quot;powerful constituent stories&quot; for future use</li>
                <li>The legislator may quote it (anonymously or with permission) in a floor speech or hearing</li>
                <li>It could appear in press releases or op-eds</li>
                <li>Staff may follow up to learn more or request permission to share</li>
              </ul>
              <p>
                Your story has power beyond the moment you send it. It becomes part of the case for change.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Write an Effective Letter to Congress
                </Link>
              </li>
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
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to tell your story?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            My Democracy helps you craft a powerful, personalized message with AI assistance. Your story, your words.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Share Your Story
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
