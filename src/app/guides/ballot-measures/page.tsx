import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'What Are Ballot Measures and How Should I Vote on Them? | My Democracy',
  description: 'Understand ballot measures, initiatives, referendums, and propositions. Learn how they get on the ballot and how to evaluate them before you vote.',
  keywords: ['ballot measures', 'initiatives', 'referendums', 'propositions', 'direct democracy', 'voter guide', 'how to vote on ballot measures'],
  openGraph: {
    title: 'What Are Ballot Measures and How Should I Vote on Them? | My Democracy',
    description: 'Understand ballot measures, initiatives, referendums, and propositions. Learn how they get on the ballot and how to evaluate them before you vote.',
    type: 'article',
  },
};

export default function BallotMeasuresGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Ballot Measures', href: '/guides/ballot-measures' }]} />
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
          What Are Ballot Measures and How Should I Vote on Them?
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            When you vote, you are not just choosing candidates. In many elections, your ballot also includes <strong className="text-gray-900 dark:text-white">ballot measures</strong> -- proposals that let voters directly approve or reject laws, constitutional amendments, tax changes, and bond issues. These measures can have a significant impact on your community, sometimes even more than the candidates on the same ballot. Understanding how they work and how to evaluate them is essential to casting an informed vote.
          </p>

          {/* Types of Ballot Measures */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Types of Ballot Measures
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                The term &quot;ballot measure&quot; is an umbrella that covers several distinct types of proposals. The types available vary by state, as each state&apos;s constitution determines which forms of direct democracy are permitted.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Initiatives (Citizen-Initiated Measures)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  An initiative allows citizens to propose a new law or constitutional amendment by collecting a required number of signatures from registered voters. If enough valid signatures are gathered, the proposal is placed on the ballot for all voters to decide. Initiatives bypass the legislature entirely -- they go directly from petition to ballot. Not all states allow initiatives; the process is available in roughly half of U.S. states, predominantly in the West.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Referendums</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  A referendum puts an existing or proposed law to a public vote. There are two types. A <strong className="text-gray-900 dark:text-white">legislative referendum</strong> (also called a &quot;referred measure&quot;) is placed on the ballot by the legislature, often because the state constitution requires voter approval for certain actions like amending the constitution or issuing bonds. A <strong className="text-gray-900 dark:text-white">popular referendum</strong> (sometimes called a &quot;veto referendum&quot;) allows citizens to challenge a law recently passed by the legislature by collecting signatures to put the law before voters, who can then approve or reject it.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Propositions</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  &quot;Proposition&quot; is a general term used in some states (notably California) to refer to any measure that appears on the ballot, whether it originated as an initiative, a legislative referendum, or a bond measure. The word itself does not indicate a specific type -- it simply means a question put to voters.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bond Measures</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Bond measures ask voters to authorize the government to borrow money by issuing bonds, typically to fund large infrastructure projects such as schools, roads, water systems, or public transit. Approving a bond measure means agreeing to take on public debt that will be repaid over time, usually through property taxes or other designated revenue sources.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Constitutional Amendments</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Many states require that any amendment to the state constitution be approved by voters. These may be proposed by the legislature or, in states that allow it, by citizen initiative. Constitutional amendments are typically harder to change after passage than ordinary statutes, which makes understanding their full implications especially important before voting.
                </p>
              </div>
            </div>
          </section>

          {/* How Measures Get on the Ballot */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              How Measures Get on the Ballot
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                The process for placing a measure on the ballot depends on the type of measure and the state&apos;s laws.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">The Citizen Initiative Process</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  For citizen-initiated measures, the process generally follows these steps: proponents draft the measure&apos;s language, often with legal assistance. The draft is submitted to a designated state official (such as the secretary of state or attorney general) for review and a title and summary. Proponents then circulate petitions to collect signatures from registered voters. Each state sets its own signature threshold, typically calculated as a percentage of votes cast in a recent election. Once enough valid signatures are submitted and verified, the measure is certified for the ballot.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  This process can take months or even years, and proponents must meet strict deadlines. Some states also require that signatures be gathered from voters across multiple counties or legislative districts to ensure geographic diversity.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Legislative Referrals</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  When a state legislature places a measure on the ballot, it typically must pass a resolution by a supermajority vote. This is common for proposed constitutional amendments, which most state constitutions require to be approved by voters before taking effect. The legislature drafts the language, and voters then have the final say.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Local Ballot Measures</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Cities, counties, and special districts (such as school districts or transit authorities) can also place measures on the ballot. These often involve local tax increases, bond issues, zoning changes, or changes to the local charter. The process for placing a local measure on the ballot varies by jurisdiction but typically requires action by the local governing body or a citizen petition.
                </p>
              </div>
            </div>
          </section>

          {/* How to Evaluate a Ballot Measure */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              How to Evaluate a Ballot Measure
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Ballot measures are often written in dense legal language, and their titles or summaries do not always capture their full impact. Here is a framework for evaluating any measure on your ballot.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Read the Official Summary and Full Text</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Every state provides an official summary or analysis for each ballot measure, typically prepared by a nonpartisan legislative analyst or the attorney general&apos;s office. Start with this summary to understand what the measure does in plain language. If you want to go deeper, read the actual text of the measure, which is always available in your state&apos;s official voter guide or on the secretary of state&apos;s website.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Understand the Fiscal Impact</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Many ballot measures have financial implications -- they may raise or lower taxes, authorize borrowing, or redirect funding. Most states require a fiscal impact statement that estimates how much the measure will cost or save, and where the money will come from. Pay close attention to whether costs are one-time or ongoing, and whether the revenue source is sustainable.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Identify Who Supports and Opposes It</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Look at who is spending money for and against the measure. Campaign finance disclosures reveal which organizations, industries, or individuals are funding the effort. Understanding the financial backers can illuminate the measure&apos;s likely beneficiaries and potential downsides. Both proponents and opponents often submit arguments for and against in the official voter guide.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Consider Unintended Consequences</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Ballot measures, once passed, can be difficult to amend -- especially constitutional amendments. Ask yourself: Does this measure address the problem it claims to solve? Could it have negative side effects? Is it too rigid, or does it allow for adjustments as circumstances change? Would this issue be better addressed through the regular legislative process, which allows for easier modification?
                </p>
              </div>
            </div>
          </section>

          {/* Common Pitfalls to Watch For */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              Common Pitfalls to Watch For
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Ballot measures are tools of direct democracy, but they come with some common pitfalls that voters should be aware of.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Misleading Titles and Summaries</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The title or short description of a measure does not always accurately reflect its contents. A measure titled with appealing language about &quot;protecting&quot; something may actually weaken existing protections, or vice versa. Always read beyond the title to the official analysis and full text.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Confusing &quot;Yes&quot; and &quot;No&quot; Wording</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Some measures are worded so that a &quot;yes&quot; vote means rejecting a policy, or a &quot;no&quot; vote means keeping a new change. Double-negatives and convoluted phrasing can trip up even careful readers. Before voting, make sure you understand what a &quot;yes&quot; vote and a &quot;no&quot; vote will each accomplish. Your state&apos;s official voter guide should clarify this.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bundled Provisions</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Some measures bundle multiple provisions together into a single yes-or-no vote. You may strongly support one part of the measure while opposing another. Unfortunately, you cannot vote on the provisions separately. Weigh the overall impact and decide whether the provisions you support outweigh those you oppose.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Unfunded Mandates and Hidden Costs</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  A measure may mandate a new program or service without identifying a clear funding source. This can lead to cuts in other programs, unexpected tax increases, or unfunded mandates passed down to local governments. Check the fiscal impact statement carefully for how costs will be covered.
                </p>
              </div>
            </div>
          </section>

          {/* Where to Find Reliable Analysis */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </span>
              Where to Find Reliable Analysis
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Evaluating ballot measures on your own can be challenging, especially when your ballot contains many measures. Fortunately, several reliable sources provide clear, nonpartisan analysis.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your State&apos;s Official Voter Guide</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Most states produce an official voter information guide that includes the text of each measure, an impartial analysis (often prepared by a nonpartisan legislative analyst), fiscal impact estimates, and arguments for and against submitted by proponents and opponents. This guide is typically mailed to registered voters and is also available online through the secretary of state&apos;s website.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Nonpartisan Civic Organizations</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Organizations like the League of Women Voters produce voter guides that cover ballot measures in plain language. These guides typically explain what a measure does, present pro and con arguments, and help voters understand the potential impact without endorsing a position.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Local News Coverage</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Local newspapers and news outlets often publish in-depth analyses of ballot measures, including investigative reporting on who is funding campaigns for and against each measure. This coverage can reveal context and implications that are not obvious from the official materials alone. Many newspapers also publish editorial board endorsements, which can be useful as one input among many, even if you do not always agree with their conclusions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Campaign Finance Disclosures</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Your state&apos;s campaign finance authority tracks spending on ballot measure campaigns. Reviewing who is spending money for and against a measure can reveal important information about its likely beneficiaries. Large expenditures by a specific industry or interest group may signal that the measure disproportionately benefits that group, regardless of how the campaign frames its messaging.
                </p>
              </div>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/understanding-your-ballot" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Understanding Your Ballot
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-research-candidates" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Research Candidates Before You Vote
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Get Involved in Local Politics
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Have questions about what&apos;s on your ballot?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your elected officials can help you understand local ballot measures. Reach out and ask.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Write to Your Officials
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
