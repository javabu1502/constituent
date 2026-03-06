import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Vote in a Primary Election | My Democracy',
  description: 'Learn how primary elections work, the difference between open and closed primaries, how to find your primary date, and what you need to participate.',
  keywords: ['primary election', 'how to vote in primary', 'open primary', 'closed primary', 'primary election date', 'party primary', 'voter registration primary'],
  openGraph: {
    title: 'How to Vote in a Primary Election | My Democracy',
    description: 'Learn how primary elections work and what you need to participate in your state.',
    type: 'article',
  },
};

export default function PrimaryElectionGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How to Vote in a Primary Election', href: '/guides/how-to-vote-in-a-primary-election' }]} />
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
          How to Vote in a Primary Election
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Primary elections determine which candidates appear on the general election ballot. They&apos;re where parties choose their nominees — and where your vote often has the biggest impact, since many general elections are not competitive. Here&apos;s how to participate.
          </p>

          {/* What Is a Primary */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What Is a Primary Election?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                A primary election is held before the general election to narrow the field of candidates. In most states, each political party holds its own primary so that registered party members (or, in some states, any voter) can choose the party&apos;s nominee. Some states use a different system — like a nonpartisan &quot;jungle primary&quot; where all candidates appear on one ballot and the top finishers advance regardless of party.
              </p>
              <p>
                Primaries are run by state and local election officials, not by the parties themselves. Presidential primaries and caucuses follow a separate schedule set by each state and the national parties.
              </p>
            </div>
          </section>

          {/* Types of Primaries */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </span>
              Types of Primary Elections
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Closed Primary</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Only voters registered with a party can vote in that party&apos;s primary. If you&apos;re registered as an independent, you cannot participate. States with closed primaries include New York, Florida, and Pennsylvania. You typically must register with a party weeks or months before the primary date.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Open Primary</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Any registered voter can participate regardless of party affiliation. You choose which party&apos;s ballot to vote on at the polling place. States with open primaries include Virginia, Wisconsin, and Michigan. You can only vote in one party&apos;s primary per election.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Semi-Closed (or Semi-Open) Primary</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Registered party members vote in their party&apos;s primary, while unaffiliated voters can choose which party primary to participate in. Rules vary by state — some allow unaffiliated voters to register with a party on Election Day.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Nonpartisan / Top-Two / Top-Four Primary</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  All candidates appear on a single ballot regardless of party. The top two (or top four, as in Alaska) vote-getters advance to the general election. California, Washington, and Louisiana use variations of this system.
                </p>
              </div>
            </div>
          </section>

          {/* How to Participate */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              How to Participate
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Check your registration</strong>: Make sure you&apos;re registered to vote and, if your state has a closed primary, that your party affiliation is correct. See our <Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">voter registration guide</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Find your primary date</strong>: Primary dates vary by state and year. Check your <Link href="/states" className="text-purple-600 dark:text-purple-400 hover:underline">state&apos;s election info page</Link> or visit <a href="https://www.vote.org/election-reminders/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Vote.org</a> for reminders.</li>
                <li><strong className="text-gray-900 dark:text-white">Research the candidates</strong>: Visit <a href="https://ballotpedia.org/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Ballotpedia</a> for nonpartisan candidate information, endorsements, and policy positions.</li>
                <li><strong className="text-gray-900 dark:text-white">Know the deadlines</strong>: Party-change and registration deadlines for primaries can be weeks or months before the election — especially in closed-primary states.</li>
                <li><strong className="text-gray-900 dark:text-white">Vote early if you can</strong>: Many states offer early voting or mail ballots for primaries, just like general elections.</li>
              </ul>
            </div>
          </section>

          {/* Why Primaries Matter */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why Primaries Matter
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Primary turnout is typically much lower than general election turnout, which means each vote carries more weight. In many congressional districts and state legislative districts, one party holds a strong advantage, making the primary the election that effectively decides who holds office.
              </p>
              <p>
                Voting in primaries also gives you a say in the direction of a political party. The candidates who win primaries shape the policy platforms and priorities that carry into the general election.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">How to Register to Vote</Link></li>
              <li><Link href="/guides/understanding-your-ballot" className="text-purple-600 dark:text-purple-400 hover:underline">Understanding Your Ballot</Link></li>
              <li><Link href="/guides/what-is-gerrymandering" className="text-purple-600 dark:text-purple-400 hover:underline">What Is Gerrymandering?</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Know your primary date?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Check your state&apos;s election info and find your officials.</p>
          <Link href="/states" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Find Your State
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
