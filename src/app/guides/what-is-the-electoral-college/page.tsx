import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'What Is the Electoral College and How Does It Work? | My Democracy',
  description: 'How the Electoral College works, why it exists, how electors are chosen, and what it means for your vote in presidential elections.',
  keywords: ['electoral college', 'how electoral college works', 'electors', 'presidential election', 'swing states', 'winner take all', 'faithless electors', 'electoral votes', '270 to win'],
  openGraph: {
    title: 'What Is the Electoral College and How Does It Work? | My Democracy',
    description: 'How the Electoral College works, why it exists, how electors are chosen, and what it means for your vote in presidential elections.',
    type: 'article',
  },
};

export default function ElectoralCollegeGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'What Is the Electoral College?', href: '/guides/what-is-the-electoral-college' }]} />
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
          What Is the Electoral College and How Does It Work?
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            The Electoral College — not the popular vote — decides who becomes President of the United States. Understanding how it works explains why candidates focus on certain states, why your state&apos;s rules matter, and what your vote actually determines on Election Day.
          </p>

          {/* What Is the Electoral College? */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              What Is the Electoral College?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>The Electoral College is a group of 538 electors who formally elect the President and Vice President of the United States. It&apos;s not a place — it&apos;s a process that takes place every four years.</p>
              <p>The system was established by Article II of the Constitution and later modified by the 12th Amendment (separating presidential and vice-presidential ballots) and the 23rd Amendment (granting electoral votes to Washington, D.C.).</p>
              <p>A candidate needs at least <strong className="text-gray-900 dark:text-white">270 electoral votes</strong> — a simple majority of 538 — to win the presidency. If no candidate reaches 270, the House of Representatives chooses the President, with each state delegation casting one vote.</p>
            </div>
          </section>

          {/* How Electors Are Allocated */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              How Electors Are Allocated
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Each state&apos;s electoral votes equal its total congressional representation: the number of House seats plus two senators. Washington, D.C. receives 3 electoral votes under the 23rd Amendment.</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Every state gets at least <strong className="text-gray-900 dark:text-white">3 electoral votes</strong> (1 House seat minimum + 2 senators), regardless of population.</li>
                <li>The most populous state, California, currently has <strong className="text-gray-900 dark:text-white">54 electoral votes</strong>. States like Wyoming, Vermont, and Alaska have the minimum of 3.</li>
                <li>Electoral votes are <strong className="text-gray-900 dark:text-white">reapportioned after each census</strong> as House seats shift to reflect population changes. The most recent reapportionment followed the 2020 Census.</li>
              </ul>
              <p className="text-sm">This means small states have proportionally more electoral power per capita than large states — a deliberate feature of the system that continues to shape presidential strategy.</p>
            </div>
          </section>

          {/* How Electors Are Chosen and How They Vote */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </span>
              How Electors Are Chosen and How They Vote
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Each political party nominates a slate of electors in every state, typically loyal party members, activists, or officials. When you vote for a presidential candidate, you&apos;re actually voting for that candidate&apos;s slate of electors.</p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Winner-Take-All (48 States + D.C.)</h3>
                  <p className="text-sm">In most states, the candidate who wins the popular vote receives <strong className="text-gray-900 dark:text-white">all</strong> of that state&apos;s electoral votes. Win by one vote or one million — the result is the same.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Congressional District Method (Maine &amp; Nebraska)</h3>
                  <p className="text-sm">These two states split their electoral votes: one elector is awarded per congressional district based on the district-level vote, and two go to the statewide winner. This means these states can split their electoral votes between candidates.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">The Formal Vote</h3>
                  <p className="text-sm">In December, winning electors meet in their state capitals to cast their ballots. The results are sent to Congress, where they are formally counted in a joint session in early January — a process that became the focus of national attention after the events of January 6, 2021.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Faithless Electors */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              Faithless Electors
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>A &quot;faithless elector&quot; is one who votes for someone other than the candidate they pledged to support. While rare, it has happened throughout American history — most recently in 2016, when seven electors broke their pledges.</p>
              <p>In <strong className="text-gray-900 dark:text-white"><em>Chiafalo v. Washington</em> (2020)</strong>, the Supreme Court ruled unanimously that states can legally bind their electors and enforce penalties for faithless voting. Most states now have such laws in place.</p>
              <p className="text-sm">Faithless electors have never changed the outcome of a presidential election.</p>
            </div>
          </section>

          {/* Swing States and Campaign Strategy */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Swing States and Campaign Strategy
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Because most states reliably vote for one party, presidential campaigns concentrate their time, money, and attention on a handful of competitive &quot;swing states&quot; (also called battleground states) where the outcome is uncertain.</p>
              <p>This means candidates tailor their policy positions, ad spending, and campaign stops to the concerns of voters in these states — while voters in solidly red or blue states receive far less attention.</p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Popular Vote vs. Electoral Vote</h3>
                  <p className="text-sm">The winner-take-all system means a candidate can win the presidency without winning the national popular vote. This has happened five times in American history, most recently in <strong className="text-gray-900 dark:text-white">2000</strong> (George W. Bush) and <strong className="text-gray-900 dark:text-white">2016</strong> (Donald Trump). These outcomes fuel ongoing debate about whether the system fairly represents the will of all voters.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Reform Efforts */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </span>
              Reform Efforts
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>The Electoral College has been the subject of reform proposals since the nation&apos;s founding. Here are the main approaches being discussed today:</p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">National Popular Vote Interstate Compact (NPVIC)</h3>
                  <p className="text-sm">A state-level agreement where participating states pledge to award their electoral votes to the national popular vote winner — but only once states representing 270+ electoral votes join. As of 2024, states with 209 electoral votes have signed on. Supporters say it would ensure every vote counts equally; critics argue it undermines the federal structure the founders intended.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Constitutional Amendment</h3>
                  <p className="text-sm">Some proposals would abolish the Electoral College entirely in favor of a direct national popular vote. This requires a two-thirds vote in both chambers of Congress and ratification by three-fourths of state legislatures — a very high bar.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Proportional Allocation &amp; Ranked Choice</h3>
                  <p className="text-sm">Other proposals would award electoral votes proportionally based on each state&apos;s popular vote, or adopt ranked-choice voting for presidential elections. These changes could be adopted state by state without amending the Constitution.</p>
                </div>
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
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong className="text-gray-900 dark:text-white">Vote</strong> — your vote determines which slate of electors represents your state. In close states, every vote can tip the balance of all your state&apos;s electoral votes.</li>
                <li><strong className="text-gray-900 dark:text-white">Pay attention to down-ballot races</strong> — state legislators draw congressional districts after each census, and the number of House seats directly affects your state&apos;s electoral votes.</li>
                <li><strong className="text-gray-900 dark:text-white">Contact your state legislators</strong> — they control how your state allocates its electoral votes. If you support or oppose changes like the NPVIC, let them know.</li>
                <li><strong className="text-gray-900 dark:text-white">Stay informed</strong> — understand <Link href="/guides/understanding-your-ballot" className="text-purple-600 dark:text-purple-400 hover:underline">your full ballot</Link> and make sure you&apos;re <Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">registered to vote</Link>.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">How a Bill Becomes Law</Link></li>
              <li><Link href="/guides/how-congress-votes" className="text-purple-600 dark:text-purple-400 hover:underline">How Congress Votes and What It Means</Link></li>
              <li><Link href="/guides/understanding-your-ballot" className="text-purple-600 dark:text-purple-400 hover:underline">Understanding Your Ballot</Link></li>
              <li><Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">How to Register to Vote</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ready to make your vote count?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Make sure you&apos;re registered and ready for the next election.</p>
          <Link href="/guides/how-to-register-to-vote" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Register to Vote
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
