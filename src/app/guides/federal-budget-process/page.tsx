import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'The Federal Budget Process | Step-by-Step Guide | My Democracy',
  description: 'A detailed walkthrough of the federal budget process: the budget calendar, reconciliation, the debt ceiling, CBO scoring, key committees, and when to engage.',
  keywords: ['federal budget process', 'budget reconciliation', 'debt ceiling', 'appropriations', 'CBO scoring', 'sequestration', 'budget committees', 'budget calendar'],
  openGraph: {
    title: 'The Federal Budget Process | Step-by-Step Guide | My Democracy',
    description: 'Understand how the federal budget is created — from the President\'s proposal through appropriations, reconciliation, and the debt ceiling.',
    type: 'article',
  },
};

export default function FederalBudgetProcessGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'The Federal Budget Process', href: '/guides/federal-budget-process' }]} />
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
          The Federal Budget Process
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            The federal budget determines funding for everything from national defense to education to disaster relief. Understanding how it works — and when key decisions happen — lets you weigh in at the moments your voice matters most.
          </p>

          {/* The Budget Calendar */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              The Budget Calendar
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>The federal fiscal year runs from October 1 to September 30. Here&apos;s how the annual budget process unfolds:</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">President&apos;s Budget Request <span className="font-normal text-sm text-gray-500 dark:text-gray-400">(early February)</span></p>
                    <p className="text-sm">The President submits a detailed budget proposal to Congress. The Office of Management and Budget (OMB) coordinates with every federal agency to develop this request. It&apos;s a wish list and a statement of priorities — Congress is not required to follow it.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Congressional Budget Resolution <span className="font-normal text-sm text-gray-500 dark:text-gray-400">(March–April)</span></p>
                    <p className="text-sm">The House and Senate Budget Committees draft a budget resolution that sets overall spending and revenue targets. This resolution is not signed by the President and has no force of law — it&apos;s Congress&apos;s internal spending framework. It establishes &quot;302(a) allocations&quot; that cap how much each appropriations subcommittee can spend.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Appropriations Markup <span className="font-normal text-sm text-gray-500 dark:text-gray-400">(April–September)</span></p>
                    <p className="text-sm">Twelve appropriations subcommittees write individual spending bills covering different areas of government — defense, homeland security, education, transportation, and more. This is where line-item funding decisions are made and where detailed advocacy is most effective.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">4</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Floor Votes &amp; Conference <span className="font-normal text-sm text-gray-500 dark:text-gray-400">(summer)</span></p>
                    <p className="text-sm">Both chambers debate and vote on appropriations bills. When the House and Senate pass different versions of a bill, a conference committee reconciles the differences into a single version that both chambers must approve.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">5</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Presidential Signature or Veto <span className="font-normal text-sm text-gray-500 dark:text-gray-400">(before October 1)</span></p>
                    <p className="text-sm">The President signs each appropriations bill into law or vetoes it. Congress can override a veto with a two-thirds majority in both chambers, though overrides are rare.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">6</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Continuing Resolutions</p>
                    <p className="text-sm">If all 12 bills aren&apos;t signed by October 1, Congress typically passes a continuing resolution (CR) to keep the government funded at prior-year levels. CRs are temporary — they buy time but don&apos;t set new policy. If no CR or full-year bill passes, affected agencies shut down.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Budget Reconciliation */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
              Budget Reconciliation
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Reconciliation is a special legislative process tied to the budget resolution. It allows Congress to pass certain spending, revenue, and debt-limit changes with a simple majority in the Senate — bypassing the 60-vote filibuster threshold.</p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Why It Matters</h3>
                  <p className="text-sm">Because reconciliation bills can&apos;t be filibustered, the majority party can use it to enact major fiscal policy without bipartisan support. This makes it one of the most powerful tools in the legislative process.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">The Byrd Rule</h3>
                  <p className="text-sm">Named after Senator Robert Byrd, this rule limits what can be included in reconciliation bills. Provisions must directly affect spending or revenue — &quot;extraneous&quot; policy changes can be struck by the Senate parliamentarian. This is why you sometimes hear that certain provisions were &quot;Byrded&quot; out of a bill.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Historical Examples</h3>
                  <p className="text-sm">Major legislation passed through reconciliation includes the Affordable Care Act (2010), the Tax Cuts and Jobs Act (2017), and the Inflation Reduction Act (2022). Both parties use this tool when they hold the majority and want to advance their fiscal agenda.</p>
                </div>
              </div>
            </div>
          </section>

          {/* The Debt Ceiling */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              The Debt Ceiling
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>The debt ceiling is a legal limit on how much the federal government can borrow to pay for obligations Congress has already authorized. It&apos;s separate from the budget: Congress authorizes spending in one set of votes and authorizes borrowing in another.</p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">What Happens When It&apos;s Reached</h3>
                  <p className="text-sm">When borrowing hits the ceiling, the Treasury Department uses &quot;extraordinary measures&quot; — accounting maneuvers that free up cash temporarily. If Congress doesn&apos;t raise or suspend the ceiling before those measures run out, the government risks defaulting on its obligations, which could disrupt financial markets and government payments.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Historical Context</h3>
                  <p className="text-sm">Congress has raised or suspended the debt ceiling dozens of times since it was established in 1917. Debt ceiling standoffs have become increasingly common and politically charged, making these moments especially important for constituent engagement.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Why Your Voice Matters</h3>
                  <p className="text-sm">Debt ceiling debates are high-stakes and high-visibility. Officials pay close attention to constituent sentiment during these moments. Contacting your senators and representative during a debt ceiling debate can have real impact.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Budget Enforcement */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Budget Enforcement
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Sequestration</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Sequestration is a mechanism for automatic, across-the-board spending cuts triggered when spending exceeds predetermined caps. It was a central feature of the Budget Control Act of 2011, which imposed caps on discretionary spending. If Congress exceeds the caps, cuts are applied equally to defense and non-defense programs.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">PAYGO and CUTGO</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Pay-as-you-go (PAYGO) rules require that new spending or tax cuts be offset by spending reductions or revenue increases elsewhere, so they don&apos;t increase the deficit. The House uses a related rule called CUTGO, which requires new mandatory spending to be offset only by spending cuts (not tax increases). These rules shape every major fiscal debate.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">CBO Scoring</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  The Congressional Budget Office (CBO) provides nonpartisan estimates of how much proposed legislation will cost over a 10-year window. These &quot;scores&quot; are enormously influential — a bill&apos;s CBO score can determine whether it gains or loses support. When you hear that a bill &quot;costs $1.5 trillion over 10 years,&quot; that figure typically comes from the CBO.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Baseline Budgeting</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Federal budgets are projected from a &quot;baseline&quot; — an estimate of what spending would be if current policies continue unchanged. This means a &quot;cut&quot; in Washington sometimes means spending less than the projected increase, not spending less than last year. Understanding the baseline helps you evaluate claims about budget cuts and increases.
                </p>
              </div>
            </div>
          </section>

          {/* Key Committees */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Key Committees
            </h2>
            <div className="pl-10 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">House &amp; Senate Budget Committees</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Write the budget resolution that sets overall spending and revenue targets for the year.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">House &amp; Senate Appropriations Committees</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Oversee the 12 subcommittees that write individual spending bills. These subcommittees make the specific funding decisions — how much goes to the NIH, how much to the military, how much to housing programs.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">House Ways &amp; Means / Senate Finance</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Handle tax policy and mandatory spending programs like Social Security and Medicare. If a bill changes taxes or entitlements, it goes through these committees.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Joint Committee on Taxation</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">A nonpartisan committee that provides revenue estimates and analysis of tax legislation. Their estimates are used alongside CBO scores to evaluate fiscal impact.</p>
              </div>
            </div>
          </section>

          {/* When and How to Engage */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </span>
              When and How to Engage
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Different stages of the budget process offer different opportunities for advocacy:</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong className="text-gray-900 dark:text-white">February</strong>: Comment on the President&apos;s budget priorities. This is when the national conversation about spending begins.</li>
                <li><strong className="text-gray-900 dark:text-white">March–April</strong>: Contact Budget Committee members as they draft the budget resolution. This sets the spending ceiling for the year.</li>
                <li><strong className="text-gray-900 dark:text-white">April–September</strong>: The highest-impact window. Appropriations subcommittees hold hearings and mark up spending bills. Testify, write, or call during this period — subcommittee members and their staff are actively making funding decisions.</li>
                <li><strong className="text-gray-900 dark:text-white">Debt ceiling debates</strong>: When they arise, make your position known to your senators and representative. These are high-visibility moments where constituent voices carry extra weight.</li>
              </ul>
              <p className="text-sm mt-4">
                Ready to take action? <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline">Write to your officials</Link> or use our <Link href="/guides/how-to-track-legislation" className="text-purple-600 dark:text-purple-400 hover:underline">legislation tracking guide</Link> to follow budget bills through Congress.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-government-spending-works" className="text-purple-600 dark:text-purple-400 hover:underline">How Government Spending Works</Link></li>
              <li><Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">How a Bill Becomes Law</Link></li>
              <li><Link href="/guides/how-congress-votes" className="text-purple-600 dark:text-purple-400 hover:underline">How Congress Votes and What It Means</Link></li>
              <li><Link href="/guides/how-to-track-legislation" className="text-purple-600 dark:text-purple-400 hover:underline">How to Track Legislation</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Want to weigh in on federal spending?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Tell your officials what the budget should fund — and what it shouldn&apos;t.</p>
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
