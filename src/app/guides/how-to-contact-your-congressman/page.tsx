import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Contact Your Congressman | My Democracy',
  description: 'Step-by-step guide to contacting your US Representatives and Senators by phone, email, and letter. Learn which methods are most effective.',
  keywords: ['contact congressman', 'contact senator', 'call congress', 'email representative', 'write to congress', 'congressional office'],
  openGraph: {
    title: 'How to Contact Your Congressman | My Democracy',
    description: 'Step-by-step guide to contacting your US Representatives and Senators by phone, email, and letter. Learn which methods are most effective.',
    type: 'article',
  },
};

export default function ContactCongressmanGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How to Contact Your Congressman', href: '/guides/how-to-contact-your-congressman' }]} />
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
          How to Contact Your Congressman
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Every American has three members of Congress: two US Senators representing your state and one US Representative for your district. Here&apos;s how to reach them effectively.
          </p>

          {/* Who Represents You */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Who Represents You?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                <strong className="text-gray-900 dark:text-white">US Senators (2)</strong> — Represent your entire state. Serve 6-year terms. Vote on federal legislation, confirm presidential appointments, and ratify treaties.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">US Representative (1)</strong> — Represents your congressional district. Serves 2-year terms. Votes on federal legislation and controls the federal budget.
              </p>
              <p>
                Not sure who represents you? <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline">Enter your address</Link> to find out instantly.
              </p>
            </div>
          </section>

          {/* Contact Methods */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              Contact Methods (Most to Least Effective)
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Phone Calls</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  The most effective way to contact Congress. A staff member answers, logs your position, and passes it to the legislator. During important votes, offices track call volume closely.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>Call the DC office for federal issues</li>
                  <li>Call district offices for local concerns</li>
                  <li>Expect to speak for 1-2 minutes</li>
                  <li>State your name, address, and position clearly</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Personalized Emails</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Emails written in your own words carry more weight than form letters. Congressional offices can tell the difference and prioritize original messages.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>Use the contact form on the official website</li>
                  <li>Include your full address (they verify constituents)</li>
                  <li>Be specific about the issue and your ask</li>
                  <li>Share a personal story if relevant</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Physical Letters</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Handwritten or typed letters demonstrate serious commitment. However, mail to Congress is screened for security and may be delayed.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>Send to the district office for faster delivery</li>
                  <li>DC mail undergoes irradiation and delays</li>
                  <li>Keep it to one page</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. In-Person Meetings</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Request a meeting through the scheduler. You&apos;ll likely meet with a staff member, which is valuable — they brief the legislator and often specialize in your issue area.
                </p>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Best Practices
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Be a constituent</strong> — Only contact your own representatives. They won&apos;t respond to non-constituents.</li>
                <li><strong className="text-gray-900 dark:text-white">Be specific</strong> — Reference bill numbers, ask for specific votes, name the issue clearly.</li>
                <li><strong className="text-gray-900 dark:text-white">Be brief</strong> — Staff handle hundreds of contacts daily. Get to the point.</li>
                <li><strong className="text-gray-900 dark:text-white">Be respectful</strong> — Even when frustrated. Rudeness gets you flagged and ignored.</li>
                <li><strong className="text-gray-900 dark:text-white">Share your story</strong> — Personal experiences are more persuasive than statistics. <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">Learn how</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Follow up</strong> — Multiple contacts on the same issue show sustained interest.</li>
              </ul>
            </div>
          </section>

          {/* What Happens to Your Message */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              What Happens to Your Message
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Congressional offices track and tally every constituent contact:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Staff logs your message by issue and position (support/oppose)</li>
                <li>Data is compiled into daily and weekly reports</li>
                <li>The legislator reviews constituent sentiment before key votes</li>
                <li>Compelling stories may be shared directly with the member</li>
              </ol>
              <p>
                Your message counts even if you don&apos;t get a personalized response. The numbers matter.
              </p>
            </div>
          </section>

          {/* Full Phone Script */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </span>
              Full Phone Script
            </h2>
            <div className="pl-10">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Nervous about calling? That&apos;s normal. Most calls last under two minutes. Here&apos;s a word-for-word script you can follow. A staff member (usually an intern or staff assistant) will answer the phone.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                <p className="font-semibold text-gray-900 dark:text-white">When the staffer answers:</p>
                <p>
                  &quot;Hi, my name is <span className="text-purple-600 dark:text-purple-400">[Your Full Name]</span> and I&apos;m a constituent from <span className="text-purple-600 dark:text-purple-400">[City, State]</span>, ZIP code <span className="text-purple-600 dark:text-purple-400">[ZIP]</span>.&quot;
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">State your issue:</p>
                <p>
                  &quot;I&apos;m calling to ask <span className="text-purple-600 dark:text-purple-400">[Senator/Representative Last Name]</span> to <span className="text-purple-600 dark:text-purple-400">[vote YES/NO on / co-sponsor / oppose]</span> <span className="text-purple-600 dark:text-purple-400">[Bill Number or Issue]</span>.&quot;
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">Explain briefly why (1-2 sentences):</p>
                <p>
                  &quot;This issue matters to me because <span className="text-purple-600 dark:text-purple-400">[your personal reason — how it affects you, your family, or your community]</span>.&quot;
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">Make your ask:</p>
                <p>
                  &quot;Can I count on <span className="text-purple-600 dark:text-purple-400">[Senator/Representative Last Name]</span> to <span className="text-purple-600 dark:text-purple-400">[specific action]</span>?&quot;
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">Close the call:</p>
                <p>
                  &quot;Thank you for your time. I appreciate the work your office does. Have a good day.&quot;
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Tip:</strong> The staffer may ask for your full address to confirm you&apos;re a constituent. They may also tell you the legislator&apos;s current position on the issue. Don&apos;t worry if you stumble — staff appreciate that you called, regardless of polish.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Full Email Template */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Full Email Template
            </h2>
            <div className="pl-10">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Use this template as a starting point, but personalize it with your own details and voice. Congressional offices can tell when a message is copied verbatim from a template, so make it your own.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                <p>
                  <strong className="text-gray-900 dark:text-white">Subject:</strong> <span className="text-purple-600 dark:text-purple-400">[Your Position: Support/Oppose]</span> — <span className="text-purple-600 dark:text-purple-400">[Bill Number or Issue Name]</span>
                </p>
                <p>Dear <span className="text-purple-600 dark:text-purple-400">[Senator/Representative]</span> <span className="text-purple-600 dark:text-purple-400">[Last Name]</span>,</p>
                <p>
                  My name is <span className="text-purple-600 dark:text-purple-400">[Your Full Name]</span> and I am a constituent living in <span className="text-purple-600 dark:text-purple-400">[City, State ZIP]</span>. I am writing to <span className="text-purple-600 dark:text-purple-400">[urge you to support / ask you to oppose / request your co-sponsorship of]</span> <span className="text-purple-600 dark:text-purple-400">[Bill Number]</span>, the <span className="text-purple-600 dark:text-purple-400">[Bill Name]</span>.
                </p>
                <p>
                  This issue is important to me because <span className="text-purple-600 dark:text-purple-400">[1-3 sentences explaining your personal connection to the issue. How does it affect you, your family, your community, or your livelihood? Specific details are more compelling than general statements.]</span>
                </p>
                <p>
                  <span className="text-purple-600 dark:text-purple-400">[Optional: Include a brief fact or statistic that supports your position. For example: &quot;According to the Congressional Budget Office, this legislation would...&quot;]</span>
                </p>
                <p>
                  I respectfully ask that you <span className="text-purple-600 dark:text-purple-400">[specific action: vote YES/NO, co-sponsor, sign the discharge petition, request a committee hearing, etc.]</span>. This would make a real difference for families like mine in <span className="text-purple-600 dark:text-purple-400">[your state or district]</span>.
                </p>
                <p>
                  Thank you for your time and for your service to our <span className="text-purple-600 dark:text-purple-400">[state/district]</span>. I look forward to hearing your position on this issue.
                </p>
                <p>
                  Sincerely,<br />
                  <span className="text-purple-600 dark:text-purple-400">[Your Full Name]</span><br />
                  <span className="text-purple-600 dark:text-purple-400">[Street Address]</span><br />
                  <span className="text-purple-600 dark:text-purple-400">[City, State ZIP]</span><br />
                  <span className="text-purple-600 dark:text-purple-400">[Email Address]</span><br />
                  <span className="text-purple-600 dark:text-purple-400">[Phone Number (optional)]</span>
                </p>
              </div>
            </div>
          </section>

          {/* How Congressional Mail Systems Work */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
              </span>
              How Congressional Mail Systems Work (CMS)
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Behind the scenes, every congressional office uses a <strong className="text-gray-900 dark:text-white">Correspondence Management System (CMS)</strong> to handle the thousands of messages they receive each week. Understanding how these systems work can help you ensure your message has maximum impact.
              </p>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">The Software</h3>
                <p>
                  Most offices use one of two major platforms: <strong className="text-gray-900 dark:text-white">IQ</strong> (by Lockheed Martin, commonly used in the Senate) or <strong className="text-gray-900 dark:text-white">Fireside</strong> (commonly used in the House). These systems manage incoming mail, track constituent contacts, and generate reports. Some offices have adopted newer platforms, but the core functionality is the same.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How Your Message Gets Processed</h3>
                <p>When your phone call, email, or letter arrives, here&apos;s what happens:</p>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li><strong className="text-gray-900 dark:text-white">Constituent verification</strong> — Staff checks your address against the district or state boundaries. If you&apos;re not a constituent, your message may not be logged at all.</li>
                  <li><strong className="text-gray-900 dark:text-white">Issue categorization</strong> — Your message is tagged with one or more issue codes (e.g., &quot;Healthcare — Prescription Drug Pricing&quot; or &quot;Environment — Climate Change&quot;). This is why stating your issue clearly matters.</li>
                  <li><strong className="text-gray-900 dark:text-white">Position coding</strong> — Staff marks your position: <strong className="text-gray-900 dark:text-white">support</strong>, <strong className="text-gray-900 dark:text-white">oppose</strong>, or <strong className="text-gray-900 dark:text-white">undecided/informational</strong>. Ambiguous messages are harder to code and may be categorized as &quot;general comment.&quot;</li>
                  <li><strong className="text-gray-900 dark:text-white">Response queuing</strong> — Your message is queued for a response letter, typically a form response tailored to the issue. Particularly compelling messages may be flagged for personal attention.</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">The Reports That Shape Decisions</h3>
                <p>
                  Every week, the legislative director or chief of staff compiles a <strong className="text-gray-900 dark:text-white">constituent mail report</strong>. These reports summarize the top issues by volume and show the breakdown of support versus opposition. Before a major vote, the legislator often reviews these numbers to gauge constituent sentiment.
                </p>
                <p className="mt-2">
                  A typical report might show: &quot;Healthcare — 847 contacts this week (612 support, 198 oppose, 37 undecided).&quot; This is why every single contact counts — you are literally a data point that influences decisions.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-sm">
                <p className="font-semibold text-purple-900 dark:text-purple-300 mb-1">Why this matters for you:</p>
                <p className="text-purple-800 dark:text-purple-300">
                  Be clear about your issue and your position. If a staffer can&apos;t quickly determine what you&apos;re for or against, your message may end up in a &quot;general comment&quot; bucket that carries less weight. State your position in the first sentence, reference a bill number if one exists, and say clearly whether you support or oppose it.
                </p>
              </div>
            </div>
          </section>

          {/* Common Mistakes */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              Common Mistakes to Avoid
            </h2>
            <div className="pl-10 space-y-4">
              <div className="text-gray-600 dark:text-gray-300">
                <p className="mb-4">Even well-intentioned constituents sometimes undermine their own advocacy. Here are the most common mistakes and how to avoid them:</p>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <span className="text-red-500 dark:text-red-400 font-bold text-lg leading-6 flex-shrink-0">1.</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Contacting representatives who don&apos;t represent you</p>
                      <p className="text-sm mt-1">
                        Congressional offices only log and respond to contacts from their own constituents. If you call a senator from another state, your message will be politely noted but will not be tallied in constituent reports. Focus your energy on your own two senators and one House representative. Not sure who they are? <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline">Look them up here</Link>.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-500 dark:text-red-400 font-bold text-lg leading-6 flex-shrink-0">2.</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Being too vague about what you want</p>
                      <p className="text-sm mt-1">
                        Messages like &quot;I care about the environment&quot; or &quot;Please help with healthcare&quot; don&apos;t give staff enough information to categorize your position or act on it. Instead, reference a specific bill, vote, or action: &quot;I urge you to vote YES on HR 1234.&quot; The more specific your ask, the more accurately your position is recorded.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-500 dark:text-red-400 font-bold text-lg leading-6 flex-shrink-0">3.</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Sending identical messages to all three members of Congress</p>
                      <p className="text-sm mt-1">
                        Your two senators and your House representative serve different roles and sit on different committees. A message about a House bill isn&apos;t relevant to a senator (and vice versa) unless it&apos;s already passed one chamber. Tailor each message to the right chamber and, if possible, mention the committee the legislator serves on if it&apos;s relevant to your issue.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-500 dark:text-red-400 font-bold text-lg leading-6 flex-shrink-0">4.</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Forgetting to include your address</p>
                      <p className="text-sm mt-1">
                        Without a verifiable address, offices cannot confirm you are a constituent. Many web contact forms require an address for this reason. If you call, be ready to provide your full street address and ZIP code. Without it, your contact may not be logged.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-500 dark:text-red-400 font-bold text-lg leading-6 flex-shrink-0">5.</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Writing too long</p>
                      <p className="text-sm mt-1">
                        Congressional staff members process hundreds of messages per day. A three-page letter won&apos;t get three times the attention of a one-page letter — in fact, it may get less. Keep written messages to one page or under 300 words. For phone calls, aim for under two minutes. The most effective messages are brief, clear, and personal.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-500 dark:text-red-400 font-bold text-lg leading-6 flex-shrink-0">6.</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Using threatening or abusive language</p>
                      <p className="text-sm mt-1">
                        Messages containing threats — even vague ones like &quot;you&apos;ll regret this&quot; — are flagged by staff and may be forwarded to the Capitol Police. Beyond the legal implications, hostile language ensures your message is dismissed rather than considered. You can be firm and passionate without being threatening. Expressing disappointment or concern is always more effective than anger.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Frequently Asked Questions
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Will my representative actually read my message?</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  In most cases, the legislator personally will not read your individual message. However, that does not mean it doesn&apos;t matter. Staff members read, categorize, and tally every constituent contact. The legislator reviews summary reports showing how many constituents support or oppose key issues. Exceptionally compelling personal stories may be pulled and shared directly with the member — sometimes even quoted on the floor of Congress. Your message influences the data that shapes their decisions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Should I contact all three of my members of Congress?</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  It depends on the issue. If you&apos;re writing about a bill in the House, contact your House representative. If it&apos;s a Senate bill, contact your two senators. For broad policy issues or executive branch actions, contacting all three can be appropriate. Just make sure to personalize each message for the correct chamber and legislator — a message asking your senator to vote on a House bill shows you haven&apos;t done your homework.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What if my representative already agrees with me?</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Contacting an ally is still valuable. It reinforces their position, gives them constituent stories to use in advocacy, and lets them know the issue has active support back home. Legislators who hear from constituents on an issue are more likely to prioritize it, co-sponsor related bills, and speak publicly about it. You might also ask them to take a leadership role — for example, asking them to whip votes from colleagues or sign onto a letter to committee leadership.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How long until I get a response?</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Response times vary widely. Phone calls typically don&apos;t receive a follow-up response — the conversation is your response. For emails and letters, expect a written reply in 4 to 8 weeks, though during busy legislative periods or crises it may take longer. The response is usually a form letter addressing the issue topic. Don&apos;t be discouraged by delayed or generic responses — the purpose of your contact is to be counted, not to start a correspondence.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Does contacting Congress actually work?</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Yes. There are documented cases where constituent pressure has changed votes, blocked legislation, and advanced stalled bills. The Affordable Care Act repeal effort in 2017 was derailed in part because of massive constituent phone campaigns. Congressional staff consistently report that high call volume on an issue gets a legislator&apos;s attention. Individual messages add up. When hundreds or thousands of constituents contact an office on the same issue, it signals political risk — and that is what moves elected officials.
                </p>
              </div>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
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
              <li>
                <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Tell Your Story: Make Your Message Stand Out
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to contact Congress?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find your representatives and send a personalized message in minutes.
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
