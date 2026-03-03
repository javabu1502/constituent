import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How a Bill Becomes Law | My Democracy',
  description: 'Understand the legislative process at federal and state levels. Learn how to track bills through Congress and state legislatures.',
  keywords: ['how a bill becomes law', 'legislative process', 'congress', 'state legislature', 'track bills', 'civics'],
  openGraph: {
    title: 'How a Bill Becomes Law | My Democracy',
    description: 'Understand the legislative process at federal and state levels. Learn how to track bills through Congress and state legislatures.',
    type: 'article',
  },
};

export default function BillBecomesLawGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How a Bill Becomes Law', href: '/guides/how-a-bill-becomes-law' }]} />
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
          How a Bill Becomes Law
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Understanding the legislative process helps you know when and how to make your voice heard. Here&apos;s how laws are made at both federal and state levels.
          </p>

          {/* Federal Legislative Process */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              The Federal Process
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Introduction</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  A bill is introduced by a member of Congress. In the House, it&apos;s dropped in the &quot;hopper.&quot; In the Senate, it&apos;s presented on the floor. The bill gets a number (HR for House, S for Senate) and is referred to committee.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Committee Review</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">This is where most bills die.</strong> The committee with jurisdiction holds hearings, debates, and may &quot;mark up&quot; (amend) the bill. If approved, it moves forward. If not, it stalls.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm italic">
                  Advocacy tip: Contact committee members before hearings. This is your highest-impact moment.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Floor Debate & Vote</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Bills that pass committee go to the full chamber for debate and voting. In the House, debate is limited. In the Senate, unlimited debate can lead to filibusters requiring 60 votes to overcome.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. The Other Chamber</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  If passed, the bill goes to the other chamber and repeats the process. Both chambers must pass identical text.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">5. Conference Committee</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  If the House and Senate pass different versions, a conference committee reconciles differences. Both chambers then vote on the final version.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">6. Presidential Action</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The President can sign the bill (becomes law), veto it (returns to Congress), or take no action. If Congress is in session and the President doesn&apos;t sign within 10 days, it becomes law. If Congress adjourns, it&apos;s a &quot;pocket veto.&quot;
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">7. Veto Override</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Congress can override a veto with a 2/3 majority in both chambers. This is rare but possible.
                </p>
              </div>
            </div>
          </section>

          {/* Visual Summary */}
          <section className="mb-10">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">Federal Process Summary</h3>
              <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Bill Introduced</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Committee</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Floor Vote</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Other Chamber</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">Conference</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">President</span>
                <span className="text-purple-500">&rarr;</span>
                <span className="bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-medium">Law</span>
              </div>
            </div>
          </section>

          {/* State Legislative Process */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </span>
              The State Process
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                State legislatures follow a similar process, but with important differences:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Shorter sessions</strong>: Many state legislatures meet only part of the year. Bills must pass quickly or die.</li>
                <li><strong className="text-gray-900 dark:text-white">Fewer procedural hurdles</strong>: No filibuster in most states. Bills move faster.</li>
                <li><strong className="text-gray-900 dark:text-white">More accessible</strong>: Public testimony is common. You can directly address legislators.</li>
                <li><strong className="text-gray-900 dark:text-white">Governor action</strong>: Like the President, governors can sign, veto, or in some states, line-item veto specific provisions.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Nebraska is unique:</strong> It has a unicameral (single-chamber) legislature, so bills only need to pass once.
              </p>
            </div>
          </section>

          {/* When to Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              When to Contact Your Representatives
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Your advocacy has the most impact at these moments:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Before committee hearings</strong>: When the bill is being debated and can be amended</li>
                <li><strong className="text-gray-900 dark:text-white">Before floor votes</strong>: When legislators are finalizing their positions</li>
                <li><strong className="text-gray-900 dark:text-white">During conference</strong>: When differences are being reconciled</li>
                <li><strong className="text-gray-900 dark:text-white">Before the President/Governor acts</strong>: To encourage signature or veto</li>
              </ul>
              <p>
                Even if you miss these windows, contact still matters. Offices track constituent sentiment over time, and your message helps shape future votes.
              </p>
            </div>
          </section>

          {/* Track Legislation */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Track Legislation
            </h2>
            <div className="pl-10 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Federal Bills</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Congress.gov</a>: The official source for federal legislation. Search by bill number, keyword, or sponsor. Track status, read full text, and see voting records.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">State Bills</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <a href="https://openstates.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Open States</a>: Free, searchable database covering all 50 state legislatures. Track bills, see voting records, and find your legislators.
                </p>
              </div>
            </div>
          </section>

          {/* Key Terms */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              Key Terms
            </h2>
            <div className="pl-10">
              <dl className="space-y-3 text-gray-600 dark:text-gray-300">
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Co-sponsor</dt>
                  <dd>A legislator who formally supports a bill. More co-sponsors signal broader support.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Mark up</dt>
                  <dd>When a committee amends a bill. This is when significant changes happen.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Filibuster</dt>
                  <dd>Extended debate in the Senate to delay or block a vote. Requires 60 votes to end.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Cloture</dt>
                  <dd>A vote to end debate and proceed to a final vote. Requires 60 votes in the Senate.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Reconciliation</dt>
                  <dd>A special budget process that bypasses the filibuster, requiring only 51 votes.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900 dark:text-white">Omnibus</dt>
                  <dd>A large bill combining multiple measures, often used for must-pass legislation.</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Amendments and Conference Committees in Depth */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              Amendments and Conference Committees in Depth
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How Amendments Work</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Amendments are the primary way bills change as they move through Congress. They can be introduced at two key stages: during <strong className="text-gray-900 dark:text-white">committee markup</strong> and during <strong className="text-gray-900 dark:text-white">floor debate</strong>. During markup, committee members propose changes line by line, debating and voting on each one. This is often where the most substantive policy changes happen, away from the spotlight of the full chamber.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  On the floor, amendments follow different rules in each chamber. Amendments can be simple (changing a few words), substitute (replacing entire sections), or even &quot;amendments to amendments,&quot; secondary changes layered on top of proposed changes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Open Rules vs. Closed Rules in the House</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  In the House of Representatives, the <strong className="text-gray-900 dark:text-white">Rules Committee</strong> determines how each bill is debated on the floor. Under an <strong className="text-gray-900 dark:text-white">open rule</strong>, any member can offer germane amendments. This allows for broad debate and changes. Under a <strong className="text-gray-900 dark:text-white">closed rule</strong>, no amendments are permitted, and the bill must be voted on as-is. Most common is a <strong className="text-gray-900 dark:text-white">structured rule</strong> (sometimes called a &quot;modified closed rule&quot;), which allows only specific, pre-approved amendments to be considered.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  The Senate operates differently. Any senator can generally offer amendments, including non-germane ones, unless a unanimous consent agreement or cloture limits the process.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How Conference Committees Are Formed</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  When the House and Senate pass different versions of the same bill, a <strong className="text-gray-900 dark:text-white">conference committee</strong> is appointed to reconcile the differences. The Speaker of the House and the Senate presiding officer each appoint conferees, typically senior members of the committees that handled the bill. The conferees negotiate behind closed doors, producing a <strong className="text-gray-900 dark:text-white">conference report</strong> that both chambers must then approve without further amendment.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  In recent years, congressional leadership has sometimes bypassed the formal conference process by exchanging amendment texts between chambers, a less transparent approach sometimes called &quot;ping-ponging.&quot;
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Why the Final Bill Often Looks Very Different</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Between committee markup, floor amendments, and conference negotiations, a bill can change dramatically from its original form. Provisions may be added, removed, or rewritten entirely. Major legislation like spending bills or reform packages often bear little resemblance to the version that was introduced. This is why tracking a bill&apos;s progress, not just its introduction, is essential for engaged citizens.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm italic">
                  Advocacy tip: Watch for amendments that change a bill&apos;s impact. A bill you supported at introduction may have been altered significantly by the time it reaches a vote. Read the latest version and any amendment summaries before contacting your representatives.
                </p>
              </div>
            </div>
          </section>

          {/* Bill Tracking Tools */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Bill Tracking Tools
            </h2>
            <div className="pl-10 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                Staying informed about legislation is easier than ever. Here are the best tools citizens can use to track bills at both the federal and state levels.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  <a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a> - Federal Legislation
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The official source for all federal legislation, maintained by the Library of Congress. Search by <strong className="text-gray-900 dark:text-white">keyword</strong>, <strong className="text-gray-900 dark:text-white">sponsor name</strong>, <strong className="text-gray-900 dark:text-white">committee</strong>, or <strong className="text-gray-900 dark:text-white">bill number</strong> (e.g., HR 1234 or S 567). You can read the full text of any bill, track its status through each stage of the process, view amendments, see committee reports, and check voting records. Best for: authoritative, detailed federal bill tracking and reading actual bill text.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  <a href="https://openstates.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Open States</a> - State Legislation
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  A free, open-source platform that tracks legislation across <strong className="text-gray-900 dark:text-white">all 50 state legislatures</strong>, plus D.C. and Puerto Rico. Search for bills, see voting records, and find your state legislators. Open States normalizes data across different state systems, making it easy to search consistently no matter which state you&apos;re interested in. Best for: tracking state-level bills and finding your state representatives.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  <a href="https://www.govtrack.us" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">GovTrack.us</a> - Alerts and Predictions
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  GovTrack makes federal legislation more accessible with features like <strong className="text-gray-900 dark:text-white">email alerts</strong> when bills you follow are updated, <strong className="text-gray-900 dark:text-white">prognosis scores</strong> that predict whether a bill is likely to pass, and plain-language summaries. It also provides detailed legislator profiles with voting records and report cards. Best for: getting notified about changes and understanding a bill&apos;s likelihood of passage.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  <a href="https://legiscan.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">LegiScan</a> - Cross-State Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  LegiScan tracks legislation across <strong className="text-gray-900 dark:text-white">all 50 states and Congress</strong> in a single interface. It&apos;s particularly useful for tracking bills on a specific topic across multiple states. For example, you can see how different states are handling education policy or healthcare reform. It offers relevance scoring and keyword-based monitoring. Best for: watching how similar bills move through different states simultaneously.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Your State Legislature&apos;s Official Website</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Every state legislature maintains its own website with bill tracking, committee schedules, hearing calendars, and live audio or video streams of proceedings. While these sites vary in usability, they are the most <strong className="text-gray-900 dark:text-white">authoritative and up-to-date</strong> source for state-level information. Many also allow you to sign up for alerts on specific bills or committees. Best for: official state bill text, committee schedules, and hearing testimony sign-up.
                </p>
              </div>
            </div>
          </section>

          {/* Citizen Intervention Points */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </span>
              Citizen Intervention Points
            </h2>
            <div className="pl-10 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                Knowing <em>when</em> to act is just as important as knowing <em>how</em>. Here is a stage-by-stage playbook for making your voice heard at the moments when it matters most.
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stage 1: Bill Introduction</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What&apos;s happening:</strong> A legislator introduces a bill and it receives a number. Co-sponsors may sign on, and the bill is referred to one or more committees.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">Why this moment matters:</strong> Early support (or opposition) shapes whether a bill gains momentum. Legislators gauge interest at this stage to decide how much political capital to invest.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What to ask for:</strong> Ask your representative to co-sponsor (or refuse to co-sponsor) the bill. If they introduced it, thank them or express your concerns.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                    How to be effective: Reference the bill by number. Be specific about why it matters to you personally. A brief, personal story is more persuasive than a form letter.
                  </p>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stage 2: Committee Hearing</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What&apos;s happening:</strong> The assigned committee holds hearings where experts, advocates, and sometimes members of the public testify. Committee members ask questions and learn about the bill&apos;s potential impact.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">Why this moment matters:</strong> This is one of the <strong className="text-gray-900 dark:text-white">highest-impact intervention points</strong>. Committee members are actively gathering information and forming opinions. Most bills die in committee, so energy here can determine whether a bill advances or stalls.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What to ask for:</strong> If your representative is on the committee, ask them to support or oppose the bill during markup. Provide specific information about how the bill would affect your community.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                    How to be effective: Call the committee office directly, not just your own representative. At the state level, sign up to testify in person. Your physical presence carries significant weight. Submit written testimony if you cannot attend.
                  </p>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stage 3: Committee Vote</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What&apos;s happening:</strong> After markup, the committee votes on whether to report the bill to the full chamber. This is when amendments have been finalized at the committee level.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">Why this moment matters:</strong> A committee vote is the gateway to the floor. Bills that don&apos;t pass committee almost never become law. This is also when you should review any amendments that changed the bill.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What to ask for:</strong> Ask committee members to vote yes or no. If amendments have changed the bill, reference the specific changes you support or oppose.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                    How to be effective: Time is critical. Committee votes can be scheduled quickly. Follow committee calendars on your legislature&apos;s website and act within 24-48 hours of a vote being scheduled. A phone call is faster and more impactful than a letter at this stage.
                  </p>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stage 4: Floor Debate and Vote</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What&apos;s happening:</strong> The full chamber debates the bill. Additional amendments may be offered on the floor. Legislators make speeches for and against. A final vote is taken.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">Why this moment matters:</strong> This is when every legislator, not just committee members, takes a position. Floor votes are public and become part of the permanent record. Legislators are especially sensitive to constituent opinion right before recorded votes.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What to ask for:</strong> Ask your specific representative or senator to vote yes or no. Be clear and direct about your position.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                    How to be effective: Contact your own representative or senator directly. They care most about their own constituents. Phone calls are the highest-impact method before floor votes. Keep your message to 30 seconds: your name, your location, the bill number, and your position.
                  </p>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stage 5: Conference Committee</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What&apos;s happening:</strong> If the House and Senate passed different versions, conferees from both chambers negotiate a final version. This happens behind closed doors, and the conference report must be approved by both chambers without further amendment.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">Why this moment matters:</strong> Conference is where major last-minute changes are often made. Provisions can be added or removed with little public scrutiny. The final bill may differ significantly from what either chamber originally passed.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What to ask for:</strong> Ask conferees to keep (or remove) specific provisions. Ask your representatives to vote against the conference report if critical provisions were changed.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                    How to be effective: This is an often-overlooked intervention point. Contact the offices of conferees directly, even if they are not your own representatives. Advocacy organizations and media attention are especially valuable at this stage to increase transparency.
                  </p>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Stage 6: Presidential or Governor Action</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What&apos;s happening:</strong> The bill has passed both chambers and lands on the executive&apos;s desk. The President or Governor can sign it into law, veto it, or (at the state level) in some cases use a line-item veto on specific provisions.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">Why this moment matters:</strong> This is the final decision point. Executives weigh public opinion heavily, especially on high-profile legislation. A flood of calls can influence whether a veto is issued.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    <strong className="text-gray-900 dark:text-white">What to ask for:</strong> Ask the President or Governor to sign or veto the bill. If a veto occurs, contact your legislators to support or oppose a veto override.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                    How to be effective: Call the White House comment line (202-456-1111) or your governor&apos;s office. Volume matters at this stage. Coordinate with others who share your position. Petitions, social media campaigns, and media op-eds amplify your message.
                  </p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mt-4">
                <strong className="text-gray-900 dark:text-white">Remember:</strong> Even if you miss the &quot;best&quot; window, reaching out still matters. Congressional and legislative offices track all constituent contacts, and cumulative input shapes policy positions over time.
              </p>
            </div>
          </section>

          {/* Types of Legislation */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Types of Legislation
            </h2>
            <div className="pl-10 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                Not all legislation is the same. Understanding the different types helps you interpret what you see referenced in the news and know which measures carry the force of law.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bills (HR / S)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The most common form of legislation. House bills are designated <strong className="text-gray-900 dark:text-white">H.R.</strong> followed by a number; Senate bills are designated <strong className="text-gray-900 dark:text-white">S.</strong> followed by a number. Bills can address any subject and, if passed by both chambers and signed by the President, become public law. Most of the legislation you hear about in the news falls into this category.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Joint Resolutions (H.J.Res. / S.J.Res.)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Joint resolutions are virtually identical to bills in their legal effect. They pass through the same process and require the President&apos;s signature. They are typically used for <strong className="text-gray-900 dark:text-white">constitutional amendments</strong> (which require a two-thirds vote in both chambers and do not require presidential approval) or for limited or temporary matters, such as continuing resolutions to fund the government.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Concurrent Resolutions (H.Con.Res. / S.Con.Res.)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Concurrent resolutions must pass both chambers but are <strong className="text-gray-900 dark:text-white">not sent to the President</strong> and do <strong className="text-gray-900 dark:text-white">not have the force of law</strong>. They are used for matters affecting both chambers, such as setting the annual congressional budget resolution, establishing joint committees, or expressing the collective sentiment of Congress.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Simple Resolutions (H.Res. / S.Res.)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Simple resolutions apply to only one chamber and do <strong className="text-gray-900 dark:text-white">not have the force of law</strong>. They are used for internal rules, expressing the opinion of one chamber, or commemorative purposes. For example, a House resolution might establish rules for debating a specific bill, or a Senate resolution might honor a notable individual.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Appropriations Bills</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Appropriations bills provide the <strong className="text-gray-900 dark:text-white">actual funding</strong> for government programs and agencies. Congress must pass these annually (there are typically 12 appropriations bills) to keep the government running. When you hear about a &quot;government shutdown,&quot; it means one or more appropriations bills were not passed in time. These bills originate in the House Appropriations Committee.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Authorization Bills</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Authorization bills <strong className="text-gray-900 dark:text-white">create or continue</strong> government programs and set policy guidelines, including maximum funding levels. However, they do not actually provide money. That requires a separate appropriations bill. For example, the National Defense Authorization Act (NDAA) sets defense policy and spending limits each year, but the actual defense budget is allocated through appropriations.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Budget Reconciliation</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Reconciliation is a special legislative process designed to align spending, revenue, and the debt limit with the goals set in the annual budget resolution. Its significance lies in its procedural advantages: reconciliation bills <strong className="text-gray-900 dark:text-white">cannot be filibustered</strong> in the Senate, meaning they need only 51 votes (instead of the usual 60 to overcome a filibuster). This makes reconciliation a powerful tool for passing major fiscal legislation along party lines. Recent examples include the Inflation Reduction Act and the Tax Cuts and Jobs Act.
                </p>
              </div>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your Congressman
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-contact-your-state-legislators" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your State Legislators
                </Link>
              </li>
              <li>
                <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Write an Effective Letter to Congress
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to influence the process?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find your representatives and let them know where you stand.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Your Reps
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
