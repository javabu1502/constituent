import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Start or Sign a Petition | My Democracy',
  description: 'Learn how to create, circulate, and deliver effective petitions to decision-makers. Understand when petitions work, how to collect signatures, and which platforms to use.',
  keywords: ['petition', 'how to start a petition', 'sign a petition', 'civic action', 'grassroots advocacy', 'petition platforms', 'collecting signatures', 'community organizing'],
  openGraph: {
    title: 'How to Start or Sign a Petition | My Democracy',
    description: 'A practical guide to creating, circulating, and delivering effective petitions to decision-makers.',
    type: 'article',
  },
};

export default function StartAPetitionGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Start or Sign a Petition', href: '/guides/how-to-start-a-petition' }]} />
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
          How to Start or Sign a Petition
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Petitions are one of the oldest tools of democratic participation. The First Amendment to the U.S. Constitution explicitly protects the right &quot;to petition the Government for a redress of grievances.&quot; Whether you&apos;re collecting signatures online or going door-to-door, a well-crafted petition shows decision-makers that your concern has broad community support.
          </p>

          {/* When Petitions Make a Difference */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              When Petitions Make a Difference
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Petitions are most effective when they target a specific decision-maker who has the authority to act on your request. They work well in several situations:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Before a vote or decision</strong>: If a city council, school board, or legislature is about to vote on an issue, a petition delivered beforehand shows the breadth of public interest.</li>
                <li><strong className="text-gray-900 dark:text-white">Ballot initiatives and referendums</strong>: In many states and municipalities, gathering a required number of valid signatures can place a measure directly on the ballot. Each state sets its own signature thresholds and filing rules — check with your state or local election office for specifics.</li>
                <li><strong className="text-gray-900 dark:text-white">Raising awareness</strong>: Even when a petition doesn&apos;t trigger a formal process, it can attract media attention and demonstrate that an issue has widespread support.</li>
                <li><strong className="text-gray-900 dark:text-white">Corporate and institutional change</strong>: Petitions can also target private organizations — employers, universities, or companies — asking them to change a policy or practice.</li>
              </ul>
              <p>
                Petitions are less effective when the ask is vague, when they target someone without authority over the issue, or when they substitute for deeper organizing. Think of a petition as one tool in your advocacy toolkit, not the entire strategy.
              </p>
            </div>
          </section>

          {/* Creating an Effective Petition */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              Creating an Effective Petition
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                A strong petition is clear, specific, and action-oriented. Here&apos;s what to include:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">A specific recipient</strong>: Name the person or body with the power to make the change — for example, &quot;To the Mayor of Springfield&quot; or &quot;To the Board of Education, District 5.&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">A clear statement of the problem</strong>: In two to three sentences, explain what the issue is and why it matters. Stick to facts and avoid inflammatory language.</li>
                <li><strong className="text-gray-900 dark:text-white">A concrete ask</strong>: State exactly what action you want the recipient to take. &quot;We request that the city council allocate funding for a new crosswalk at Elm Street and 3rd Avenue&quot; is far stronger than &quot;We want safer streets.&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">Supporting context</strong>: Include brief, factual background — relevant data, community impact, or a short personal story that illustrates the issue.</li>
                <li><strong className="text-gray-900 dark:text-white">Space for signatures</strong>: Whether digital or on paper, include fields for the signer&apos;s name, address (or zip code), and date. If the petition is for a ballot initiative, your state may require additional information like a printed name or voter registration number.</li>
              </ul>
            </div>
          </section>

          {/* Collecting Signatures */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Collecting Signatures
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                The number of signatures you need depends on your goal. For a formal ballot initiative, your state or local government sets the threshold. For an advocacy petition, there is no magic number — but more signatures mean more credibility. Here are strategies for building support:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Start with your network</strong>: Ask friends, family, neighbors, and colleagues to sign first. Early momentum makes the petition feel credible to new signers.</li>
                <li><strong className="text-gray-900 dark:text-white">Go door-to-door</strong>: In-person conversations are the most effective way to collect signatures, especially for local issues. Be prepared to explain the issue in 30 seconds or less.</li>
                <li><strong className="text-gray-900 dark:text-white">Set up at community events</strong>: Farmers markets, festivals, and community meetings are excellent places to reach new people. Check whether you need a permit to collect signatures in public spaces in your area.</li>
                <li><strong className="text-gray-900 dark:text-white">Use social media</strong>: Share the petition link on neighborhood forums, community Facebook groups, and other social platforms. Ask supporters to share it with their own networks.</li>
                <li><strong className="text-gray-900 dark:text-white">Partner with organizations</strong>: Local advocacy groups, neighborhood associations, and houses of worship can amplify your reach significantly.</li>
              </ul>
              <p>
                If you are collecting signatures for a formal ballot measure, be sure to follow your state&apos;s rules carefully. Many states require that petition circulators be registered voters, that signatures be collected within a specific timeframe, and that each signature sheet include specific legal language.
              </p>
            </div>
          </section>

          {/* Delivering Your Petition */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Delivering Your Petition
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                How you deliver a petition can be just as important as what it says. A thoughtful delivery strategy maximizes your impact:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Deliver in person</strong>: Schedule a meeting with the decision-maker or deliver the petition at their office. Bring a small delegation of signers to reinforce that real people stand behind the request.</li>
                <li><strong className="text-gray-900 dark:text-white">Present at a public meeting</strong>: Deliver the petition during the public comment period at a city council, school board, or other government meeting. This puts your issue on the public record.</li>
                <li><strong className="text-gray-900 dark:text-white">Notify the media</strong>: Send a press release or media advisory before your delivery. A petition delivery with a clear narrative makes a good local news story.</li>
                <li><strong className="text-gray-900 dark:text-white">Follow up</strong>: After delivering the petition, request a response. If you don&apos;t hear back within a reasonable timeframe, follow up with a phone call or letter referencing the petition and the number of signers.</li>
              </ul>
              <p>
                For ballot initiatives, delivery means filing the petition with your state or local election office by the required deadline. Signatures will then be verified against voter registration records.
              </p>
            </div>
          </section>

          {/* Online Petition Platforms */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </span>
              Online Petition Platforms
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Online platforms make it easy to create and share petitions, though they serve different purposes:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Change.org</strong>: One of the largest petition platforms, used for a wide range of causes. Petitions are public and can be shared broadly. Note that Change.org signatures typically do not count toward formal ballot initiative requirements.</li>
                <li><strong className="text-gray-900 dark:text-white">MoveOn Petitions</strong>: Focused on progressive policy issues. Petitions can be shared with the MoveOn community for additional visibility.</li>
                <li><strong className="text-gray-900 dark:text-white">Care2 Petitions</strong>: A platform oriented toward social justice, human rights, and environmental causes.</li>
                <li><strong className="text-gray-900 dark:text-white">Your own website or form</strong>: For local issues, a simple online form or sign-up sheet gives you full control over the data and presentation. Tools like Google Forms or dedicated petition software can work well.</li>
              </ul>
              <p>
                Keep in mind that online signatures carry less weight with some decision-makers than handwritten ones, especially at the local level. For maximum impact, consider combining online and in-person signature collection.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-organize-your-neighbors" className="text-purple-600 dark:text-purple-400 hover:underline">How to Organize Your Neighbors Around an Issue</Link></li>
              <li><Link href="/guides/how-to-run-a-successful-campaign" className="text-purple-600 dark:text-purple-400 hover:underline">How to Run a Successful Campaign</Link></li>
              <li><Link href="/guides/how-to-attend-a-town-hall" className="text-purple-600 dark:text-purple-400 hover:underline">How to Attend a Town Hall Meeting</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ready to make your voice heard?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Pair your petition with a direct message to your elected officials for maximum impact.</p>
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
