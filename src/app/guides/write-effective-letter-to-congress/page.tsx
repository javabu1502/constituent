import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Write an Effective Letter to Congress | My Democracy',
  description: 'Learn the structure, tips, and examples for writing messages that congressional offices actually read and respond to.',
  keywords: ['write to congress', 'letter to congressman', 'email representative', 'congressional correspondence', 'effective advocacy'],
  openGraph: {
    title: 'Write an Effective Letter to Congress | My Democracy',
    description: 'Learn the structure, tips, and examples for writing messages that congressional offices actually read and respond to.',
    type: 'article',
  },
};

export default function WriteLetterGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Write an Effective Letter to Congress', href: '/guides/write-effective-letter-to-congress' }]} />
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
          Write an Effective Letter to Congress
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Congressional offices receive thousands of messages. Here&apos;s how to write one that gets read, logged accurately, and potentially flagged for the legislator&apos;s personal attention.
          </p>

          {/* Why Personalized Letters Matter */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why Personalized Letters Matter
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Congressional staff can instantly recognize form letters and mass campaigns. While these still get tallied, they carry less weight than original correspondence.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">A personalized message signals:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>You took time to write -you&apos;re an engaged voter</li>
                <li>You have a real stake in the issue</li>
                <li>You might tell others and influence their votes</li>
                <li>Your story could be useful for the legislator&apos;s own advocacy</li>
              </ul>
            </div>
          </section>

          {/* The Essential Structure */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </span>
              The Essential Structure
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Identify Yourself as a Constituent</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Start with your full name and address. This is critical -offices only respond to and track messages from constituents. Include your city and ZIP code at minimum.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. State Your Purpose Immediately</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  In the first sentence, state the issue and your position. Staff sort messages by topic -make it easy for them to categorize yours correctly.
                </p>
                <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <span className="text-green-600 dark:text-green-400">Good:</span> &quot;I&apos;m writing to urge you to vote YES on HR 1234, the Clean Water Act.&quot;<br />
                  <span className="text-red-600 dark:text-red-400">Avoid:</span> &quot;I&apos;ve been thinking a lot about the environment lately...&quot;
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Explain Why It Matters to You</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Share your personal connection to the issue. This is what separates your message from form letters. <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">Learn how to tell your story effectively</Link>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. Make a Specific Ask</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Tell them exactly what you want them to do: vote yes/no, co-sponsor a bill, sign a letter, request a hearing. Vague requests get vague responses.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">5. Close Professionally</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Thank them for their time and service. Include your contact information if you&apos;d like a response.
                </p>
              </div>
            </div>
          </section>

          {/* Example Letter */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Example Letter
            </h2>
            <div className="pl-10">
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                <p>Dear Senator [Name],</p>
                <p>
                  My name is [Your Name], and I live in [City, State ZIP]. I&apos;m writing to urge you to vote YES on S. 1234, the Affordable Insulin Act.
                </p>
                <p>
                  My daughter was diagnosed with Type 1 diabetes at age 12. Last year, even with insurance, we paid over $4,000 out of pocket for her insulin. For many families, this cost is impossible -I&apos;ve heard stories of people rationing doses, which can be fatal.
                </p>
                <p>
                  This bill would cap insulin costs at $35 per month. That&apos;s the difference between my daughter living a normal life and our family facing impossible choices.
                </p>
                <p>
                  Please support S. 1234 and help make insulin affordable for the 7 million Americans who depend on it.
                </p>
                <p>
                  Thank you for your service and consideration.
                </p>
                <p>
                  Sincerely,<br />
                  [Your Name]<br />
                  [Address]<br />
                  [Email/Phone]
                </p>
              </div>
            </div>
          </section>

          {/* What to Include */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What to Include
            </h2>
            <div className="pl-10">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Bill number</strong> -If there&apos;s specific legislation, reference it (HR 1234, S. 5678)</li>
                <li><strong className="text-gray-900 dark:text-white">Your position</strong> -Support, oppose, or requesting action</li>
                <li><strong className="text-gray-900 dark:text-white">Personal story</strong> -How this issue affects you, your family, or community</li>
                <li><strong className="text-gray-900 dark:text-white">Specific ask</strong> -Vote, co-sponsor, hold a hearing, etc.</li>
                <li><strong className="text-gray-900 dark:text-white">Your contact info</strong> -So they can verify you&apos;re a constituent and respond</li>
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
                <li><strong className="text-gray-900 dark:text-white">Threats</strong> -Threatening language gets your message flagged and ignored</li>
                <li><strong className="text-gray-900 dark:text-white">Personal attacks</strong> -Insults won&apos;t change minds</li>
                <li><strong className="text-gray-900 dark:text-white">Lengthy manifestos</strong> -Keep it under one page. Staff don&apos;t have time for essays</li>
                <li><strong className="text-gray-900 dark:text-white">Multiple issues</strong> -One letter, one topic. Multi-issue letters get miscategorized</li>
                <li><strong className="text-gray-900 dark:text-white">Form letter language</strong> -If it sounds like a template, it gets treated like one</li>
                <li><strong className="text-gray-900 dark:text-white">All caps</strong> -It reads as shouting and looks like spam</li>
              </ul>
            </div>
          </section>

          {/* Tips from Congressional Staff */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              Tips from Congressional Staff
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Former congressional staffers consistently share these insights:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>&quot;We can tell a real letter in three seconds. Personal details matter.&quot;</li>
                <li>&quot;The best letters tell us something we can use -a story for the floor, a local angle for press.&quot;</li>
                <li>&quot;Timing matters. Before a vote is ideal. After, we still log it, but it&apos;s too late to influence that decision.&quot;</li>
                <li>&quot;We remember repeat contacts. Constituents who write multiple times on an issue get noticed.&quot;</li>
                <li>&quot;Professional and personal beats angry and generic every time.&quot;</li>
              </ul>
            </div>
          </section>

          {/* Additional Letter Templates */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </span>
              Additional Letter Templates
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Infrastructure &amp; Road Safety</h3>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                  <p>Dear Representative [Name],</p>
                  <p>
                    My name is [Your Name], and I live at [Address] in [City, State ZIP]. I&apos;m writing to urge you to support HR 5678, the Safe Streets and Roads Act, which would direct federal funding to fix dangerous intersections in communities like ours.
                  </p>
                  <p>
                    I commute through the intersection of Oak Avenue and Route 9 every day. In the past two years, there have been 14 accidents at this intersection, including one that killed a 16-year-old pedestrian last September. The intersection has no left-turn signal, no crosswalk markings, and poor sight lines due to overgrown vegetation on the median. I&apos;ve witnessed three near-misses myself, including one where I had to swerve onto the shoulder to avoid a head-on collision.
                  </p>
                  <p>
                    Our county has applied for state funding to redesign this intersection three times and been denied each time due to limited resources. HR 5678 would create a federal grant program specifically for high-crash intersections like this one, giving local governments the resources they need to protect their residents.
                  </p>
                  <p>
                    Please co-sponsor HR 5678 and help ensure that no more families in our district lose someone to a preventable traffic death.
                  </p>
                  <p>
                    Thank you for your time and your service to our community.
                  </p>
                  <p>
                    Sincerely,<br />
                    [Your Name]<br />
                    [Address]<br />
                    [Email/Phone]
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Education Funding</h3>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                  <p>Dear Senator [Name],</p>
                  <p>
                    My name is [Your Name], and I&apos;m a parent of two children at Lincoln Elementary in [City, State ZIP]. I&apos;m writing to ask you to vote YES on S. 2345, the Strengthening Public Schools Act.
                  </p>
                  <p>
                    This year, due to budget cuts, Lincoln Elementary eliminated its art program, reduced the school librarian to two days per week, and increased class sizes to 32 students per room. My son&apos;s third-grade class now has one teacher and no aide for 32 eight-year-olds. My daughter, who struggles with reading, lost access to the after-school literacy tutoring program that was helping her catch up to grade level.
                  </p>
                  <p>
                    These aren&apos;t extras -they&apos;re the foundations of a real education. Our district has cut $4.2 million from its budget over the past three years while enrollment has grown by 800 students. Teachers are burning out, families who can afford it are leaving for private schools, and the children who remain are getting less every year.
                  </p>
                  <p>
                    S. 2345 would increase Title I funding by 20% and create a new grant program for schools experiencing budget shortfalls. This would directly help schools like Lincoln Elementary restore the programs our kids need.
                  </p>
                  <p>
                    I respectfully ask that you vote in favor of S. 2345 when it comes to the floor. Our children&apos;s futures depend on it.
                  </p>
                  <p>
                    Thank you for your consideration.
                  </p>
                  <p>
                    Sincerely,<br />
                    [Your Name]<br />
                    [Address]<br />
                    [Email/Phone]
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Good vs Weak: Side-by-Side Comparisons */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </span>
              Good vs Weak: Side-by-Side Comparisons
            </h2>
            <div className="pl-10 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                The difference between a message that gets flagged for attention and one that gets a form reply often comes down to how each element is written. Here&apos;s what strong vs weak looks like for every part of your letter.
              </p>

              {/* 1. Identify Yourself */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Identify Yourself as a Constituent</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p>
                    <span className="text-green-600 dark:text-green-400">Good:</span> &quot;My name is Maria Lopez, and I live at 412 Elm Street in Springfield, IL 62704. I&apos;ve been a resident of your district for 15 years.&quot;
                  </p>
                  <p>
                    <span className="text-red-600 dark:text-red-400">Weak:</span> &quot;I&apos;m a concerned citizen who cares about this country.&quot;
                  </p>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Without a name and address, staff may not log your message at all. Generic identifiers like &quot;concerned citizen&quot; suggest you might not even be a constituent.
                </p>
              </div>

              {/* 2. State Your Purpose */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. State Your Purpose Immediately</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p>
                    <span className="text-green-600 dark:text-green-400">Good:</span> &quot;I&apos;m writing to urge you to co-sponsor S. 2345, the Strengthening Public Schools Act, which would increase Title I funding for under-resourced districts.&quot;
                  </p>
                  <p>
                    <span className="text-red-600 dark:text-red-400">Weak:</span> &quot;I wanted to reach out because there are a lot of problems with education in this country and I think something needs to be done about it.&quot;
                  </p>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Staff categorize mail by topic and position. A clear, specific opener ensures your letter is logged correctly and routed to the right legislative assistant.
                </p>
              </div>

              {/* 3. Explain Why It Matters */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Explain Why It Matters to You</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p>
                    <span className="text-green-600 dark:text-green-400">Good:</span> &quot;My daughter&apos;s school eliminated its reading tutoring program this year due to budget cuts. She was making real progress -her reading level improved two grades in six months -and now that support is gone. She cries before school because she feels like she&apos;s falling behind again.&quot;
                  </p>
                  <p>
                    <span className="text-red-600 dark:text-red-400">Weak:</span> &quot;Education is important for the future of America and we need to invest more in our schools.&quot;
                  </p>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Personal stories are what make letters memorable. Staff have told us they share powerful constituent stories directly with the legislator. Generic talking points blend in with form mail.
                </p>
              </div>

              {/* 4. Make a Specific Ask */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. Make a Specific Ask</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p>
                    <span className="text-green-600 dark:text-green-400">Good:</span> &quot;Please vote YES on S. 2345 when it comes to the Senate floor and urge the Appropriations Committee to fully fund the Title I increase in the next budget cycle.&quot;
                  </p>
                  <p>
                    <span className="text-red-600 dark:text-red-400">Weak:</span> &quot;I hope you&apos;ll do the right thing and support our schools.&quot;
                  </p>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Vague asks get vague responses. When you name a specific bill and a specific action (vote, co-sponsor, sign a letter), staff can give the legislator a clear constituent position to consider.
                </p>
              </div>

              {/* 5. Close Professionally */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">5. Close Professionally</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p>
                    <span className="text-green-600 dark:text-green-400">Good:</span> &quot;Thank you for your time and service to our district. I would appreciate a response sharing your position on this bill. I can be reached at maria.lopez@email.com or (217) 555-0142.&quot;
                  </p>
                  <p>
                    <span className="text-red-600 dark:text-red-400">Weak:</span> &quot;If you don&apos;t support this, I&apos;ll make sure everyone knows you don&apos;t care about kids. You&apos;ll be hearing from us at the ballot box.&quot;
                  </p>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  A courteous close with contact information invites a dialogue. Threats and ultimatums put staff on the defensive and guarantee your letter won&apos;t be shared with the legislator in a positive light.
                </p>
              </div>
            </div>
          </section>

          {/* Formatting Tips */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              Formatting Tips
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Ideal Length: 200 &ndash; 400 Words</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Congressional staff process hundreds of messages per day. A letter between 200 and 400 words is long enough to include your personal story and a specific ask, but short enough that a staffer can read and categorize it in under two minutes. If your letter runs longer than one printed page, cut it. The insulin letter example above is about 150 words -even shorter is fine when the message is clear.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Use Paragraphs, Not Walls of Text</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Break your letter into short, focused paragraphs -one idea per paragraph. A staffer scanning a dense block of text is more likely to miscategorize it or skim past your key point. White space makes your message easier to read on screens of all sizes, especially since most congressional contact forms display submissions in plain text.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Subject Line Best Practices for Email</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  If you&apos;re sending email or using a web contact form with a subject field, your subject line determines how quickly your message is routed to the right staffer. Keep it specific and concise.
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm space-y-2">
                  <p>
                    <span className="text-green-600 dark:text-green-400">Good:</span> &quot;Support S. 2345 -Increase Title I Education Funding&quot;
                  </p>
                  <p>
                    <span className="text-green-600 dark:text-green-400">Good:</span> &quot;Constituent Request: Vote YES on HR 5678 (Safe Streets Act)&quot;
                  </p>
                  <p>
                    <span className="text-red-600 dark:text-red-400">Weak:</span> &quot;Please read this&quot;
                  </p>
                  <p>
                    <span className="text-red-600 dark:text-red-400">Weak:</span> &quot;I have concerns&quot;
                  </p>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Including the bill number in your subject line helps staff route your message immediately to the legislative assistant covering that issue.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Address Different Officials</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Using the correct form of address signals that you take the communication seriously. Here are the standard conventions:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 text-sm">
                  <li><strong className="text-gray-900 dark:text-white">U.S. Senator</strong> -Address as &quot;The Honorable [Full Name]&quot; in the heading; use &quot;Dear Senator [Last Name],&quot; in the salutation</li>
                  <li><strong className="text-gray-900 dark:text-white">U.S. Representative</strong> -Address as &quot;The Honorable [Full Name]&quot; in the heading; use &quot;Dear Representative [Last Name],&quot; in the salutation</li>
                  <li><strong className="text-gray-900 dark:text-white">Committee Chair</strong> -Use &quot;Dear Chairman [Last Name],&quot; or &quot;Dear Chairwoman [Last Name],&quot;</li>
                  <li><strong className="text-gray-900 dark:text-white">Speaker of the House</strong> -Use &quot;Dear Mr. Speaker,&quot; or &quot;Dear Madam Speaker,&quot;</li>
                </ul>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  When using a congressional web contact form, the salutation is often pre-filled. In that case, focus on the body of your message.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Include Bill Numbers When Possible</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Referencing a specific bill number (e.g., HR 1234 or S. 5678) in both your subject line and opening sentence makes your letter dramatically easier for staff to process. Offices track constituent sentiment by bill -if your letter doesn&apos;t mention the bill number, a staffer has to figure out which legislation you&apos;re referring to, and they might guess wrong. You can find bill numbers by searching on <Link href="https://www.congress.gov" className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">congress.gov</Link> or by checking advocacy organization websites that are promoting the legislation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">When to Follow Up</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Congressional offices are required to respond to constituent mail, but it can take 4 to 8 weeks. Here&apos;s when and how to follow up:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 text-sm">
                  <li><strong className="text-gray-900 dark:text-white">Before a vote</strong> -If a key vote is approaching, send a shorter follow-up reminding them of your position. Reference your original letter by date.</li>
                  <li><strong className="text-gray-900 dark:text-white">After 6 weeks with no response</strong> -Call the district office and politely ask about the status of your correspondence. Have your original send date ready.</li>
                  <li><strong className="text-gray-900 dark:text-white">After a vote</strong> -Send a brief thank-you if they voted your way, or a respectful note of disappointment if they didn&apos;t. This keeps you on their radar as an engaged constituent.</li>
                  <li><strong className="text-gray-900 dark:text-white">When new developments occur</strong> -If a bill is amended, a related event happens in your community, or you have new information, write again and reference your earlier letter.</li>
                </ul>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Consistent, polite follow-up is one of the most effective advocacy strategies. Offices track repeat contacts, and constituents who write multiple times are taken more seriously.
                </p>
              </div>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Tell Your Story: Make Your Message Stand Out
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your Congressman
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
            Ready to write your message?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            My Democracy helps you craft a personalized message with AI assistance. You control the final words.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Write Your Message
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
