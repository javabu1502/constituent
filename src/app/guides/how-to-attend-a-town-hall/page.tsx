import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Attend a Town Hall Meeting | My Democracy',
  description: 'Complete guide to finding, preparing for, and making the most of congressional town hall meetings and constituent forums.',
  keywords: ['town hall meeting', 'how to attend town hall', 'congressional town hall', 'constituent forum', 'meet your representative', 'town hall tips'],
  openGraph: {
    title: 'How to Attend a Town Hall Meeting | My Democracy',
    description: 'Complete guide to finding, preparing for, and making the most of congressional town hall meetings.',
    type: 'article',
  },
};

export default function TownHallGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How to Attend a Town Hall', href: '/guides/how-to-attend-a-town-hall' }]} />
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
          How to Attend a Town Hall Meeting
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Town halls are one of the few places where you can directly address your elected officials face-to-face. Whether you&apos;re asking a question or just showing up, your presence matters.
          </p>

          {/* Finding Town Halls */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Finding Town Halls
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Your official&apos;s website</strong>: Check the &quot;Events&quot; or &quot;News&quot; section for upcoming town halls and constituent meetings.</li>
                <li><strong className="text-gray-900 dark:text-white">Town Hall Project</strong>: <a href="https://townhallproject.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">townhallproject.com</a> tracks town halls, forums, and public events for members of Congress.</li>
                <li><strong className="text-gray-900 dark:text-white">Local news and social media</strong>: Follow your official on social media and check local news for announcements.</li>
                <li><strong className="text-gray-900 dark:text-white">Call the district office</strong>: Staff can tell you about upcoming events and how to RSVP.</li>
              </ul>
              <p>
                Town halls are most common during congressional recess periods (August, holidays, and between sessions). State legislators often hold them during session breaks.
              </p>
            </div>
          </section>

          {/* Before You Go */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              Preparing for the Town Hall
            </h2>
            <div className="pl-10 space-y-4 text-gray-600 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Research your issue</h3>
                <p>Know the specific bill number, policy, or issue you want to address. The more specific you are, the more seriously you&apos;ll be taken. Check <a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a> for bill details.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Write your question in advance</h3>
                <p>Keep it under 30 seconds. Structure it as: brief personal context + specific question. Don&apos;t give a speech. Ask something the legislator must respond to.</p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Good:</span> &quot;I&apos;m a teacher in this district. Last year, 3 of my students couldn&apos;t afford required textbooks. Will you vote for HR 1234 to fund school supplies?&quot;
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Arrive early</h3>
                <p>Popular town halls fill up. Arriving 30-45 minutes early helps you get a seat near the front and sign up for the question queue if there is one.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bring a friend</h3>
                <p>Showing up in numbers demonstrates community support. Coordinate with neighbors, colleagues, or advocacy groups who share your concern.</p>
              </div>
            </div>
          </section>

          {/* At the Town Hall */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </span>
              At the Town Hall
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Be respectful</strong>: Firm and passionate is fine. Hostile and disruptive is counterproductive and may get you removed.</li>
                <li><strong className="text-gray-900 dark:text-white">State your name and where you live</strong>: This establishes you as a constituent. Legislators pay closer attention to their own voters.</li>
                <li><strong className="text-gray-900 dark:text-white">Ask a question, don&apos;t give a speech</strong>: You&apos;ll get 30-60 seconds. End with a direct question that requires a yes or no answer.</li>
                <li><strong className="text-gray-900 dark:text-white">Record the response</strong>: Note what the legislator says. If they make a commitment, you can follow up later to hold them accountable.</li>
                <li><strong className="text-gray-900 dark:text-white">Applaud others</strong>: When someone asks a good question on your issue, show vocal support. It demonstrates that multiple constituents care.</li>
              </ul>
            </div>
          </section>

          {/* After the Town Hall */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Follow Up
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Send a follow-up message</strong>: Reference the town hall and what was discussed. This reinforces your position in the office&apos;s records.</li>
                <li><strong className="text-gray-900 dark:text-white">Share on social media</strong>: Post about your experience. Tag your official. Other constituents want to know what happened.</li>
                <li><strong className="text-gray-900 dark:text-white">Report to local media</strong>: If the legislator made a notable statement, tip off local reporters. Media coverage amplifies accountability.</li>
              </ul>
            </div>
          </section>

          {/* Virtual Town Halls */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </span>
              Virtual Town Halls
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Many legislators now host virtual events via Zoom, Facebook Live, or telephone. These are more accessible for people who can&apos;t attend in person.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Sign up in advance. Virtual events often require registration.</li>
                <li>Submit your question early. Many virtual town halls collect questions beforehand and select which to ask.</li>
                <li>Have your question written out and ready to read clearly on camera or phone.</li>
              </ul>
            </div>
          </section>

          {/* Related */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">How to Contact Your Elected Officials</Link></li>
              <li><Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">Tell Your Story</Link></li>
              <li><Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">How to Get Involved in Local Politics</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Can&apos;t attend a town hall?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Contact your officials by email or phone. Your voice still counts.</p>
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
