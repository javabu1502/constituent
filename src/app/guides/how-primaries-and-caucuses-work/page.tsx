import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How Primaries and Caucuses Work | My Democracy',
  description: 'Understand the difference between primaries and caucuses, how delegates are allocated, open vs. closed primaries, Super Tuesday, and how to participate.',
  keywords: ['primaries', 'caucuses', 'presidential primary', 'open primary', 'closed primary', 'delegates', 'superdelegates', 'Super Tuesday', 'national convention'],
  alternates: {
    canonical: 'https://www.mydemocracy.app/guides/how-primaries-and-caucuses-work',
  },
  openGraph: {
    title: 'How Primaries and Caucuses Work | My Democracy',
    description: 'Understand the difference between primaries and caucuses, how delegates are allocated, open vs. closed primaries, Super Tuesday, and how to participate.',
    type: 'article',
  },
};

export default function PrimariesCaucusesGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How Primaries and Caucuses Work', href: '/guides/how-primaries-and-caucuses-work' }]} />
      <FaqJsonLd items={[
        { question: 'What is the difference between a primary and a caucus?', answer: 'A primary is a government-run election where voters cast secret ballots to choose their party\'s candidate. A caucus is a party-run meeting where participants openly discuss and vote for candidates, often through a series of rounds. Primaries are more common and easier to participate in, while caucuses require more time and in-person attendance.' },
        { question: 'Do I need to be registered with a party to vote in a primary?', answer: 'It depends on your state. In closed primaries, you must be registered with the party to vote. In open primaries, any registered voter can participate regardless of party affiliation. Semi-closed and semi-open systems fall in between. Check your state\'s rules before primary day.' },
        { question: 'What are superdelegates?', answer: 'Superdelegates are party leaders and elected officials who serve as delegates to the national convention without being chosen through primaries or caucuses. In the Democratic Party, superdelegates include members of Congress, governors, and party officials. Since 2020 reforms, Democratic superdelegates can only vote on the first ballot at the convention if a candidate has already secured a majority of pledged delegates. The Republican Party does not use superdelegates in the same way.' },
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
          How Primaries and Caucuses Work
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Before the general election, each party must choose its candidates. Primaries and caucuses are the two methods used to select nominees — and your participation in them is one of the most powerful ways to shape who appears on the ballot.
          </p>

          {/* What Are Primaries and Caucuses? */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What Are Primaries and Caucuses?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                <strong className="text-gray-900 dark:text-white">Primaries</strong> are government-run elections that work like a regular election day. You go to a polling place, cast a secret ballot, and leave. They&apos;re the most common method and are used by most states for both presidential and down-ballot races.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Caucuses</strong> are party-run meetings where participants gather at a specific time and location to publicly discuss and vote for candidates. Caucuses typically require more time (often several hours) and in-person attendance, which means they tend to draw smaller, more politically engaged crowds. Only a handful of states still use caucuses.
              </p>
              <p>
                Both methods serve the same purpose: allocating delegates who will represent the state at the party&apos;s national convention and formally nominate the candidate.
              </p>
            </div>
          </section>

          {/* Open vs. Closed Primaries */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              Open vs. Closed Primaries
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                States set their own rules for who can vote in a primary. The four main types:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Closed primary</strong>: Only voters registered with a party can vote in that party&apos;s primary. You must declare your party affiliation in advance.</li>
                <li><strong className="text-gray-900 dark:text-white">Open primary</strong>: Any registered voter can vote in any party&apos;s primary, regardless of their own registration. You choose which party&apos;s ballot to request at the polling place.</li>
                <li><strong className="text-gray-900 dark:text-white">Semi-closed</strong>: Registered party members vote in their own primary, but unaffiliated voters can choose either party&apos;s ballot.</li>
                <li><strong className="text-gray-900 dark:text-white">Semi-open</strong>: Voters don&apos;t have to publicly declare a party, but their choice may be recorded.</li>
              </ul>
              <p>
                Your state&apos;s primary type determines whether you need to register with a party to participate. Check your state&apos;s rules well before primary day — some states have registration deadlines weeks in advance.
              </p>
            </div>
          </section>

          {/* How Delegates Are Allocated */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              How Delegates Are Allocated
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                When you vote in a primary, you&apos;re not directly choosing the nominee — you&apos;re helping allocate <strong className="text-gray-900 dark:text-white">delegates</strong> who will cast votes at the national convention.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Proportional allocation</strong>: Delegates are divided among candidates based on vote share. Most Democratic primaries and many Republican ones use this method. Candidates typically need at least 15% of the vote to earn any delegates.</li>
                <li><strong className="text-gray-900 dark:text-white">Winner-take-all</strong>: The candidate with the most votes in a state gets all of that state&apos;s delegates. Some Republican primaries use this approach, especially later in the calendar.</li>
                <li><strong className="text-gray-900 dark:text-white">Hybrid</strong>: Some states use winner-take-all at the congressional district level but proportional statewide, or vice versa.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Pledged delegates</strong> are bound to vote for a specific candidate based on primary results. <strong className="text-gray-900 dark:text-white">Superdelegates</strong> (in the Democratic Party) are party leaders who can vote independently, though recent reforms limit their role to later convention ballots.
              </p>
            </div>
          </section>

          {/* The Primary Calendar */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              The Primary Calendar
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                The primary season typically begins in January or February of a presidential election year and stretches through June. The order matters — early states get outsized influence because strong performances create momentum and media attention.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Early states</strong>: Iowa and New Hampshire have traditionally gone first, though the parties have recently reshuffled the calendar. South Carolina and Nevada also hold early contests.</li>
                <li><strong className="text-gray-900 dark:text-white">Super Tuesday</strong>: A day in early March when a large number of states vote simultaneously. It&apos;s often decisive — candidates who perform poorly on Super Tuesday frequently drop out.</li>
                <li><strong className="text-gray-900 dark:text-white">Front-loading</strong>: States have competed to move their primaries earlier, seeking more influence. The parties set rules and penalties to manage the calendar.</li>
              </ul>
              <p>
                By the end of the primary season, if one candidate has won a majority of delegates, the nomination is effectively decided before the convention.
              </p>
            </div>
          </section>

          {/* The National Conventions */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              The National Conventions
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Each party holds a national convention in the summer before the general election. These multi-day events serve several purposes:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Delegate roll call</strong>: Delegates formally cast their votes to nominate the presidential candidate. In modern elections, this is usually a formality since the winner is known in advance.</li>
                <li><strong className="text-gray-900 dark:text-white">Party platform</strong>: Delegates debate and adopt the party&apos;s official policy positions for the election cycle.</li>
                <li><strong className="text-gray-900 dark:text-white">Vice presidential selection</strong>: The presidential nominee announces their running mate, who is then confirmed by the delegates.</li>
                <li><strong className="text-gray-900 dark:text-white">Contested conventions</strong>: If no candidate has a majority of delegates, multiple rounds of voting occur. Pledged delegates may become free to vote for any candidate after the first ballot, and superdelegates weigh in. This is rare in the modern era but has happened historically.</li>
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
                <li><strong className="text-gray-900 dark:text-white">Register with a party</strong>: If your state has closed primaries, register with the party whose primary you want to vote in. Do this well before the registration deadline.</li>
                <li><strong className="text-gray-900 dark:text-white">Vote in your primary</strong>: Primary turnout is much lower than general elections, which means your vote carries more weight. Find your primary date and make a plan to vote.</li>
                <li><strong className="text-gray-900 dark:text-white">Attend a caucus</strong>: If your state holds caucuses, show up. The time commitment is real, but your influence is outsized because so few people participate.</li>
                <li><strong className="text-gray-900 dark:text-white">Become a delegate</strong>: In many states, you can run to be a delegate to your party&apos;s convention. Contact your local party committee to learn how.</li>
                <li><strong className="text-gray-900 dark:text-white">Research candidates</strong>: Don&apos;t wait until the general election to learn about candidates. <Link href="/guides/how-to-research-candidates" className="text-purple-600 dark:text-purple-400 hover:underline">Use our candidate research guide</Link> to compare their records and positions.</li>
              </ul>
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
                <Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Register to Vote
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-vote-in-a-primary-election" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Vote in a Primary Election
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-research-candidates" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Research Candidates Before You Vote
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to vote in your primary?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Learn what you need to know to participate in your state&apos;s primary election.
          </p>
          <Link
            href="/guides/how-to-vote-in-a-primary-election"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Primary Voting Guide
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
