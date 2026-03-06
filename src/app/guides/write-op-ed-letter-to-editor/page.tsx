import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Write an Op-Ed or Letter to the Editor | My Democracy',
  description: 'Learn how to write and publish op-eds and letters to the editor. Understand the difference between the two formats, structure your argument, and pitch to local newspapers.',
  keywords: ['op-ed', 'letter to the editor', 'how to write an op-ed', 'opinion writing', 'newspaper opinion', 'civic writing', 'media advocacy', 'local newspaper'],
  openGraph: {
    title: 'How to Write an Op-Ed or Letter to the Editor | My Democracy',
    description: 'A practical guide to writing and publishing op-eds and letters to the editor in local and national publications.',
    type: 'article',
  },
};

export default function OpEdLetterToEditorGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Write an Op-Ed', href: '/guides/write-op-ed-letter-to-editor' }]} />
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
          How to Write an Op-Ed or Letter to the Editor
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Op-eds and letters to the editor are powerful ways to shape public opinion and put issues on the agenda. They reach readers who may not follow politics closely, they signal to elected officials that constituents care, and they create a public record of community sentiment. You don&apos;t need to be a professional writer to get published — local papers actively seek perspectives from everyday community members.
          </p>

          {/* Op-Eds vs. Letters to the Editor */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
              Op-Eds vs. Letters to the Editor
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                These two formats serve different purposes and have different requirements. Understanding the distinction will help you choose the right approach:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Letters to the editor (LTEs)</strong> are short responses — typically 150 to 300 words — to something the newspaper has already published. They react to a recent article, editorial, or event. Most newspapers publish several letters per day or per issue, so competition is moderate and turnaround can be quick.</li>
                <li><strong className="text-gray-900 dark:text-white">Op-eds</strong> (short for &quot;opposite the editorial page&quot;) are longer opinion pieces, usually 600 to 800 words. They present an original argument on a timely topic and don&apos;t need to respond to a specific article. Op-eds are more competitive — papers publish fewer of them, and editors look for a clear point of view, strong writing, and relevant expertise or experience.</li>
              </ul>
              <p>
                If you&apos;re new to opinion writing, a letter to the editor is a great place to start. It&apos;s shorter, has a faster publication cycle, and gives you experience crafting a concise public argument.
              </p>
            </div>
          </section>

          {/* Structuring Your Argument */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </span>
              Structuring Your Argument
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Whether you&apos;re writing an LTE or an op-ed, a clear structure makes your piece more persuasive and easier to read.
              </p>
              <p><strong className="text-gray-900 dark:text-white">For a letter to the editor:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Reference the article or event you&apos;re responding to by title and date.</li>
                <li>State your point clearly in the first sentence or two.</li>
                <li>Provide one or two supporting facts, examples, or personal experiences.</li>
                <li>End with a call to action or a clear takeaway for readers.</li>
              </ul>
              <p><strong className="text-gray-900 dark:text-white">For an op-ed:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong className="text-gray-900 dark:text-white">The hook</strong>: Open with a compelling anecdote, surprising fact, or timely reference that draws readers in.</li>
                <li><strong className="text-gray-900 dark:text-white">The thesis</strong>: State your argument clearly within the first few paragraphs. Readers should know exactly what you&apos;re arguing and why.</li>
                <li><strong className="text-gray-900 dark:text-white">The evidence</strong>: Use facts, data, and real-world examples to support your argument. Cite credible sources.</li>
                <li><strong className="text-gray-900 dark:text-white">The counterargument</strong>: Acknowledge the strongest opposing view and explain why your position is still correct. This builds credibility.</li>
                <li><strong className="text-gray-900 dark:text-white">The conclusion</strong>: End with a specific call to action — what should readers, officials, or institutions do next?</li>
              </ul>
            </div>
          </section>

          {/* Writing Tips That Get Published */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </span>
              Writing Tips That Get Published
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Editors review many submissions. Here&apos;s how to make yours stand out:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Be timely</strong>: Tie your piece to something in the news. An LTE responding to an article published that week is far more likely to run than one reacting to something from last month.</li>
                <li><strong className="text-gray-900 dark:text-white">Write in your own voice</strong>: Editors value authentic perspectives. If you&apos;re a parent, nurse, small business owner, or veteran, let that experience come through.</li>
                <li><strong className="text-gray-900 dark:text-white">Be specific</strong>: Replace vague claims with concrete details. Instead of &quot;many people are affected,&quot; describe what you&apos;ve seen in your own community.</li>
                <li><strong className="text-gray-900 dark:text-white">Keep it focused</strong>: Make one argument well rather than trying to cover multiple issues. Resist the urge to include everything you know about a topic.</li>
                <li><strong className="text-gray-900 dark:text-white">Respect the word count</strong>: Check the publication&apos;s submission guidelines and stay within the stated limits. Submissions that exceed the word count are often rejected without being read.</li>
                <li><strong className="text-gray-900 dark:text-white">Edit ruthlessly</strong>: Read your piece aloud. Cut any sentence that doesn&apos;t advance your argument. Ask a trusted friend to review it before you submit.</li>
              </ul>
            </div>
          </section>

          {/* Pitching to Publications */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Pitching to Publications
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                The submission process differs for LTEs and op-eds:
              </p>
              <p><strong className="text-gray-900 dark:text-white">Letters to the editor:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Most newspapers have a dedicated email address for letters (often listed on their opinion page or website). Some accept submissions through an online form.</li>
                <li>Include your full name, address, and phone number. Papers verify your identity before publishing but typically only print your name and city.</li>
                <li>Submit to only one publication at a time. Most papers will not publish a letter that has appeared elsewhere.</li>
              </ul>
              <p><strong className="text-gray-900 dark:text-white">Op-eds:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check the publication&apos;s opinion page for submission guidelines. Many major papers list their op-ed editor&apos;s email and specific formatting requirements.</li>
                <li>For op-eds, you may want to send a short pitch email first — two to three sentences describing your argument, why it&apos;s timely, and why you&apos;re the right person to write it.</li>
                <li>Include a brief author bio (one to two sentences) noting your relevant experience or credentials.</li>
                <li>Op-eds are typically exclusive — do not submit the same piece to multiple publications simultaneously unless the publication&apos;s guidelines say otherwise.</li>
              </ul>
              <p>
                Start local. Community newspapers, weekly papers, and regional online outlets are often eager for local voices and have less competition than major metro dailies.
              </p>
            </div>
          </section>

          {/* After Publication */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </span>
              After Publication
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Getting published is just the beginning. Maximize the impact of your piece:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Share it widely</strong>: Post the published piece on social media, send it to community groups, and email it to your personal network. The more people who read it, the more influence it has.</li>
                <li><strong className="text-gray-900 dark:text-white">Send it to your officials</strong>: Email or mail a copy to your elected officials with a brief cover note. Legislators and their staff monitor local media, but a direct share ensures they see it. Use our <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">guide to writing effective letters to Congress</Link> for tips on that follow-up.</li>
                <li><strong className="text-gray-900 dark:text-white">Engage with responses</strong>: If readers comment or write their own letters in response, engage constructively. This extends the conversation and keeps the issue in the public eye.</li>
                <li><strong className="text-gray-900 dark:text-white">Build on the momentum</strong>: A published opinion piece gives you credibility and visibility. Use it as a springboard for other advocacy — speaking at public meetings, organizing community events, or <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">telling your story</Link> in other contexts.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">How to Write an Effective Letter to Congress</Link></li>
              <li><Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">How to Tell Your Story Effectively</Link></li>
              <li><Link href="/guides/how-to-run-a-successful-campaign" className="text-purple-600 dark:text-purple-400 hover:underline">How to Run a Successful Campaign</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Pair your published piece with direct action</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Send your op-ed or letter directly to your officials to reinforce your message.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Write to Your Officials
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
