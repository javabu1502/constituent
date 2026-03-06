import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Who Are My Elected Officials? | Find Your Elected Officials | My Democracy',
  description: 'Find out who represents you at every level of government — federal, state, and local. Learn how representation works and how to contact your elected officials.',
  keywords: ['who are my representatives', 'who is my congressman', 'find my representative', 'who represents me', 'my elected officials', 'who is my senator'],
  openGraph: {
    title: 'Who Are My Elected Officials? | Find Your Elected Officials | My Democracy',
    description: 'Find out who represents you at every level of government and learn how to contact them.',
    type: 'article',
  },
};

export default function WhoAreMyRepresentativesPage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Who Are My Elected Officials?', href: '/guides/who-are-my-representatives' }]} />
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
          Who Are My Elected Officials?
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Every American is represented by multiple elected officials at the federal, state, and local levels. Knowing who they are is the first step to making your voice heard on the issues that matter to you.
          </p>

          {/* Federal Representatives */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Your Federal Officials
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Two US Senators</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Every state elects two US Senators who serve six-year terms. Senators represent the entire state and vote on federal legislation, confirm presidential appointments, and ratify treaties. Senate terms are staggered so that roughly one-third of the Senate is up for election every two years.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">One US House Representative</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  You have one Representative in the US House based on your congressional district. House members serve two-year terms and are up for election every even-numbered year. The total number of voting House members is fixed at 435 by the Permanent Apportionment Act of 1929, with seats distributed among states based on the census conducted every ten years.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Finding Your Federal Officials</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Use the <Link href="/legislators" className="text-purple-600 dark:text-purple-400 hover:underline">My Democracy legislator directory</Link> to find your US Senators and House Representative. You can also search by state on <a href="https://www.congress.gov/members" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a>.
                </p>
              </div>
            </div>
          </section>

          {/* State Representatives */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </span>
              Your State Legislators
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Every state except Nebraska has a bicameral legislature with a state senate and a state house (or assembly). Nebraska has a single-chamber (unicameral) legislature. Your state legislators handle issues like education funding, transportation, criminal justice, and healthcare policy.
              </p>
              <p>
                State legislative districts are smaller than congressional districts, so your state officials serve fewer people and are often more accessible. Visit your <Link href="/states" className="text-purple-600 dark:text-purple-400 hover:underline">state&apos;s page on My Democracy</Link> to find your state legislators and learn about your state&apos;s legislative session schedule.
              </p>
            </div>
          </section>

          {/* Local Officials */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Your Local Officials
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Local government varies by jurisdiction, but you are typically represented by a mayor or county executive, city council members or county commissioners, and a school board. These officials make decisions about zoning, property taxes, policing, parks, water systems, and local schools.
              </p>
              <p>
                To find your local officials, check your city or county government website, or search <a href="https://www.usa.gov/elected-officials" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">USA.gov&apos;s elected officials page</a>.
              </p>
            </div>
          </section>

          {/* Why It Matters */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why Knowing Your Officials Matters
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">They work for you</strong>: Elected officials represent the people in their district or state. Your feedback directly shapes their positions and votes.</li>
                <li><strong className="text-gray-900 dark:text-white">Different levels, different issues</strong>: A pothole is a city issue; immigration is federal. Contacting the right official gets results.</li>
                <li><strong className="text-gray-900 dark:text-white">Free help from their office</strong>: Your officials can help you navigate federal and state agencies. See our <Link href="/guides/constituent-services" className="text-purple-600 dark:text-purple-400 hover:underline">guide to requesting help from your officials</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Accountability</strong>: Tracking their <Link href="/vote" className="text-purple-600 dark:text-purple-400 hover:underline">voting records</Link> lets you hold them accountable at election time.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">How to Contact Your Elected Officials</Link></li>
              <li><Link href="/guides/how-to-contact-your-state-legislators" className="text-purple-600 dark:text-purple-400 hover:underline">How to Contact Your State Legislators</Link></li>
              <li><Link href="/guides/what-does-my-congressman-do" className="text-purple-600 dark:text-purple-400 hover:underline">What Does My Elected Official Actually Do?</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ready to reach out?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Find your officials and contact them about the issues you care about.</p>
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
