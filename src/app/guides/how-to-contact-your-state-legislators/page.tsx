import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Contact Your State Legislators | My Democracy',
  description: 'Learn how to find and contact your state senators and representatives. Discover why state-level advocacy is often more effective than federal.',
  keywords: ['state legislature', 'state senator', 'state representative', 'contact state government', 'state advocacy', 'local politics'],
  openGraph: {
    title: 'How to Contact Your State Legislators | My Democracy',
    description: 'Learn how to find and contact your state senators and representatives. Discover why state-level advocacy is often more effective than federal.',
    type: 'article',
  },
};

export default function ContactStateLegislatorsGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How to Contact Your State Legislators', href: '/guides/how-to-contact-your-state-legislators' }]} />
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
          How to Contact Your State Legislators
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            While Congress gets most of the attention, your state legislators often have more direct impact on your daily life. Here&apos;s how to find them and make your voice heard at the state level.
          </p>

          {/* Why State Government Matters */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why State Government Matters
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>State legislatures control policies that directly affect your life:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Education</strong>: School funding, curriculum standards, higher education</li>
                <li><strong className="text-gray-900 dark:text-white">Healthcare</strong>: Medicaid expansion, insurance regulations, public health</li>
                <li><strong className="text-gray-900 dark:text-white">Criminal Justice</strong>: Sentencing, policing, prison reform</li>
                <li><strong className="text-gray-900 dark:text-white">Environment</strong>: Land use, water rights, state environmental regulations</li>
                <li><strong className="text-gray-900 dark:text-white">Elections</strong>: Voting access, redistricting, election administration</li>
                <li><strong className="text-gray-900 dark:text-white">Taxes</strong>: Income tax, sales tax, property tax</li>
                <li><strong className="text-gray-900 dark:text-white">Infrastructure</strong>: Roads, public transit, utilities</li>
              </ul>
            </div>
          </section>

          {/* Your State Representatives */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Your State Representatives
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>Most states have a bicameral legislature (like Congress):</p>
              <p>
                <strong className="text-gray-900 dark:text-white">State Senator</strong>: Represents a larger district, typically serves 4-year terms. Your state senate district usually contains multiple house districts.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">State Representative / Assembly Member</strong>: Represents a smaller district, typically serves 2-year terms. Titles vary by state (Representative, Delegate, Assembly Member).
              </p>
              <p className="text-sm italic">
                Note: Nebraska has a unicameral legislature with only senators. Some states have different structures.
              </p>
            </div>
          </section>

          {/* Why State Advocacy Is Often More Effective */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Why State Advocacy Is Often More Effective
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Smaller constituencies</strong>: Your state rep may represent 50,000 people vs. 760,000 for a US House member. Your voice carries more weight.</li>
                <li><strong className="text-gray-900 dark:text-white">Less competition for attention</strong>: State offices receive far fewer contacts than Congressional offices.</li>
                <li><strong className="text-gray-900 dark:text-white">More accessible</strong>: State legislators often have direct email, answer their own phones, and hold local office hours.</li>
                <li><strong className="text-gray-900 dark:text-white">Faster action</strong>: State legislatures can move quickly on issues. Policies can change in a single session.</li>
                <li><strong className="text-gray-900 dark:text-white">Testing ground</strong>: Many federal policies started as state experiments. State action can drive national change.</li>
              </ul>
            </div>
          </section>

          {/* How to Find Your State Legislators */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              How to Find Your State Legislators
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Use My Democracy</Link>: Enter your address and we&apos;ll find all your officials, federal and state, in one lookup.
              </p>
              <p>
                You can also use <a href="https://openstates.org/find_your_legislator/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Open States</a> or your state legislature&apos;s official website.
              </p>
            </div>
          </section>

          {/* Contact Methods */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              How to Contact Them
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                <strong className="text-gray-900 dark:text-white">Email</strong>: Most state legislators list a direct email address. Unlike Congress, you&apos;re often emailing them personally, not a webform that goes to staff.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Phone</strong>: Call their capitol office during session or district office year-round. Many answer their own phones.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">In-Person</strong>: Attend town halls, legislative hearings, or request a meeting. State legislators are far more accessible than members of Congress.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Testify</strong>: Many state legislatures allow public testimony on bills. This is direct democracy in action.
              </p>
            </div>
          </section>

          {/* Tips for State Advocacy */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              Tips for Effective State Advocacy
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Know the bill number</strong>: State bills are tracked by number (e.g., HB 123, SB 456). Be specific.</li>
                <li><strong className="text-gray-900 dark:text-white">Time it right</strong>: Contact before committee hearings or floor votes for maximum impact.</li>
                <li><strong className="text-gray-900 dark:text-white">Build relationships</strong>: State legislators remember constituents who engage consistently.</li>
                <li><strong className="text-gray-900 dark:text-white">Attend hearings</strong>: Your physical presence matters, even if you don&apos;t testify.</li>
                <li><strong className="text-gray-900 dark:text-white">Connect local</strong>: Explain how state policy affects your community specifically.</li>
              </ul>
            </div>
          </section>

          {/* Track State Bills */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              Track State Legislation
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                <a href="https://openstates.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Open States</a>: Free, searchable database of state legislation across all 50 states. Track bills, see voting records, and find your legislators.
              </p>
              <p>
                Learn more about the legislative process in our <Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">How a Bill Becomes Law</Link> guide.
              </p>
            </div>
          </section>

          {/* State Differences You Should Know */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              State Differences You Should Know
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Not all state legislatures work the same way. Understanding your state&apos;s structure will help you advocate more effectively.
              </p>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Nebraska&apos;s Unicameral Legislature</h3>
                <p>
                  Nebraska is the only state with a unicameral (single-chamber) legislature. Its 49 members are called &quot;senators&quot; and the body is officially nonpartisan. Members do not run with a party label. If you live in Nebraska, you have one state legislator instead of two.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Full-Time vs. Part-Time Legislatures</h3>
                <p className="mb-3">
                  How often your legislature meets affects when and how you should contact them:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong className="text-gray-900 dark:text-white">Full-time legislatures</strong>: California, New York, Pennsylvania, and Michigan have full-time, year-round legislatures. Legislators are paid a full salary and treat it as their primary job. You can reach them at the capitol most of the year.</li>
                  <li><strong className="text-gray-900 dark:text-white">Part-time legislatures</strong>: Texas meets for only <a href="https://www.ncsl.org/about-state-legislatures/legislative-session-length" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">140 days every two years</a>. New Hampshire legislators earn just <a href="https://www.ncsl.org/about-state-legislatures/2024-legislator-compensation" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">$100 per year</a>. Montana, Nevada, and North Dakota also meet every other year. Timing your advocacy around their session schedule is critical.</li>
                  <li><strong className="text-gray-900 dark:text-white">Hybrid legislatures</strong>: Most states fall somewhere in between. Ohio, Colorado, and Florida have legislatures that meet for several months each year but are not considered full-time positions.</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Citizen Legislatures vs. Professional Legislatures</h3>
                <p className="mb-3">
                  This distinction matters because it shapes how legislators interact with constituents:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong className="text-gray-900 dark:text-white">Citizen legislatures</strong>: States like New Hampshire (<a href="https://www.ncsl.org/about-state-legislatures/number-of-legislators-and-length-of-terms" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">400 House members</a>!), Wyoming, and Vermont have legislators who hold other jobs and serve part-time. They often live and work in your community, making them very accessible. You might run into them at the grocery store.</li>
                  <li><strong className="text-gray-900 dark:text-white">Professional legislatures</strong>: States like California and New York have legislators with full salaries, large staffs, and year-round schedules. Contacting them works more like contacting a member of Congress, and you&apos;ll typically interact with staff first.</li>
                </ul>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Term Limit Variations</h3>
                <p className="mb-3">
                  Term limits vary widely and affect the kind of relationship you can build with a legislator:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong className="text-gray-900 dark:text-white">Strict term limits</strong>: Michigan, Arkansas, and Oklahoma limit legislators to 6-8 years total. Turnover is high, so new members are common and often more receptive to constituent input while learning their role.</li>
                  <li><strong className="text-gray-900 dark:text-white">Moderate term limits</strong>: California allows 12 years total across both chambers. Colorado and Maine set 8-year limits per chamber.</li>
                  <li><strong className="text-gray-900 dark:text-white">No term limits</strong>: About 15 states, including Texas, Illinois, and Wisconsin, have no term limits at all. Legislators can serve indefinitely, allowing for deeper long-term relationships with engaged constituents.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sample Phone Script for State Legislators */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              Sample Phone Script for State Legislators
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Calling your state legislator is often more personal than calling a congressional office. In many states, especially those with citizen or part-time legislatures, the legislator may answer the phone themselves. Be prepared for a real conversation, not just leaving a message with a staffer.
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Phone Script</p>

                <div className="space-y-3">
                  <p>
                    <strong className="text-gray-900 dark:text-white">Introduction:</strong>
                    <br />
                    &quot;Hi, my name is <span className="text-purple-600 dark:text-purple-400">[Your Name]</span>, and I&apos;m a constituent in <span className="text-purple-600 dark:text-purple-400">[your city/town]</span>. Is this <span className="text-purple-600 dark:text-purple-400">[Representative/Senator Last Name]</span>? &quot;
                  </p>

                  <p className="text-sm italic">
                    If the legislator answers, you can speak directly. If it&apos;s a staff member, ask if the legislator is available. If not, the staffer can take your message.
                  </p>

                  <p>
                    <strong className="text-gray-900 dark:text-white">State your purpose:</strong>
                    <br />
                    &quot;I&apos;m calling about <span className="text-purple-600 dark:text-purple-400">[Bill Number, e.g., HB 234]</span> regarding <span className="text-purple-600 dark:text-purple-400">[brief topic description]</span>. This issue matters to me because <span className="text-purple-600 dark:text-purple-400">[one or two sentences about personal impact]</span>.&quot;
                  </p>

                  <p>
                    <strong className="text-gray-900 dark:text-white">Make your ask:</strong>
                    <br />
                    &quot;I&apos;d like to ask <span className="text-purple-600 dark:text-purple-400">[Representative/Senator Last Name]</span> to <span className="text-purple-600 dark:text-purple-400">[vote yes/no, co-sponsor, support in committee]</span> on this bill.&quot;
                  </p>

                  <p>
                    <strong className="text-gray-900 dark:text-white">Engage if they respond:</strong>
                    <br />
                    Unlike congressional calls, your state legislator may want to discuss the issue with you. Be ready to share your perspective, answer questions, or listen to their position. This is a genuine opportunity to influence their thinking.
                  </p>

                  <p>
                    <strong className="text-gray-900 dark:text-white">Close:</strong>
                    <br />
                    &quot;Thank you for your time. I appreciate your service to our district. Would it be possible to get an update on your position before the vote?&quot;
                  </p>
                </div>
              </div>

              <p className="text-sm italic">
                Tip: If you call during an off-session period, try their district office or personal number if publicly listed. Many part-time legislators list a home or mobile number on the legislature&apos;s website.
              </p>
            </div>
          </section>

          {/* Sample Email for State Legislators */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              Sample Email for State Legislators
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Emails to state legislators can be more conversational than those to Congress. In many states, your email goes directly to the legislator&apos;s inbox rather than being screened by staff. This is your chance to make a personal connection.
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Email Template</p>

                <div className="space-y-3">
                  <p>
                    <strong className="text-gray-900 dark:text-white">Subject Line:</strong>
                    <br />
                    <span className="text-purple-600 dark:text-purple-400">[Your City]</span> constituent - Please <span className="text-purple-600 dark:text-purple-400">[support/oppose]</span> <span className="text-purple-600 dark:text-purple-400">[Bill Number]</span>
                  </p>

                  <p>
                    <strong className="text-gray-900 dark:text-white">Body:</strong>
                  </p>

                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-4 space-y-3 text-sm">
                    <p>Dear <span className="text-purple-600 dark:text-purple-400">[Representative/Senator]</span> <span className="text-purple-600 dark:text-purple-400">[Last Name]</span>,</p>

                    <p>My name is <span className="text-purple-600 dark:text-purple-400">[Your Name]</span> and I live in <span className="text-purple-600 dark:text-purple-400">[your city/neighborhood]</span> in your district. I&apos;m writing to ask you to <span className="text-purple-600 dark:text-purple-400">[support/oppose]</span> <span className="text-purple-600 dark:text-purple-400">[Bill Number - Bill Name]</span>.</p>

                    <p>This issue is important to me personally because <span className="text-purple-600 dark:text-purple-400">[explain your connection to the issue. Be specific and genuine. Mention your neighborhood, your family, your workplace, or your community. One or two paragraphs is plenty.]</span></p>

                    <p>I understand that you serve on the <span className="text-purple-600 dark:text-purple-400">[relevant committee, if applicable]</span>, and I hope you&apos;ll consider the impact this bill would have on families like mine in <span className="text-purple-600 dark:text-purple-400">[your city/town]</span>.</p>

                    <p>I&apos;d welcome the chance to discuss this further. I&apos;m also happy to attend any upcoming town halls or office hours where we could speak in person.</p>

                    <p>
                      Thank you for representing our community,
                      <br />
                      <span className="text-purple-600 dark:text-purple-400">[Your Full Name]</span>
                      <br />
                      <span className="text-purple-600 dark:text-purple-400">[Your Address]</span>
                      <br />
                      <span className="text-purple-600 dark:text-purple-400">[Your Phone Number - optional but recommended]</span>
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm italic">
                Tip: Mentioning your specific neighborhood or community helps the legislator connect your message to their district. Offering to meet in person signals that you&apos;re an engaged, long-term constituent, not just sending a form letter.
              </p>
            </div>
          </section>

          {/* State vs Federal: When to Contact Which */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </span>
              State vs. Federal: When to Contact Which
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                One of the most common mistakes in advocacy is contacting the wrong level of government. Here&apos;s a quick reference to help you direct your energy where it will actually make a difference.
              </p>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-sm font-semibold text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                  <div>Issue</div>
                  <div>Who Handles It</div>
                  <div>Who to Contact</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Education Funding</div>
                  <div>State</div>
                  <div>State legislators</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-white dark:bg-gray-900 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Social Security</div>
                  <div>Federal</div>
                  <div>Members of Congress</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Healthcare (Medicaid)</div>
                  <div>Both</div>
                  <div>State legislators <em>and</em> Congress</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-white dark:bg-gray-900 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Gun Laws</div>
                  <div>Both</div>
                  <div>State legislators <em>and</em> Congress</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Immigration</div>
                  <div>Federal</div>
                  <div>Members of Congress</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-white dark:bg-gray-900 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Zoning &amp; Land Use</div>
                  <div>Local / State</div>
                  <div>City council, state legislators</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Minimum Wage</div>
                  <div>Both</div>
                  <div>State legislators <em>and</em> Congress</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-white dark:bg-gray-900 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Driver&apos;s Licenses</div>
                  <div>State</div>
                  <div>State legislators</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Veterans Affairs</div>
                  <div>Federal</div>
                  <div>Members of Congress</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-white dark:bg-gray-900 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Cannabis Laws</div>
                  <div>Both</div>
                  <div>State legislators <em>and</em> Congress</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Public Transit</div>
                  <div>State / Local</div>
                  <div>State legislators, city council</div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm bg-white dark:bg-gray-900 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-white">Foreign Policy</div>
                  <div>Federal</div>
                  <div>Members of Congress</div>
                </div>
              </div>

              <p className="text-sm italic">
                When in doubt, contact both levels. Even if an issue is primarily federal, your state legislators may be able to pass complementary state legislation or resolutions that signal support.
              </p>
            </div>
          </section>

          {/* Attending Committee Hearings */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Attending Committee Hearings
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Committee hearings are where the real work of legislating happens at the state level. Most bills live or die in committee. They never reach a full floor vote. Attending and testifying at hearings is one of the most powerful forms of civic engagement available to you.
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What Are Committee Hearings?</h3>
                  <p>
                    State legislatures divide their work among committees that focus on specific areas like education, transportation, health, or judiciary. When a bill is introduced, it gets assigned to the relevant committee. The committee then holds hearings where legislators hear testimony, ask questions, and eventually vote on whether to send the bill to the full chamber. These hearings are open to the public.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Find Hearing Schedules</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Check your state legislature&apos;s official website. Most post committee calendars and agendas online, usually under &quot;Committees&quot; or &quot;Calendar.&quot;</li>
                    <li>Use <a href="https://openstates.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Open States</a> to track specific bills and see when they&apos;re scheduled for hearings.</li>
                    <li>Sign up for email alerts from your state legislature. Many offer notifications when a bill you&apos;re tracking is scheduled for a hearing.</li>
                    <li>Follow relevant committees on social media or subscribe to their newsletters.</li>
                    <li>Call the committee clerk&apos;s office directly to confirm hearing dates and ask about public testimony procedures.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Sign Up to Testify</h3>
                  <p className="mb-2">
                    The process varies by state, but here is what to expect:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong className="text-gray-900 dark:text-white">Pre-registration</strong>: Some states require you to sign up online in advance. Check the committee&apos;s page for a sign-up form or instructions.</li>
                    <li><strong className="text-gray-900 dark:text-white">Day-of sign-up</strong>: Many states let you sign up to testify when you arrive at the hearing. You&apos;ll fill out a card or form indicating the bill number, your name, and whether you support or oppose it.</li>
                    <li><strong className="text-gray-900 dark:text-white">Written testimony</strong>: If you cannot attend in person, most committees accept written testimony submitted by email or through an online portal. This still gets entered into the official record.</li>
                    <li><strong className="text-gray-900 dark:text-white">Virtual testimony</strong>: Since 2020, many states have added options for testifying remotely via video or phone. Check if your state offers this.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What to Prepare</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong className="text-gray-900 dark:text-white">Know the bill</strong>: Read the bill text or at least a reliable summary. Understand what it does and what section concerns you.</li>
                    <li><strong className="text-gray-900 dark:text-white">Write your testimony</strong>: Prepare 2-3 minutes of remarks. State who you are, where you live, and why this bill matters to you personally. Stick to one or two key points.</li>
                    <li><strong className="text-gray-900 dark:text-white">Bring copies</strong>: Print several copies of your written testimony to hand to committee members and the clerk.</li>
                    <li><strong className="text-gray-900 dark:text-white">Practice</strong>: Read your testimony aloud a few times. Committee chairs will often cut you off when your time is up, so make sure your most important point comes first.</li>
                    <li><strong className="text-gray-900 dark:text-white">Prepare for questions</strong>: Committee members may ask you follow-up questions. It&apos;s perfectly fine to say &quot;I don&apos;t know&quot; and offer to follow up in writing.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tips for Effective Testimony</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong className="text-gray-900 dark:text-white">Tell your story</strong>: Personal narratives are far more persuasive than statistics. Legislators hear data all day, and your lived experience is what moves them.</li>
                    <li><strong className="text-gray-900 dark:text-white">Be respectful and concise</strong>: Thank the committee for their time. Stay within your allotted time. Avoid reading verbatim if you can. Eye contact matters.</li>
                    <li><strong className="text-gray-900 dark:text-white">Arrive early</strong>: Hearings can run long and testimony is usually taken in sign-up order. Arriving early also gives you time to get oriented.</li>
                    <li><strong className="text-gray-900 dark:text-white">Dress appropriately</strong>: Business casual is a safe choice. You want to be taken seriously as a citizen participant.</li>
                    <li><strong className="text-gray-900 dark:text-white">Don&apos;t repeat others</strong>: If someone before you made your exact point, it&apos;s fine to say &quot;I agree with the previous testimony and would like to add...&quot; rather than repeating the same argument.</li>
                    <li><strong className="text-gray-900 dark:text-white">Even showing up matters</strong>: If you don&apos;t want to testify, you can still sign in as &quot;for&quot; or &quot;against&quot; a bill. Committees count these numbers, and your physical presence in the room demonstrates public interest.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your Elected Officials
                </Link>
              </li>
              <li>
                <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Write an Effective Letter to Congress
                </Link>
              </li>
              <li>
                <Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How a Bill Becomes Law
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to contact your state legislators?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find all your officials, federal and state, with one address lookup.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Find Your Legislators
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
