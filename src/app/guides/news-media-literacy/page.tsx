import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Follow the News Without Losing Your Mind | My Democracy',
  description: 'Learn how to evaluate news sources, spot misinformation, and stay informed about civic issues without burning out.',
  keywords: ['media literacy', 'news sources', 'misinformation', 'news fatigue', 'civic engagement', 'reliable news', 'fact checking'],
  openGraph: {
    title: 'How to Follow the News Without Losing Your Mind | My Democracy',
    description: 'Learn how to evaluate news sources, spot misinformation, and stay informed about civic issues without burning out.',
    type: 'article',
  },
};

export default function NewsMediaLiteracyGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'News & Media Literacy', href: '/guides/news-media-literacy' }]} />
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
          How to Follow the News Without Losing Your Mind
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Staying informed is essential for civic participation, but the modern news environment can feel overwhelming. Between 24-hour cable coverage, social media feeds, and push notifications, it&apos;s easy to either tune out entirely or drown in information. This guide will help you build a sustainable, critical approach to consuming news so you can be an informed citizen without sacrificing your well-being.
          </p>

          {/* Why Media Literacy Matters */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why Media Literacy Matters
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                In a democracy, the quality of civic participation depends on the quality of the information citizens have. When you contact a representative, vote on a ballot measure, or attend a town hall, the value of your participation is shaped by how well you understand the issues.
              </p>
              <p>
                Media literacy is the ability to critically evaluate the information you encounter -to distinguish reporting from opinion, identify credible sources, recognize manipulation techniques, and understand the economic incentives that shape how news is presented.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">This matters because:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Misinformation can lead to misguided advocacy or voting decisions</li>
                <li>Emotional manipulation in media can distort your understanding of how common or urgent an issue actually is</li>
                <li>Algorithmically curated feeds can create a skewed picture of public opinion and political reality</li>
                <li>Understanding how news works makes you a more effective advocate when you do engage</li>
              </ul>
            </div>
          </section>

          {/* Evaluating News Sources */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Evaluating News Sources
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Not all news sources are created equal. Learning to evaluate the credibility and reliability of a source is one of the most important skills you can develop as a news consumer.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Questions to ask about any source:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Who owns it?</strong> -Understanding a news outlet&apos;s ownership can reveal potential conflicts of interest. Most reputable outlets disclose their ownership structure.</li>
                <li><strong className="text-gray-900 dark:text-white">Does it clearly separate news from opinion?</strong> -Quality news organizations label opinion, editorial, and analysis content distinctly from straight news reporting.</li>
                <li><strong className="text-gray-900 dark:text-white">Does it cite sources?</strong> -Good journalism names its sources or explains why a source is anonymous. Be cautious of stories that make claims without attribution.</li>
                <li><strong className="text-gray-900 dark:text-white">Does it issue corrections?</strong> -Every newsroom makes mistakes. The sign of a credible outlet is that it corrects errors transparently rather than quietly deleting or altering stories.</li>
                <li><strong className="text-gray-900 dark:text-white">Does it use neutral language in headlines?</strong> -Headlines designed to provoke outrage or fear (&quot;SHOCKING,&quot; &quot;SLAMMED,&quot; &quot;DESTROYED&quot;) often signal that the goal is engagement rather than accuracy.</li>
              </ul>
              <p>
                Wire services like the <a href="https://apnews.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Associated Press</a> and <a href="https://www.reuters.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Reuters</a> are widely regarded as reliable starting points because their business model depends on selling factual reporting to other news organizations around the world. Their reporting tends to be straightforward and fact-driven.
              </p>
            </div>
          </section>

          {/* Spotting Misinformation */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              Spotting Misinformation
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Misinformation -false or misleading content -spreads quickly, especially on social media. It can be created intentionally to deceive, or it can spread organically when people share content without verifying it first. Here are practical ways to protect yourself.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Red flags to watch for:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">No original source cited</strong> -If a claim doesn&apos;t link to or name a primary source (a study, a government document, an on-the-record statement), treat it with skepticism.</li>
                <li><strong className="text-gray-900 dark:text-white">Screenshots instead of links</strong> -Screenshots of tweets, articles, or documents can be easily fabricated. Always look for the original.</li>
                <li><strong className="text-gray-900 dark:text-white">Emotional language designed to provoke</strong> -Content crafted to make you feel outraged, afraid, or triumphant before you&apos;ve had time to think critically is often manipulative.</li>
                <li><strong className="text-gray-900 dark:text-white">Claims that &quot;the media won&apos;t cover this&quot;</strong> -This framing is often used to make unverified claims seem more credible by casting doubt on institutions that might debunk them.</li>
                <li><strong className="text-gray-900 dark:text-white">Old stories presented as new</strong> -Check the date. Recycled stories with current framing are a common form of misinformation.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Before sharing, verify:</strong> Search for the claim using multiple sources. Check whether credible outlets are reporting the same story. Look at the original source material when possible -read the actual study, the full quote in context, or the official government document rather than relying on someone else&apos;s summary.
              </p>
            </div>
          </section>

          {/* Managing News Consumption */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Managing News Consumption
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Research consistently shows that excessive news consumption is associated with increased stress and anxiety. The goal is not to consume more news, but to consume it more intentionally.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Strategies for sustainable news habits:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Set specific times</strong> -Rather than checking news throughout the day, choose one or two specific times to catch up. Morning and evening work for many people.</li>
                <li><strong className="text-gray-900 dark:text-white">Choose reading over scrolling</strong> -Reading a few in-depth articles is more informative than scrolling through dozens of headlines. Depth beats volume.</li>
                <li><strong className="text-gray-900 dark:text-white">Turn off push notifications</strong> -Breaking news alerts create a constant sense of urgency. Unless your safety depends on immediate information, you can catch up on your own schedule.</li>
                <li><strong className="text-gray-900 dark:text-white">Separate social media from news</strong> -Social media algorithms prioritize engagement over accuracy. If you get news from social media, verify it through dedicated news sources before reacting.</li>
                <li><strong className="text-gray-900 dark:text-white">Take breaks when needed</strong> -Stepping away from the news for a day or a week does not make you a bad citizen. It makes you a more resilient one.</li>
              </ul>
              <p>
                Remember: the purpose of following the news is to be informed enough to participate effectively in your democracy. If your news consumption is leaving you too stressed or overwhelmed to take action, it&apos;s counterproductive.
              </p>
            </div>
          </section>

          {/* Reliable Sources for Civic Information */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </span>
              Reliable Sources for Civic Information
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                When it comes to civic engagement specifically -tracking legislation, understanding government processes, and following what your officials are doing -primary sources are your best bet. These are the official records and proceedings themselves, not someone else&apos;s interpretation of them.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Primary government sources:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a> -The official source for federal legislation. You can read the full text of bills, track their progress through committees, and see how your officials voted. Learn more in our <Link href="/guides/how-to-track-legislation" className="text-purple-600 dark:text-purple-400 hover:underline">guide to tracking legislation</Link>.</li>
                <li><a href="https://www.c-span.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">C-SPAN</a> -Provides unedited, gavel-to-gavel coverage of congressional proceedings, committee hearings, and other government events. Watching C-SPAN lets you see what your officials actually say on the floor, without editing or commentary.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Wire services for straight news reporting:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><a href="https://apnews.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Associated Press (AP)</a> -A nonprofit wire service that has been reporting news since 1846. AP stories are used by thousands of news outlets worldwide and adhere to strict sourcing and correction policies.</li>
                <li><a href="https://www.reuters.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Reuters</a> -An international wire service known for factual, concise reporting. Like AP, Reuters sells its reporting to other outlets, giving it a strong incentive to maintain accuracy.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Building your own media diet:</strong> Consider following a mix of sources that includes at least one wire service, one or two newspapers with dedicated government reporting, your local newspaper for state and municipal news, and the official websites of your state legislature and local government. This gives you a well-rounded picture without relying on any single outlet&apos;s editorial perspective.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/who-are-my-representatives" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Who Are My Elected Officials?
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-track-legislation" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Track Legislation
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Get Involved in Local Politics
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to put your knowledge to work?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Now that you know how to stay informed, take the next step and reach out to your officials about the issues that matter to you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Write to Your Officials
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
