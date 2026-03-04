import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Organize Your Neighbors Around an Issue | My Democracy',
  description: 'Practical guide to community organizing: identify an issue, build a coalition, run effective meetings, create petitions, and escalate to elected officials.',
  keywords: ['community organizing', 'how to organize neighbors', 'grassroots organizing', 'civic action', 'community advocacy', 'petition', 'neighborhood organizing'],
  openGraph: {
    title: 'How to Organize Your Neighbors Around an Issue | My Democracy',
    description: 'A practical guide to community organizing and grassroots civic action.',
    type: 'article',
  },
};

export default function OrganizeNeighborsGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How to Organize Your Neighbors', href: '/guides/how-to-organize-your-neighbors' }]} />
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
          How to Organize Your Neighbors Around an Issue
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Individual voices matter, but collective action amplifies your impact. Whether it&apos;s a local zoning issue, a school board policy, or a state bill, organizing your neighbors turns one person&apos;s concern into a movement that elected officials cannot ignore.
          </p>

          {/* Identify the Issue */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Identify and Define the Issue
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Start by clearly defining the problem. A broad concern like &quot;the neighborhood is declining&quot; is harder to organize around than a specific issue like &quot;there&apos;s no crosswalk at the intersection of Main and 5th where children walk to school.&quot;
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Research the facts: who has authority over this issue? Is it city council, the school board, the state legislature?</li>
                <li>Understand the decision-making timeline — is a vote coming up? Is public comment open?</li>
                <li>Define a clear, achievable goal: &quot;We want the city to install a crosswalk at Main and 5th before the school year starts.&quot;</li>
              </ul>
            </div>
          </section>

          {/* Build Your Coalition */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Build Your Coalition
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Start with people you know: neighbors, parents at your child&apos;s school, members of community groups or houses of worship. Then expand outward:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Door-to-door outreach</strong>: Talk to neighbors on your block or in your building. Personal conversations are the most effective form of outreach.</li>
                <li><strong className="text-gray-900 dark:text-white">Social media and online groups</strong>: Neighborhood Facebook groups, Nextdoor, and community forums can help spread the word.</li>
                <li><strong className="text-gray-900 dark:text-white">Partner with existing organizations</strong>: PTA groups, neighborhood associations, civic clubs, and local advocacy organizations may already work on related issues.</li>
                <li><strong className="text-gray-900 dark:text-white">Collect contact info</strong>: Build an email list or group chat so you can coordinate quickly when action is needed.</li>
              </ul>
            </div>
          </section>

          {/* Run Effective Meetings */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              Run Effective Meetings
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Set an agenda</strong>: Share it in advance so people know what to expect and can prepare.</li>
                <li><strong className="text-gray-900 dark:text-white">Keep it focused</strong>: Limit meetings to 60-90 minutes. Stay on topic.</li>
                <li><strong className="text-gray-900 dark:text-white">End with action items</strong>: Every meeting should produce specific next steps with owners and deadlines.</li>
                <li><strong className="text-gray-900 dark:text-white">Make it accessible</strong>: Choose venues that are ADA-accessible, offer a virtual option, provide childcare if possible, and consider meeting at times that work for people with different schedules.</li>
                <li><strong className="text-gray-900 dark:text-white">Share notes</strong>: Send a summary after each meeting so people who couldn&apos;t attend can stay involved.</li>
              </ul>
            </div>
          </section>

          {/* Take Action */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Take Action and Escalate
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Effective organizing involves a progression of tactics. Start with lower-effort actions and escalate as needed:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Write letters and make calls</strong>: Coordinate a day when everyone contacts their representative on the same issue. See our <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">letter-writing guide</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Attend public meetings</strong>: Show up to city council, school board, or other meetings as a group. Numbers matter. See our guide to <Link href="/guides/how-to-testify-at-a-public-hearing" className="text-purple-600 dark:text-purple-400 hover:underline">testifying at public hearings</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Create a petition</strong>: A petition with signatures demonstrates broad support. Deliver it in person to your representative&apos;s office.</li>
                <li><strong className="text-gray-900 dark:text-white">Contact local media</strong>: Reach out to local newspaper reporters, TV stations, and community blogs. A well-told story attracts attention and pressure.</li>
                <li><strong className="text-gray-900 dark:text-white">Run a campaign</strong>: Use <Link href="/guides/how-to-run-a-successful-campaign" className="text-purple-600 dark:text-purple-400 hover:underline">My Democracy&apos;s campaign tools</Link> to coordinate outreach and track impact.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">How to Get Involved in Local Politics</Link></li>
              <li><Link href="/guides/how-to-testify-at-a-public-hearing" className="text-purple-600 dark:text-purple-400 hover:underline">How to Testify at a Public Hearing</Link></li>
              <li><Link href="/guides/how-to-run-a-successful-campaign" className="text-purple-600 dark:text-purple-400 hover:underline">How to Run a Successful Campaign</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ready to rally your neighbors?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Start by contacting your representatives together.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Contact Your Reps
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
