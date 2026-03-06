import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Tell Your Story: Effective Advocacy Through Personal Stories | My Democracy',
  description: 'Learn why personal stories matter when contacting elected officials and how to structure them so staffers flag your message for attention.',
  keywords: ['advocacy storytelling', 'contact congress', 'personal story', 'constituent stories', 'effective advocacy', 'civic engagement'],
  openGraph: {
    title: 'Tell Your Story: Effective Advocacy Through Personal Stories | My Democracy',
    description: 'Learn why personal stories matter when contacting elected officials and how to structure them so staffers flag your message for attention.',
    type: 'article',
  },
};

export default function TellYourStoryGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Tell Your Story', href: '/guides/tell-your-story' }]} />
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
          Tell Your Story
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Personal stories are the most powerful tool in constituent advocacy. Here&apos;s why they matter, how to structure them, and what makes staffers flag a message for the legislator&apos;s personal attention.
          </p>

          {/* Why Stories Matter */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              Why Personal Stories Matter
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Congressional offices process thousands of messages. Statistics and policy arguments blur together. But a real story from a real constituent? That stands out.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Stories work because:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">They&apos;re memorable</strong>: A staffer might forget the tenth email about healthcare costs, but they&apos;ll remember the parent who couldn&apos;t afford insulin for their child.</li>
                <li><strong className="text-gray-900 dark:text-white">They&apos;re credible</strong>: You&apos;re the expert on your own life. No one can challenge your personal experience.</li>
                <li><strong className="text-gray-900 dark:text-white">They&apos;re usable</strong>: Legislators use constituent stories in floor speeches, press releases, and committee hearings. Your story could shape the national conversation.</li>
                <li><strong className="text-gray-900 dark:text-white">They humanize policy</strong>: Abstract debates become real when tied to real people.</li>
              </ul>
            </div>
          </section>

          {/* What Gets Flagged */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </span>
              What Gets Flagged for the Member
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Not every message reaches the legislator personally. Most are logged and categorized by staff. But certain messages get elevated. Former staffers say they flag messages that:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Tell a compelling personal story</strong> with specific, concrete details</li>
                <li><strong className="text-gray-900 dark:text-white">Could be used publicly</strong>: in a speech, hearing, or press statement</li>
                <li><strong className="text-gray-900 dark:text-white">Come from key constituents</strong>: business owners, community leaders, or people directly affected by pending legislation</li>
                <li><strong className="text-gray-900 dark:text-white">Offer a unique perspective</strong> the office hasn&apos;t heard before</li>
                <li><strong className="text-gray-900 dark:text-white">Are well-written and professional</strong>: demonstrating the constituent took time and care</li>
              </ul>
            </div>
          </section>

          {/* How to Structure Your Story */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </span>
              How to Structure Your Story
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. The Hook (1-2 sentences)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Start with what makes your situation compelling. Lead with the human element, not policy details.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Example:</span> &quot;Last month, I had to choose between buying groceries and buying my daughter&apos;s asthma medication.&quot;
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. The Context (2-3 sentences)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Briefly explain your situation. Include relevant details: where you live, your job, family circumstances.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Example:</span> &quot;I&apos;m a teacher in Springfield and a single mom. My daughter Emma, age 8, has severe asthma. Our insurance covers the medication, but the copay is still $250 a month.&quot;
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. The Impact (2-3 sentences)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Describe concrete effects on your life. Use specific details: numbers, dates, consequences.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Example:</span> &quot;That&apos;s 10% of my take-home pay, just for one medication. Last winter, I stretched her prescription to make it last longer. She ended up in the emergency room.&quot;
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. The Ask (1-2 sentences)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Connect your story to specific action. Reference a bill if possible.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Example:</span> &quot;Please support HR 1234, the Prescription Drug Affordability Act. No parent should have to gamble with their child&apos;s health because medication costs too much.&quot;
                </div>
              </div>
            </div>
          </section>

          {/* Story Elements That Work */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Story Elements That Work
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Specific numbers</strong>: &quot;$847 a month&quot; is more powerful than &quot;expensive&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">Names and ages</strong>: &quot;My son Marcus, 12&quot; is more real than &quot;my child&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">A turning point</strong>: The moment things changed, the decision you faced</li>
                <li><strong className="text-gray-900 dark:text-white">Local details</strong>: Mention your town, local businesses, community connections</li>
                <li><strong className="text-gray-900 dark:text-white">The impossible choice</strong>: Two options that shouldn&apos;t be in conflict</li>
                <li><strong className="text-gray-900 dark:text-white">What you tried</strong>: Shows you&apos;re not just complaining, but exhausted alternatives</li>
              </ul>
            </div>
          </section>

          {/* What to Avoid */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What to Avoid
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Generalizations</strong>: &quot;Many people struggle&quot; is less powerful than your specific struggle</li>
                <li><strong className="text-gray-900 dark:text-white">Statistics without story</strong>: Numbers support your story; they don&apos;t replace it</li>
                <li><strong className="text-gray-900 dark:text-white">Exaggeration</strong>: Stick to the truth. Credibility is everything.</li>
                <li><strong className="text-gray-900 dark:text-white">Blaming the legislator</strong>: Focus on the problem and solution, not attacks</li>
                <li><strong className="text-gray-900 dark:text-white">Too much context</strong>: Get to the emotional core quickly</li>
                <li><strong className="text-gray-900 dark:text-white">Oversharing</strong>: Include what&apos;s relevant, not your entire life history</li>
              </ul>
            </div>
          </section>

          {/* Example Full Message */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Example: A Complete Story-Driven Message
            </h2>
            <div className="pl-10">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                <p>Dear Representative Johnson,</p>
                <p>
                  My name is Maria Chen, and I live at 142 Oak Street in Riverside. I&apos;m writing about childcare costs.
                </p>
                <p>
                  Two years ago, my husband and I both worked full-time. Then we had twins. When we looked at childcare costs, $2,400 a month for two infants in our area, we did the math. After taxes, it would cost more than my entire salary to have both kids in daycare.
                </p>
                <p>
                  I quit my job as an accountant. I didn&apos;t want to. I loved my career. But paying to work made no financial sense. Now we&apos;re a single-income family in a two-income economy. We&apos;ve burned through our savings and postponed buying a home indefinitely.
                </p>
                <p>
                  I&apos;m not asking for a handout. I want to work. I want to contribute to my family and pay taxes. But until childcare is affordable, I&apos;m stuck.
                </p>
                <p>
                  Please support HR 5678, the Childcare for Working Families Act. Families like mine are counting on you.
                </p>
                <p>
                  Thank you for your time,<br />
                  Maria Chen<br />
                  Riverside, [State] [ZIP]
                </p>
              </div>
            </div>
          </section>

          {/* What Happens to Your Story */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              What Happens to Your Story
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>When you share a compelling personal story:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Staff may flag it for the legislator to read personally</li>
                <li>It might be saved in a file of &quot;powerful constituent stories&quot; for future use</li>
                <li>The legislator may quote it (anonymously or with permission) in a floor speech or hearing</li>
                <li>It could appear in press releases or op-eds</li>
                <li>Staff may follow up to learn more or request permission to share</li>
              </ul>
              <p>
                Your story has power beyond the moment you send it. It becomes part of the case for change.
              </p>
            </div>
          </section>

          {/* More Story Examples */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </span>
              More Story Examples
            </h2>
            <div className="pl-10 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                The Hook &rarr; Context &rarr; Impact &rarr; Ask structure works across every policy area. Here are three more examples showing how different constituents can tell their stories effectively.
              </p>

              {/* Veteran Example */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">A Veteran on VA Healthcare Wait Times</h3>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                  <p>Dear Senator Williams,</p>
                  <p>
                    My name is James Herrera, and I live at 305 Birch Lane in Fort Worth. I served two tours in Afghanistan with the 82nd Airborne. I&apos;m writing because the VA is failing veterans like me.
                  </p>
                  <p>
                    In January, I called the Dallas VA Medical Center to schedule an appointment for recurring knee pain from a service-related injury. The earliest available appointment was 14 weeks out. Fourteen weeks of limping to my warehouse job, popping over-the-counter painkillers, and hoping the damage wasn&apos;t getting worse.
                  </p>
                  <p>
                    By the time I finally saw a doctor in April, the cartilage damage had progressed. What could have been treated with physical therapy now requires surgery, surgery with its own six-month waitlist. I&apos;ve used 11 sick days so far this year. My supervisor has been patient, but I can feel that patience running out.
                  </p>
                  <p>
                    I didn&apos;t hesitate when my country asked me to serve. I&apos;m asking you not to hesitate now. Please support S. 2100, the Veterans Timely Access to Care Act, so that no veteran has to watch a treatable injury become a serious one while waiting in line.
                  </p>
                  <p>
                    Respectfully,<br />
                    James Herrera<br />
                    Fort Worth, TX 76109
                  </p>
                </div>
              </div>

              {/* Small Business Owner Example */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">A Small Business Owner on Regulatory Burden</h3>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                  <p>Dear Representative Park,</p>
                  <p>
                    My name is Diane Okafor, and I own Sunrise Bakery at 88 Main Street in Glendale. I&apos;ve been in business for nine years, and I employ 14 people, most of them from our neighborhood. I&apos;m writing because compliance paperwork is strangling my business.
                  </p>
                  <p>
                    Last year, I spent over $18,000 on accounting and legal fees just to stay compliant with federal reporting requirements. That&apos;s not taxes. That&apos;s the cost of figuring out what I owe and filling out the right forms. I now complete 37 different federal and state filings annually. Every hour I spend on paperwork is an hour I&apos;m not baking, training staff, or serving customers.
                  </p>
                  <p>
                    I had planned to open a second location this year and hire ten more people. I&apos;ve shelved those plans. The cost and complexity of doubling my compliance burden makes expansion feel like a trap rather than an opportunity. That&apos;s 10 jobs our community won&apos;t see.
                  </p>
                  <p>
                    Please co-sponsor HR 3300, the Small Business Regulatory Relief Act. Small businesses like mine want to grow and create jobs. We just need the government to stop making it so expensive to try.
                  </p>
                  <p>
                    Sincerely,<br />
                    Diane Okafor<br />
                    Glendale, CA 91205
                  </p>
                </div>
              </div>

              {/* Student Example */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">A Student on Student Loan Debt</h3>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                  <p>Dear Senator Mitchell,</p>
                  <p>
                    My name is Priya Sharma. I&apos;m 26 years old and live at 1200 Elm Avenue in Columbus. I graduated from Ohio State three years ago with a degree in social work and $74,000 in federal student loan debt. I&apos;m writing because that debt is shaping every decision I make.
                  </p>
                  <p>
                    I work full-time as a child welfare caseworker for Franklin County. It&apos;s work I believe in deeply. My monthly student loan payment is $687, nearly a third of my take-home pay. After rent, loans, and basic expenses, I have about $120 left each month. I haven&apos;t seen a dentist in two years. I drive a car with 190,000 miles on it because I can&apos;t afford a repair, let alone a replacement.
                  </p>
                  <p>
                    I chose public service on purpose. I wanted to help kids in crisis, not chase a Wall Street salary. But my loan servicer doesn&apos;t care about my career choice. Three years of payments and I still owe $68,000 because most of my payment goes to interest. At this rate, I&apos;ll be 48 before I&apos;m free of this debt. I can&apos;t save for a home. Starting a family feels irresponsible.
                  </p>
                  <p>
                    Please support S. 1500, the Student Loan Borrower Relief Act, especially its provisions for public service workers. People like me shouldn&apos;t have to choose between helping our communities and building a life of our own.
                  </p>
                  <p>
                    Thank you,<br />
                    Priya Sharma<br />
                    Columbus, OH 43201
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Where to Tell Your Story */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Where to Tell Your Story
            </h2>
            <div className="pl-10 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                Your story can have impact in many places beyond a single email. Each venue has its own conventions, audience, and strategic value. Here&apos;s where to share your story and how to adapt it for each setting.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Direct Messages to Officials</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Email, phone calls, and physical letters are the bread and butter of constituent advocacy. Each format favors a different approach:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li><strong className="text-gray-900 dark:text-white">Email</strong>: Use the full Hook &rarr; Context &rarr; Impact &rarr; Ask structure. Keep it under 400 words. Include your name and full address so staff can verify you&apos;re a constituent.</li>
                  <li><strong className="text-gray-900 dark:text-white">Phone</strong>: Condense your story to 60 seconds. Lead with your name, ZIP code, and the bill number. Share one vivid detail from your experience, then make your ask. The staffer will log it.</li>
                  <li><strong className="text-gray-900 dark:text-white">Physical letter</strong>: Carries extra weight because it takes more effort. Follow the email format but print it on clean paper and sign it by hand. Mail to the district office for faster delivery.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Public Testimony at Committee Hearings</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Both Congress and state legislatures hold hearings where members of the public can testify. This is one of the highest-impact ways to share your story because it enters the official record.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Check your state legislature&apos;s website or Congress.gov for upcoming hearings on issues you care about.</li>
                  <li>Request a slot to testify. Many committees accept public sign-ups, especially at the state level.</li>
                  <li>Prepare a written version (usually 2-3 pages) and a shorter spoken version (often limited to 3-5 minutes).</li>
                  <li>Practice reading it aloud. Speak slowly and make eye contact with the committee members.</li>
                  <li>Bring copies of your written testimony to hand out.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Town Hall Meetings and Constituent Forums</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Town halls are public events where legislators hear directly from constituents. Your story can shape the conversation, and other attendees may amplify it.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Arrive early to get a seat near the front or sign up for the question queue.</li>
                  <li>Prepare a 30-60 second version of your story that ends with a clear question for the legislator.</li>
                  <li>Be respectful but direct. The audience and press are watching.</li>
                  <li>If the event is recorded, your story could reach a much wider audience.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Op-Eds and Letters to the Editor</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Local newspapers are still closely monitored by legislative offices. A published letter or op-ed puts your story in front of thousands of constituents and the legislator&apos;s press team.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li><strong className="text-gray-900 dark:text-white">Letters to the editor</strong>: Usually 150-200 words. Pick one aspect of your story and connect it to a timely news event or vote. Submit through the newspaper&apos;s website.</li>
                  <li><strong className="text-gray-900 dark:text-white">Op-eds</strong>: Usually 600-800 words. Tell your full story with more context. Include a call to action. Pitch it to the opinion editor with a one-paragraph summary of who you are and why this matters now.</li>
                  <li>Mention your legislator by name. This makes it much more likely their office will notice.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Social Media</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Tagging your official on social media creates public accountability. A compelling story that goes viral can move an issue faster than a hundred private emails.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Tag your official&apos;s account directly. Staff monitor these mentions.</li>
                  <li>Keep it concise. Lead with the hook, share one powerful detail, and make your ask.</li>
                  <li>Use relevant hashtags to reach broader advocacy communities.</li>
                  <li>Video is especially powerful. A 60-second clip of you telling your story can reach thousands.</li>
                  <li>Be prepared for public responses, both supportive and critical.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Campaign Pages</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Platforms like My Democracy let you create structured, shareable advocacy campaigns built around your story.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Your story becomes the foundation of a campaign that others can support and share.</li>
                  <li>The platform helps you direct your message to the right legislators automatically.</li>
                  <li>Other constituents who share your experience can add their voices, building collective power.</li>
                  <li>Campaign pages provide a permanent, linkable home for your story that you can reference across other venues.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">News Media Interviews</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Journalists are always looking for real people affected by the policies they cover. Being a source in a news story can amplify your message enormously.
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Reach out to local reporters who cover the policy area you care about. A brief email explaining your story and offering to be interviewed is often enough.</li>
                  <li>Prepare 2-3 key points you want to make, and practice saying them in plain language.</li>
                  <li>You can set ground rules. Let the reporter know if there are details you want to keep off the record.</li>
                  <li>Ask if you can review your quotes before publication. Many reporters will accommodate this.</li>
                  <li>Share the published article with your legislator&apos;s office. Media coverage adds significant weight to your advocacy.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Common Pitfalls */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              Common Pitfalls
            </h2>
            <div className="pl-10 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                Even well-intentioned advocacy messages can miss the mark. Here are the most common mistakes and how to avoid them.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Making It About Policy Wonkery Instead of Human Impact</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  It&apos;s tempting to prove how much you know about an issue by citing studies, reciting legislative history, or debating economic theory. Resist this urge. Staffers have policy analysts for that. What they need from you is the human side.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p><span className="text-red-500 dark:text-red-400 font-medium">Pitfall:</span> &quot;According to a 2024 CBO analysis, the current subsidy structure creates a marginal tax rate cliff at 400% FPL that disincentivizes workforce participation among middle-income households...&quot;</p>
                  <p><span className="text-green-600 dark:text-green-400 font-medium">Better:</span> &quot;I got a $2/hour raise at work and lost my health insurance subsidy. My family&apos;s monthly premium jumped from $180 to $910. A raise cost me money.&quot;</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Being So Emotional That the Ask Gets Lost</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Emotion is powerful, but it needs to be channeled, not unleashed. A message that&apos;s all pain and no direction leaves the staffer sympathetic but unsure what to do. Every story needs to land on a specific request.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p><span className="text-red-500 dark:text-red-400 font-medium">Pitfall:</span> Three paragraphs of heartbreak followed by &quot;Something has to change!!! When will someone DO something?!&quot;</p>
                  <p><span className="text-green-600 dark:text-green-400 font-medium">Better:</span> Channel that emotion into a clear closing: &quot;Please vote yes on HR 1234 when it comes to the floor next month. My family can&apos;t wait any longer.&quot;</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Not Connecting Your Experience to a Specific Policy Action</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  A moving story without a policy connection is just a story. Staffers categorize messages by issue and position: &quot;supports HR 1234&quot; or &quot;opposes S. 567.&quot; If your message doesn&apos;t reference a specific bill, vote, or action, it&apos;s much harder to count and much easier to set aside.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p><span className="text-red-500 dark:text-red-400 font-medium">Pitfall:</span> &quot;Healthcare costs are too high. Please fix this.&quot;</p>
                  <p><span className="text-green-600 dark:text-green-400 font-medium">Better:</span> &quot;Please co-sponsor the Prescription Drug Affordability Act (HR 1234), which would cap out-of-pocket insulin costs at $35 a month.&quot;</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Writing a Novel Instead of a Focused Story</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Staffers process hundreds of messages a day. A 2,000-word message, no matter how well-written, will get skimmed at best. The most effective messages are 200-400 words. Every sentence should earn its place.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p><span className="text-red-500 dark:text-red-400 font-medium">Pitfall:</span> Starting from your childhood, tracing your entire career history, explaining every detail of your insurance plan, and eventually arriving at the point on page two.</p>
                  <p><span className="text-green-600 dark:text-green-400 font-medium">Better:</span> Start at the moment of impact. &quot;Last Tuesday, I opened my pharmacy bill and saw $847.&quot; Then give just enough context to make that number meaningful.</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Forgetting to Include Your Name and Address</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  This is surprisingly common, and it can sink an otherwise powerful message. Legislative offices prioritize constituents. If they can&apos;t verify that you live in their district, your message may be discarded entirely. Always include your full name, street address, and ZIP code.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p><span className="text-red-500 dark:text-red-400 font-medium">Pitfall:</span> A passionate, well-structured message signed only with &quot;- A Concerned Citizen&quot;</p>
                  <p><span className="text-green-600 dark:text-green-400 font-medium">Better:</span> Close with your full name, street address, city, state, and ZIP. This isn&apos;t about surveillance. It&apos;s about proving you&apos;re a real constituent whose vote matters to this specific legislator.</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Using Someone Else&apos;s Story Instead of Your Own</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  It&apos;s natural to want to share a friend&apos;s or family member&apos;s story, especially if it&apos;s more dramatic than your own. But secondhand stories lose their credibility and emotional punch. Staffers can tell the difference between &quot;this happened to me&quot; and &quot;I heard about someone who...&quot;
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p><span className="text-red-500 dark:text-red-400 font-medium">Pitfall:</span> &quot;My neighbor told me her mother couldn&apos;t get her medication and I think that&apos;s really sad and wrong.&quot;</p>
                  <p><span className="text-green-600 dark:text-green-400 font-medium">Better:</span> Tell your own story, even if it feels smaller. &quot;I spent three hours on the phone with my insurance company last week trying to get my prescription approved.&quot; If someone else&apos;s story is more compelling, encourage them to write their own message, and offer to help them do it.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Write an Effective Letter to Congress
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your Elected Officials
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-contact-your-state-legislators" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your State Legislators
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to tell your story?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            My Democracy helps you craft a powerful, personalized message with AI assistance. Your story, your words.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Share Your Story
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
