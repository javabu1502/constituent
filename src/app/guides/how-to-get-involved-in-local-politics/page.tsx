import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Get Involved in Local Politics | My Democracy',
  description: 'Practical guide to getting involved in local government. Learn about city councils, school boards, ballot initiatives, and how to run for local office.',
  keywords: ['local politics', 'get involved in politics', 'city council', 'school board', 'local government', 'civic engagement', 'run for local office', 'ballot initiative'],
  openGraph: {
    title: 'How to Get Involved in Local Politics | My Democracy',
    description: 'Practical guide to getting involved in local government from city councils to school boards.',
    type: 'article',
  },
};

export default function LocalPoliticsGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Local Politics', href: '/guides/how-to-get-involved-in-local-politics' }]} />
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
          How to Get Involved in Local Politics
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Local government makes the decisions that most directly affect your daily life: roads, schools, police, zoning, parks, water. Yet <a href="https://www.pdx.edu/news/who-votes-local-elections" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">fewer than 15% of eligible voters</a> participate in local elections. Here&apos;s how to change that, starting with you.
          </p>

          {/* Why Local Matters */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Why Local Government Matters Most
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Direct impact</strong>: Local decisions about zoning, schools, and infrastructure affect you every day. Federal legislation may take years; a city council vote can change your neighborhood next month.</li>
                <li><strong className="text-gray-900 dark:text-white">Your voice carries more weight</strong>: A city council member might represent 10,000 people instead of 760,000. One phone call or one vote can genuinely swing a decision.</li>
                <li><strong className="text-gray-900 dark:text-white">Less partisanship</strong>: Many local races are nonpartisan. Issues like road repairs, park funding, and school safety cross party lines.</li>
                <li><strong className="text-gray-900 dark:text-white">Pipeline to higher office</strong>: Most state and federal legislators started in local government. The leaders you support locally may shape state and national policy someday.</li>
              </ul>
            </div>
          </section>

          {/* Ways to Get Involved */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </span>
              10 Ways to Get Involved
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Attend City Council / County Board Meetings</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  These meetings are open to the public. Most have a &quot;public comment&quot; period where anyone can speak for 2-3 minutes on any topic. Find your city&apos;s meeting schedule on the municipal website. Many stream live or post recordings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Join a Board or Commission</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Most cities have volunteer boards: planning commission, parks & recreation, library board, public safety, historic preservation. These positions are often appointed by city council and rarely have more applicants than seats. Ask your city clerk how to apply.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Show Up for School Board Meetings</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  School boards control budgets, curriculum standards, and school safety policies. Meetings are public and usually held monthly. Your presence signals community engagement, especially on contentious issues.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. Contact Your Local Officials</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  City council members, mayors, and county commissioners are far more accessible than federal officials. Many give out personal phone numbers and respond to emails within hours. A single email to a city council member can directly influence a vote.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">5. Vote in Every Election</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Local elections often have turnout below 20%. Your vote has dramatically more impact than in national races. Pay special attention to primary elections, bond measures, and ballot initiatives. These often pass or fail by thin margins.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">6. Join or Start a Neighborhood Association</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Neighborhood associations provide a structured way to organize community concerns and present them to local government. They can be powerful advocates for zoning changes, infrastructure improvements, and public safety.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">7. Volunteer on a Campaign</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Local campaigns need volunteers for door-knocking, phone banking, and event organizing. This is the fastest way to learn how local politics actually works, and to build relationships with future officeholders.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">8. Testify at Public Hearings</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Zoning changes, development projects, and new ordinances all require public hearings. Your testimony becomes part of the official record and can directly influence the outcome. Check your city&apos;s website for upcoming hearings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">9. Write Letters to the Editor</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Local newspapers and news sites are closely monitored by local officials. A published letter about a local issue puts your position in front of thousands of voters and the officials who serve them.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">10. Run for Office</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Many local offices go uncontested. School board, city council, water board, library trustee. These positions are achievable starting points. Organizations like <a href="https://runforsomething.net/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Run for Something</a> help first-time candidates from all backgrounds get started.
                </p>
              </div>
            </div>
          </section>

          {/* Finding Your Local Government */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Finding Your Local Government
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2">
                <li>Search &quot;[your city] city council&quot; or &quot;[your county] board of supervisors&quot;</li>
                <li>Check <a href="https://www.usa.gov/local-governments" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">USA.gov&apos;s local government directory</a></li>
                <li>Your state&apos;s secretary of state website often has a local government lookup</li>
                <li>The <Link href="/states" className="text-purple-600 dark:text-purple-400 hover:underline">My Democracy state pages</Link> link to state legislature resources</li>
              </ul>
            </div>
          </section>

          {/* Related */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-contact-your-state-legislators" className="text-purple-600 dark:text-purple-400 hover:underline">How to Contact Your State Legislators</Link></li>
              <li><Link href="/guides/how-to-attend-a-town-hall" className="text-purple-600 dark:text-purple-400 hover:underline">How to Attend a Town Hall</Link></li>
              <li><Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">How to Register to Vote</Link></li>
              <li><Link href="/guides/how-to-track-legislation" className="text-purple-600 dark:text-purple-400 hover:underline">How to Track Legislation</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Start with one action today.</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Contact your state or federal representatives in minutes.</p>
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
