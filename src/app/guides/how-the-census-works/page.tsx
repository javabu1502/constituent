import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How the Census Works | My Democracy',
  description: 'Learn how the US Census works, why it matters for congressional representation and federal funding, and how you can participate and make your community count.',
  keywords: ['census', 'US census', 'census 2030', 'how the census works', 'apportionment', 'redistricting', 'census Bureau', 'federal funding'],
  alternates: {
    canonical: 'https://www.mydemocracy.app/guides/how-the-census-works',
  },
  openGraph: {
    title: 'How the Census Works | My Democracy',
    description: 'Learn how the US Census works, why it matters for congressional representation and federal funding, and how you can participate and make your community count.',
    type: 'article',
  },
};

export default function CensusGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How the Census Works', href: '/guides/how-the-census-works' }]} />
      <FaqJsonLd items={[
        { question: 'Who is required to fill out the census?', answer: 'Everyone living in the United States is required to be counted in the census, regardless of citizenship status, age, or immigration status. This includes citizens, permanent residents, undocumented immigrants, and people on long-term visas. The Constitution mandates counting every person, not just citizens. One person in each household typically fills out the form for everyone living there.' },
        { question: 'How does the census affect my congressional representation?', answer: 'Census data is used to apportion the 435 seats in the US House of Representatives among the 50 states. States that grow in population may gain seats, while states that lose population may lose seats. After apportionment, states use census data to redraw congressional and state legislative district boundaries, which directly affects who represents you.' },
        { question: 'When is the next US census?', answer: 'The next decennial census will take place in 2030. The US Census Bureau conducts the full census every 10 years, as required by the Constitution. In between, the American Community Survey (ACS) collects detailed demographic data from a sample of households each year.' },
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
          How the Census Works
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Every ten years, the United States counts every person living within its borders. The census determines how many representatives each state gets in Congress, how electoral votes are distributed, and how more than $2.8 trillion in federal funding is allocated. It&apos;s one of the most consequential exercises in American democracy.
          </p>

          {/* What Is the Census? */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What Is the Census?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                The census is a constitutionally mandated population count required by <strong className="text-gray-900 dark:text-white">Article I, Section 2</strong> of the US Constitution. Every ten years, the Census Bureau must count every person residing in the United States — not just citizens, but everyone.
              </p>
              <p>
                The first census was conducted in 1790 under Secretary of State Thomas Jefferson. US marshals went door-to-door counting 3.9 million people. Today, the Census Bureau uses mail, online forms, and in-person visits to count over 330 million people.
              </p>
              <p>
                The census asks basic demographic questions: how many people live in the household, their ages, sex, race, ethnicity, and whether they own or rent. Your answers are protected by law — Title 13 of the US Code makes it illegal for the Census Bureau to share individual responses with any government agency, including law enforcement and immigration authorities.
              </p>
            </div>
          </section>

          {/* Why It Matters */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              Why It Matters
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">House apportionment</strong>: The 435 seats in the US House of Representatives are divided among the states based on population. After the 2020 census, six states gained seats and seven lost seats.</li>
                <li><strong className="text-gray-900 dark:text-white">Redistricting</strong>: Census data is used to redraw congressional districts, state legislative districts, and local election boundaries. The maps determine which communities share representation.</li>
                <li><strong className="text-gray-900 dark:text-white">Electoral votes</strong>: Each state&apos;s electoral vote count equals its House seats plus two senators. Census shifts in apportionment directly change the electoral map.</li>
                <li><strong className="text-gray-900 dark:text-white">Federal funding</strong>: More than <strong className="text-gray-900 dark:text-white">$2.8 trillion</strong> in annual federal spending is distributed based on census data — including Medicaid, SNAP, highway funding, school grants, and housing assistance. An undercount means less money for your community.</li>
              </ul>
            </div>
          </section>

          {/* How It's Conducted */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              How It&apos;s Conducted
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                The decennial census follows a multi-phase process:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Invitations</strong>: In March of the census year, most households receive an invitation to respond online, by phone, or by mail.</li>
                <li><strong className="text-gray-900 dark:text-white">Self-response period</strong>: Households have several months to complete the questionnaire. The 2020 census was the first to allow online responses.</li>
                <li><strong className="text-gray-900 dark:text-white">Non-Response Follow-Up (NRFU)</strong>: Census workers visit households that haven&apos;t responded. This is the most labor-intensive and expensive phase.</li>
                <li><strong className="text-gray-900 dark:text-white">Data processing</strong>: Responses are compiled, verified, and processed. The Census Bureau uses statistical methods to account for missing data.</li>
                <li><strong className="text-gray-900 dark:text-white">Results delivered</strong>: Apportionment counts are delivered to the President by December 31 of the census year. Detailed redistricting data follows in the spring.</li>
              </ol>
              <p>
                Between decennial censuses, the <strong className="text-gray-900 dark:text-white">American Community Survey (ACS)</strong> collects more detailed demographic, economic, and housing data from a sample of about 3.5 million households annually. This data informs policy decisions and federal funding formulas year-round.
              </p>
            </div>
          </section>

          {/* Challenges and Controversies */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              Challenges and Controversies
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Undercounting</h3>
                <p className="text-sm">
                  Certain populations are consistently undercounted: young children, renters, people experiencing homelessness, racial and ethnic minorities, rural residents, and immigrant communities. An undercount means less political representation and less federal funding for these communities.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">The Citizenship Question</h3>
                <p className="text-sm">
                  The 2020 census saw a major legal battle over whether to add a citizenship question. The Supreme Court blocked it, ruling that the stated rationale was contrived. Critics argued the question would discourage participation among immigrant communities. The debate highlights the tension between data collection and its potential effects on response rates.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Hard-to-Count Populations</h3>
                <p className="text-sm">
                  People in group quarters (college dorms, prisons, nursing homes), those without stable addresses, and communities with limited internet access pose persistent challenges. The Census Bureau invests heavily in outreach and partnerships with local organizations to reach these populations.
                </p>
              </div>
            </div>
          </section>

          {/* Redistricting Connection */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </span>
              The Redistricting Connection
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Census data is the foundation of redistricting — the process of redrawing electoral district boundaries. Here&apos;s how the pieces connect:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Apportionment</strong>: Census population counts determine how many House seats each state receives.</li>
                <li><strong className="text-gray-900 dark:text-white">New district maps</strong>: States use detailed census data to draw new congressional and state legislative districts of roughly equal population.</li>
                <li><strong className="text-gray-900 dark:text-white">Electoral votes shift</strong>: Changes in House seats directly change each state&apos;s electoral vote count for presidential elections.</li>
              </ol>
              <p>
                Who draws the maps varies by state — some use independent commissions, others let the state legislature draw them, which can lead to <Link href="/guides/what-is-gerrymandering" className="text-purple-600 dark:text-purple-400 hover:underline">gerrymandering</Link>.
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
              What You Can Do
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Respond to the census</strong>: When the next census arrives, fill it out promptly and completely. Every person counted helps your community receive fair representation and funding.</li>
                <li><strong className="text-gray-900 dark:text-white">Encourage others</strong>: Help family, friends, and neighbors understand why the census matters and encourage them to respond, especially in hard-to-count communities.</li>
                <li><strong className="text-gray-900 dark:text-white">Volunteer</strong>: The Census Bureau hires hundreds of thousands of temporary workers. Local organizations also run outreach campaigns to boost response rates.</li>
                <li><strong className="text-gray-900 dark:text-white">Engage in redistricting</strong>: After census data is released, many states hold public hearings on redistricting. Attend and testify about how your community should be represented. <Link href="/guides/how-to-testify-at-a-public-hearing" className="text-purple-600 dark:text-purple-400 hover:underline">Learn how to testify at a public hearing</Link>.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/what-is-gerrymandering" className="text-purple-600 dark:text-purple-400 hover:underline">
                  What Is Gerrymandering and How Does It Affect You?
                </Link>
              </li>
              <li>
                <Link href="/guides/what-is-the-electoral-college" className="text-purple-600 dark:text-purple-400 hover:underline">
                  What Is the Electoral College and How Does It Work?
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Get Involved in Local Politics
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
            Want to shape how your community is represented?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Contact your state legislators about redistricting and representation.
          </p>
          <Link
            href="/guides/how-to-contact-your-state-legislators"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Contact State Legislators
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
