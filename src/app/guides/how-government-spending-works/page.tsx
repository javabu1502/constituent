import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How Government Spending Works | Federal Budget Explained | My Democracy',
  description: 'Understand the federal budget process: how Congress appropriates money, the difference between mandatory and discretionary spending, and where to track government spending.',
  keywords: ['government spending', 'federal budget', 'how federal budget works', 'appropriations', 'mandatory spending', 'discretionary spending', 'government budget process'],
  openGraph: {
    title: 'How Government Spending Works | Federal Budget Explained | My Democracy',
    description: 'Understand how the federal budget works and where your tax dollars go.',
    type: 'article',
  },
};

export default function GovernmentSpendingGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How Government Spending Works', href: '/guides/how-government-spending-works' }]} />
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
          How Government Spending Works
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            The federal budget determines how the government collects and spends trillions of dollars each year. Understanding this process helps you follow policy debates, hold your representatives accountable, and see where your tax dollars go.
          </p>

          {/* The Budget Process */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </span>
              The Federal Budget Process
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>The federal fiscal year runs from October 1 to September 30. The annual budget process generally follows these steps:</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">President&apos;s Budget Request</p>
                    <p className="text-sm">The President submits a budget proposal to Congress, typically in early February. This is a request — Congress is not required to follow it.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Congressional Budget Resolution</p>
                    <p className="text-sm">The House and Senate Budget Committees draft a budget resolution that sets overall spending levels. This resolution is not signed by the President and doesn&apos;t have the force of law — it&apos;s an internal framework for Congress.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Appropriations Bills</p>
                    <p className="text-sm">The House and Senate Appropriations Committees write 12 annual spending bills that fund specific areas of government. These must pass both chambers and be signed by the President before the fiscal year begins.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">4</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Continuing Resolutions &amp; Shutdowns</p>
                    <p className="text-sm">If Congress doesn&apos;t pass all 12 bills on time, it may pass a continuing resolution (CR) to keep the government funded at current levels temporarily. If no funding is enacted, affected agencies shut down.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Types of Spending */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </span>
              Mandatory vs. Discretionary Spending
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mandatory Spending</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Programs authorized by permanent law that continue without annual congressional action. The largest mandatory programs include Social Security, Medicare, and Medicaid. Mandatory spending accounts for the majority of the federal budget. Changing these programs requires passing new legislation — they are not part of the annual appropriations process.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Discretionary Spending</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Funding that Congress must approve each year through the 12 appropriations bills. This includes defense, education, transportation, scientific research, foreign aid, and the day-to-day operations of federal agencies. Discretionary spending is where most annual budget debates focus.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Interest on the Debt</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The federal government pays interest on the national debt. This is a legally obligated payment that has grown as the debt has increased. Interest payments are separate from both mandatory programs and discretionary spending.
                </p>
              </div>
            </div>
          </section>

          {/* How to Track Spending */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Where to Track Government Spending
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">USASpending.gov</strong>: The official source for federal spending data. <a href="https://www.usaspending.gov/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">USASpending.gov</a> lets you search by agency, program, recipient, or location.</li>
                <li><strong className="text-gray-900 dark:text-white">Congressional Budget Office (CBO)</strong>: The nonpartisan <a href="https://www.cbo.gov/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">CBO</a> provides independent analysis of the budget and the cost of proposed legislation.</li>
                <li><strong className="text-gray-900 dark:text-white">Government Accountability Office (GAO)</strong>: The <a href="https://www.gao.gov/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">GAO</a> audits government programs and reports on waste, fraud, and inefficiency.</li>
                <li><strong className="text-gray-900 dark:text-white">Congress.gov</strong>: Track <a href="https://www.congress.gov/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">appropriations bills</a> and budget legislation as they move through Congress.</li>
              </ul>
            </div>
          </section>

          {/* How You Can Engage */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </span>
              How You Can Engage
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Contact your reps during budget season</strong>: The budget and appropriations process runs from February through September. Let your representatives know your spending priorities.</li>
                <li><strong className="text-gray-900 dark:text-white">Follow appropriations bills</strong>: Use our <Link href="/guides/how-to-track-legislation" className="text-purple-600 dark:text-purple-400 hover:underline">legislation tracking guide</Link> to follow specific spending bills.</li>
                <li><strong className="text-gray-900 dark:text-white">Attend hearings</strong>: Appropriations subcommittee hearings are public. Check <a href="https://www.congress.gov/committees" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a> for schedules.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">How a Bill Becomes Law</Link></li>
              <li><Link href="/guides/how-congress-votes" className="text-purple-600 dark:text-purple-400 hover:underline">How Congress Votes and What It Means</Link></li>
              <li><Link href="/guides/how-to-track-legislation" className="text-purple-600 dark:text-purple-400 hover:underline">How to Track Legislation</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Have spending priorities?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Tell your representatives what you think the budget should fund.</p>
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
