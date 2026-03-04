import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'What Is Gerrymandering and How Does It Affect You? | My Democracy',
  description: 'Learn what gerrymandering is, how redistricting works, the difference between partisan and racial gerrymandering, and what citizens can do about it.',
  keywords: ['gerrymandering', 'redistricting', 'what is gerrymandering', 'congressional districts', 'redistricting commission', 'partisan gerrymandering', 'how redistricting works'],
  openGraph: {
    title: 'What Is Gerrymandering and How Does It Affect You? | My Democracy',
    description: 'Learn what gerrymandering is, how redistricting works, and what you can do about it.',
    type: 'article',
  },
};

export default function GerrymanderingGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'What Is Gerrymandering?', href: '/guides/what-is-gerrymandering' }]} />
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
          What Is Gerrymandering and How Does It Affect You?
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Gerrymandering is the practice of drawing electoral district boundaries to give one party or group an unfair advantage. It&apos;s one of the most important — and least understood — forces shaping American elections. Here&apos;s how it works and what you can do about it.
          </p>

          {/* How Redistricting Works */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </span>
              How Redistricting Works
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                After each decennial US Census, congressional and state legislative district boundaries are redrawn to reflect population changes. The Constitution requires that congressional districts have roughly equal populations. This process is called redistricting.
              </p>
              <p>
                In most states, the state legislature draws the maps, often with the governor&apos;s approval. This gives the party in power significant control over district shapes. Some states use independent or bipartisan commissions instead. The last round of redistricting followed the 2020 Census.
              </p>
            </div>
          </section>

          {/* Types of Gerrymandering */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </span>
              Types of Gerrymandering
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Packing</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Concentrating voters of one party into a small number of districts so they win those seats by huge margins but are diluted everywhere else. The packed party &quot;wastes&quot; votes on landslide victories.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cracking</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Splitting a group of voters across multiple districts so they don&apos;t have a majority anywhere. This is the opposite of packing — it dilutes a group&apos;s voting power by spreading them thin.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Partisan vs. Racial Gerrymandering</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Partisan gerrymandering draws lines to benefit one political party. Racial gerrymandering draws lines based on race. The Supreme Court ruled in <em>Rucho v. Common Cause</em> (2019) that federal courts cannot adjudicate partisan gerrymandering claims, though some state courts still can under their state constitutions. Racial gerrymandering, however, remains subject to federal court review under the Voting Rights Act and the Equal Protection Clause.
                </p>
              </div>
            </div>
          </section>

          {/* Effects on Elections */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              How It Affects Elections
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Gerrymandering can make elections less competitive. When districts are drawn to heavily favor one party, the general election becomes a foregone conclusion, and the primary election (with its lower turnout) effectively decides who wins. This can reduce voter engagement and make elected officials less responsive to the full range of their constituents.
              </p>
              <p>
                It can also create a gap between the statewide popular vote and the distribution of seats. A party that wins a minority of votes statewide can sometimes win a majority of seats due to how district lines are drawn.
              </p>
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
              What Citizens Can Do
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Support independent redistricting</strong>: Several states have adopted independent commissions through ballot initiatives. Organizations like the <a href="https://gerrymander.princeton.edu/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Princeton Gerrymandering Project</a> grade redistricting plans for fairness.</li>
                <li><strong className="text-gray-900 dark:text-white">Participate in the redistricting process</strong>: Many states hold public hearings during redistricting. Attend and testify about how your community should be represented. See our guide on <Link href="/guides/how-to-testify-at-a-public-hearing" className="text-purple-600 dark:text-purple-400 hover:underline">testifying at public hearings</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Know your district</strong>: Check how your congressional district is drawn using <a href="https://www.census.gov/programs-surveys/geography.html" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Census Bureau maps</a> or <a href="https://ballotpedia.org/Redistricting" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Ballotpedia&apos;s redistricting pages</a>.</li>
                <li><strong className="text-gray-900 dark:text-white">Vote in primaries</strong>: In gerrymandered districts, <Link href="/guides/how-to-vote-in-a-primary-election" className="text-purple-600 dark:text-purple-400 hover:underline">the primary is the competitive election</Link>. Make your voice heard there.</li>
                <li><strong className="text-gray-900 dark:text-white">Contact your state legislators</strong>: In most states, the legislature controls redistricting. <Link href="/guides/how-to-contact-your-state-legislators" className="text-purple-600 dark:text-purple-400 hover:underline">Tell your state legislators</Link> you support fair maps.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/who-are-my-representatives" className="text-purple-600 dark:text-purple-400 hover:underline">Who Are My Representatives?</Link></li>
              <li><Link href="/guides/how-to-vote-in-a-primary-election" className="text-purple-600 dark:text-purple-400 hover:underline">How to Vote in a Primary Election</Link></li>
              <li><Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">How to Get Involved in Local Politics</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Want to take action?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Contact your state legislators about redistricting reform.</p>
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
