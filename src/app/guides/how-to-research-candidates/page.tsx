import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Research Candidates Before You Vote | My Democracy',
  description: 'Learn how to find voting records, campaign finance data, policy positions, and nonpartisan voter guides to make informed decisions at the ballot box.',
  keywords: ['research candidates', 'voting records', 'campaign finance', 'voter guide', 'candidate positions', 'how to vote', 'election research'],
  openGraph: {
    title: 'How to Research Candidates Before You Vote | My Democracy',
    description: 'Learn how to find voting records, campaign finance data, policy positions, and nonpartisan voter guides to make informed decisions at the ballot box.',
    type: 'article',
  },
};

export default function ResearchCandidatesGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Research Candidates', href: '/guides/how-to-research-candidates' }]} />
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
          How to Research Candidates Before You Vote
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Campaign ads and social media posts tell you what candidates <em>want</em> you to know. Doing your own research reveals what they have actually <strong className="text-gray-900 dark:text-white">done</strong>, who funds their campaigns, and where they truly stand on the issues that matter to you. The good news is that a wealth of reliable, nonpartisan information is freely available online. Here is how to find and use it.
          </p>

          {/* Why Research Matters */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Why Research Matters
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                In any given election, you may be asked to choose between candidates for dozens of offices -- from president and U.S. senator down to school board member and county commissioner. While high-profile races receive extensive media coverage, many down-ballot races get very little attention, leaving voters to make decisions with limited information.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Researching candidates before you vote helps you move beyond name recognition, party labels, and campaign rhetoric. It allows you to evaluate whether a candidate&apos;s <strong className="text-gray-900 dark:text-white">track record</strong> matches their <strong className="text-gray-900 dark:text-white">promises</strong>, understand who is financially supporting their campaign, and compare candidates on the specific issues you care about.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Taking even 30 minutes to research your ballot before election day can dramatically improve the quality of your choices -- and send a signal to elected officials that voters are paying attention.
              </p>
            </div>
          </section>

          {/* Finding Voting Records and Policy Positions */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              Finding Voting Records and Policy Positions
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                For incumbents -- candidates who already hold office -- their voting record is the most objective measure of where they stand. Campaign promises are aspirational; votes are facts.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Federal Candidates</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <a href="https://www.congress.gov/members" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a> is the official source for federal voting records. You can look up any current or former member of Congress, see every vote they have cast, view the bills they have sponsored or co-sponsored, and read their committee assignments. Search by name, state, or district to find your officials.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">State and Local Candidates</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  For state legislators, check your state legislature&apos;s official website, which publishes roll call votes and bill sponsorship records. Many states provide searchable databases. You can also use <Link href="/guides/how-to-contact-your-state-legislators" className="text-purple-600 dark:text-purple-400 hover:underline">our guide to finding your state legislators</Link> as a starting point.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Challengers and First-Time Candidates</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Candidates without a voting record can still be evaluated. Look at their official campaign website for stated policy positions. Review any endorsements they have received from organizations, as these signal alignment with particular policy agendas. Check for past public statements, op-eds, or interviews. Many candidates participate in questionnaires published by local newspapers or civic organizations.
                </p>
              </div>
            </div>
          </section>

          {/* Following the Money */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Following the Money
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Campaign finance information reveals who is funding a candidate&apos;s campaign. While donations do not automatically equal influence, patterns in funding can highlight whose interests a candidate may be more responsive to once in office. Federal law requires candidates and political committees to disclose their donors and expenditures.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Federal Campaign Finance</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The <a href="https://www.fec.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Federal Election Commission (FEC)</a> maintains a public database of all campaign contributions and expenditures for federal candidates. You can search by candidate name to see who has donated to their campaign, how much they have raised, and how they are spending their funds. The FEC&apos;s website includes individual contributions above a disclosure threshold, PAC contributions, and party committee support.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">State and Local Campaign Finance</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Each state has its own campaign finance disclosure requirements and maintains its own database. These are typically found through the secretary of state&apos;s office or a state elections commission. Disclosure requirements vary by state, but most require candidates to report their donors and expenditures on a regular basis.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What to Look For</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  When reviewing campaign finance data, consider: What industries or interest groups are the largest contributors? Is the candidate funded primarily by small individual donations, large individual donations, or PAC money? Are there significant contributions from outside the candidate&apos;s district or state? These patterns can provide useful context for evaluating a candidate&apos;s priorities and potential influences.
                </p>
              </div>
            </div>
          </section>

          {/* Nonpartisan Voter Guides */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              Nonpartisan Voter Guides
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Nonpartisan voter guides compile candidate information in one place, making it easier to compare candidates side by side without the spin of campaign messaging. These guides are produced by civic organizations that do not endorse candidates.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <a href="https://vote.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Vote.gov</a> is the federal government&apos;s official voting resource. It provides state-by-state information on voter registration, absentee voting, and finding your polling place. While it does not provide candidate guides, it is the best starting point for ensuring you are registered and know where to vote.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Many local organizations, such as the League of Women Voters and your local newspaper, publish voter guides that include candidate questionnaire responses, information about ballot measures, and polling place details. These guides are particularly valuable for down-ballot races that receive little media attention.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Identify a Truly Nonpartisan Guide</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Not every organization that claims to be nonpartisan truly is. When evaluating a voter guide, check whether the organization endorses candidates (a partisan signal), whether it presents candidates&apos; own words or editorializes, and whether it covers all candidates on the ballot or only selected ones. Reliable nonpartisan guides present factual information and let voters draw their own conclusions.
                </p>
              </div>
            </div>
          </section>

          {/* Evaluating Campaign Claims */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Evaluating Campaign Claims
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                During campaign season, candidates and their supporters make a wide range of claims -- about their own record, about their opponents, and about policy outcomes. Evaluating these claims critically is one of the most important skills for an informed voter.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Check the Source</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  When a candidate claims credit for a policy outcome, check whether they actually voted for the relevant legislation, sponsored it, or played a meaningful role. Official records on <a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a> can verify federal claims. For state-level claims, check your state legislature&apos;s official records.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Look for Context</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Political claims often cherry-pick data or present facts without context. A candidate might accurately cite a single vote but omit the broader context -- such as voting against a larger bill that contained the provision, or voting for a bill that included many unrelated provisions. When evaluating claims about voting records, look at the full bill and the circumstances surrounding the vote.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Be Skeptical of Attack Ads</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Attack ads, whether from campaigns or outside groups, are designed to persuade, not inform. They frequently take opponents&apos; words or votes out of context, use misleading statistics, or attribute blame for complex outcomes to a single individual. Before forming an opinion based on an attack ad, verify the specific claims using official records and independent sources.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Build Your Own Research Checklist</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  For each candidate on your ballot, try to answer these questions: What is their professional background? If an incumbent, how have they voted on issues important to you? Who are their major donors? What do nonpartisan sources say about them? Do their stated positions match their record? Spending a few minutes per candidate with these questions will give you a much stronger foundation for your vote.
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
                <Link href="/guides/how-to-vote-in-a-primary-election" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Vote in a Primary Election
                </Link>
              </li>
              <li>
                <Link href="/guides/how-congress-votes" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How Congress Votes
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to hold your officials accountable?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Look up your elected officials and see how they are representing you.
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
