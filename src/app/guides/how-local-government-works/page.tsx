import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How Local Government Works | My Democracy',
  description: 'Understand how local government works — city councils, county boards, school boards, and special districts. Learn how local elections work and how to get involved.',
  keywords: ['local government', 'city council', 'school board', 'county government', 'mayor', 'municipal government', 'local elections', 'zoning'],
  alternates: {
    canonical: 'https://www.mydemocracy.app/guides/how-local-government-works',
  },
  openGraph: {
    title: 'How Local Government Works | My Democracy',
    description: 'Understand how local government works — city councils, county boards, school boards, and special districts. Learn how local elections work and how to get involved.',
    type: 'article',
  },
};

export default function LocalGovernmentGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How Local Government Works', href: '/guides/how-local-government-works' }]} />
      <FaqJsonLd items={[
        { question: 'What is the difference between a mayor-council and council-manager government?', answer: 'In a mayor-council system, the mayor is the chief executive with significant administrative authority, and the council serves as the legislative body. In a council-manager system, the council sets policy and hires a professional city manager to handle day-to-day operations, while the mayor\'s role is largely ceremonial. About 55% of US cities use the council-manager form, while about 34% use the mayor-council form.' },
        { question: 'How do I find out who my local elected officials are?', answer: 'Start with your city or county government website, which typically lists elected officials and their contact information. You can also check your county clerk or board of elections website, or search your address on your state\'s voter information portal. Many cities also post meeting schedules and agendas online so you can see who is making decisions in your community.' },
        { question: 'Can I attend city council meetings?', answer: 'Yes. City council meetings are public by law under your state\'s open meetings act. Most meetings include a public comment period where residents can speak for 2-3 minutes on any topic. Some cities also allow virtual attendance. Check your city\'s website for the meeting schedule, location, and any rules for public participation.' },
      ]} />
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
          How Local Government Works
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Local government is the level of government that most directly affects your daily life — from the roads you drive on and the schools your children attend to the water you drink and the parks you visit. It&apos;s also the level where your voice has the most impact.
          </p>

          {/* Why Local Government Matters */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              Why Local Government Matters
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                While national politics dominates the news, local government handles the issues that shape your everyday life:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Roads and infrastructure</strong>: Street maintenance, traffic signals, sidewalks, bridges, and public transit.</li>
                <li><strong className="text-gray-900 dark:text-white">Public schools</strong>: School budgets, curriculum decisions, teacher hiring, and school construction.</li>
                <li><strong className="text-gray-900 dark:text-white">Public safety</strong>: Police and fire departments, emergency services, and public health.</li>
                <li><strong className="text-gray-900 dark:text-white">Zoning and land use</strong>: What can be built where — housing, businesses, parks, industrial areas.</li>
                <li><strong className="text-gray-900 dark:text-white">Water and utilities</strong>: Clean water, sewage treatment, trash collection, and utility regulation.</li>
                <li><strong className="text-gray-900 dark:text-white">Parks and recreation</strong>: Public parks, community centers, libraries, and recreational programs.</li>
              </ul>
              <p>
                Local officials are also the most accessible elected officials you have. Your city council member might live on your block. Your school board member shops at the same grocery store. This proximity means your voice carries real weight.
              </p>
            </div>
          </section>

          {/* Types of Local Government */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Types of Local Government
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Counties</h3>
                <p className="text-sm">
                  Counties (called parishes in Louisiana, boroughs in Alaska) are the primary subdivision of states. They typically handle courts, jails, vital records, elections, property assessment, and road maintenance in unincorporated areas. There are over 3,000 counties in the US.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Municipalities</h3>
                <p className="text-sm">
                  Cities, towns, and villages are incorporated municipalities with their own governments. They provide services like police, fire, water, sewage, and parks. Their authority comes from the state through a charter or general law.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Townships</h3>
                <p className="text-sm">
                  Used primarily in Midwestern and Northeastern states, townships are geographic subdivisions of counties that provide local services. Some are quite active; others exist largely on paper.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Special Districts</h3>
                <p className="text-sm">
                  These single-purpose entities handle specific services like water supply, fire protection, libraries, parks, or transit. They often cross municipal boundaries and have their own taxing authority. There are tens of thousands of special districts across the US.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">School Districts</h3>
                <p className="text-sm">
                  Independent school districts have elected boards that set budgets, hire superintendents, approve curriculum, and manage school facilities. School board elections often have the lowest voter turnout of any election, despite their enormous impact on communities.
                </p>
              </div>
            </div>
          </section>

          {/* Common Structures */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </span>
              Common Structures
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mayor-Council</h3>
                <p className="text-sm">
                  An elected mayor serves as chief executive, and an elected council serves as the legislative body. In a <strong className="text-gray-900 dark:text-white">strong mayor</strong> system, the mayor has significant authority including hiring and firing department heads and vetoing legislation. In a <strong className="text-gray-900 dark:text-white">weak mayor</strong> system, executive power is shared with the council.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Council-Manager</h3>
                <p className="text-sm">
                  The elected council sets policy and hires a professional <strong className="text-gray-900 dark:text-white">city manager</strong> to handle day-to-day administration. The mayor is typically a council member who serves as chair — a largely ceremonial role. This is the most common form of city government in the US.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">At-Large vs. District Representation</h3>
                <p className="text-sm">
                  In <strong className="text-gray-900 dark:text-white">at-large</strong> systems, all council members are elected by all voters citywide. In <strong className="text-gray-900 dark:text-white">district</strong> (ward) systems, the city is divided into geographic areas, and each area elects its own representative. Many cities use a hybrid: some at-large seats and some district seats. District systems tend to produce more diverse representation.
                </p>
              </div>
            </div>
          </section>

          {/* What Local Officials Do */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              What Local Officials Do
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Budgets</strong>: Approving annual budgets that determine spending on police, fire, schools, parks, and infrastructure. Property taxes are the primary funding source for most local governments.</li>
                <li><strong className="text-gray-900 dark:text-white">Ordinances</strong>: Passing local laws on noise, parking, business regulations, animal control, building codes, and more.</li>
                <li><strong className="text-gray-900 dark:text-white">Zoning</strong>: Deciding what can be built where — residential, commercial, industrial, mixed-use. Zoning decisions shape the character of neighborhoods and affect housing availability and affordability.</li>
                <li><strong className="text-gray-900 dark:text-white">Public safety</strong>: Overseeing police and fire departments, setting policing policies, and responding to public safety concerns.</li>
                <li><strong className="text-gray-900 dark:text-white">Infrastructure</strong>: Managing road construction, water and sewer systems, public transit, and capital improvement projects.</li>
              </ul>
            </div>
          </section>

          {/* How Local Elections Work */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </span>
              How Local Elections Work
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Off-cycle elections</strong>: Many local elections are held in odd-numbered years or in spring, separate from federal elections. This means significantly lower turnout — often below 20%.</li>
                <li><strong className="text-gray-900 dark:text-white">Low turnout = high impact</strong>: Because so few people vote in local elections, your individual vote carries enormous weight. In many school board and city council races, the margin of victory is just a few dozen votes.</li>
                <li><strong className="text-gray-900 dark:text-white">Nonpartisan races</strong>: Many local elections are officially nonpartisan — candidates don&apos;t appear with party labels on the ballot. This means you need to research candidates independently.</li>
                <li><strong className="text-gray-900 dark:text-white">Ballot measures</strong>: Local ballot measures can cover bond issues, tax increases, zoning changes, and policy questions. These directly affect your property taxes and local services. <Link href="/guides/ballot-measures" className="text-purple-600 dark:text-purple-400 hover:underline">Learn how to evaluate ballot measures</Link>.</li>
              </ul>
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
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Attend meetings</strong>: City council, county board, school board, and planning commission meetings are open to the public. Showing up is the most direct way to see how decisions are made. <Link href="/guides/how-to-attend-a-town-hall" className="text-purple-600 dark:text-purple-400 hover:underline">Learn how to attend effectively</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Speak during public comment</strong>: Most meetings have a public comment period. Prepare a brief (2-3 minute) statement on an issue you care about. <Link href="/guides/how-to-testify-at-a-public-hearing" className="text-purple-600 dark:text-purple-400 hover:underline">Learn how to testify at a public hearing</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Run for office</strong>: Local offices often have low barriers to entry — minimal filing fees, no fundraising requirements, and small districts. Many local officials started by simply deciding to run.</li>
                <li><strong className="text-gray-900 dark:text-white">Vote in every election</strong>: Don&apos;t skip local elections. The officials who manage your schools, police, water, and roads are chosen in these races. Check your local election calendar and make a plan to vote in every one.</li>
                <li><strong className="text-gray-900 dark:text-white">Join a board or commission</strong>: Most cities have appointed boards for planning, parks, libraries, and other services. These are volunteer positions that give you direct input on policy decisions.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Get Involved in Local Politics
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-attend-a-town-hall" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Attend a Town Hall
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-testify-at-a-public-hearing" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Testify at a Public Hearing
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-organize-your-neighbors" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Organize Your Neighbors Around an Issue
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to engage with your local government?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Start with practical steps to get involved in the decisions that affect your community most.
          </p>
          <Link
            href="/guides/how-to-get-involved-in-local-politics"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Get Involved Locally
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
