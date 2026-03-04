import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Testify at a Public Hearing | My Democracy',
  description: 'Learn how to prepare and deliver testimony at city council, school board, state legislature, and congressional hearings. Tips for written and oral testimony.',
  keywords: ['public hearing testimony', 'how to testify', 'city council testimony', 'public comment', 'legislative hearing', 'school board meeting', 'how to speak at public hearing'],
  openGraph: {
    title: 'How to Testify at a Public Hearing | My Democracy',
    description: 'A practical guide to preparing and delivering testimony at public hearings.',
    type: 'article',
  },
};

export default function TestifyPublicHearingGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How to Testify at a Public Hearing', href: '/guides/how-to-testify-at-a-public-hearing' }]} />
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
          How to Testify at a Public Hearing
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Public hearings give ordinary citizens a direct voice in government decisions. Whether it&apos;s a city council meeting, a school board session, a state legislative hearing, or a congressional committee, your testimony becomes part of the official record. Here&apos;s how to prepare and deliver effective testimony.
          </p>

          {/* Types of Hearings */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Types of Public Hearings
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">City Council and County Board Meetings</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Most city councils and county boards have a &quot;public comment&quot; period at regular meetings where anyone can speak on any topic, typically for 2-3 minutes. Some also hold special hearings on specific items like zoning changes, budgets, or ordinances.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">School Board Meetings</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  School boards hold regular public meetings and often welcome public comment on agenda items. Some require you to sign up in advance; others allow walk-in speakers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">State Legislative Hearings</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  State legislative committees hold public hearings on bills, often accepting both written and oral testimony. Procedures vary by state — some require advance registration, while others accept walk-in testimony. Check your <Link href="/states" className="text-purple-600 dark:text-purple-400 hover:underline">state&apos;s legislative website</Link> for details.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Congressional Committee Hearings</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Congressional hearings typically invite specific witnesses, but some accept written testimony from the public. When Congress holds field hearings in your area, there may be opportunities for public comment. Check <a href="https://www.congress.gov/committees" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a> for committee schedules.
                </p>
              </div>
            </div>
          </section>

          {/* How to Sign Up */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              How to Sign Up to Testify
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Check the agenda</strong>: Government bodies publish meeting agendas in advance. Find the agenda on the body&apos;s official website.</li>
                <li><strong className="text-gray-900 dark:text-white">Register if required</strong>: Some bodies require advance sign-up — by email, phone, or online form. Many state legislatures have online systems where you can register your position on a bill and request to testify.</li>
                <li><strong className="text-gray-900 dark:text-white">Arrive early</strong>: If walk-in sign-up is available, show up early. Sign-up sheets often fill up, and speakers are taken in order.</li>
                <li><strong className="text-gray-900 dark:text-white">Submit written testimony</strong>: Even if you can&apos;t attend, many bodies accept written comments by email or through a public comment portal. This is especially common for state legislative committees and federal regulatory agencies.</li>
              </ul>
            </div>
          </section>

          {/* Preparing Your Testimony */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Preparing Your Testimony
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Know your time limit</strong>: Most public comment periods give speakers 2-3 minutes. Write your testimony to fit and practice with a timer.</li>
                <li><strong className="text-gray-900 dark:text-white">State your position clearly</strong>: Open with your name, where you live, and whether you support or oppose the item. Decision-makers track the count of speakers for and against.</li>
                <li><strong className="text-gray-900 dark:text-white">Tell your story</strong>: Personal experience is more persuasive than abstract arguments. Explain how the issue affects you, your family, or your community. See our <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">storytelling guide</Link>.</li>
                <li><strong className="text-gray-900 dark:text-white">Stick to the facts</strong>: Reference specific data, laws, or real-world impacts. Avoid making claims you can&apos;t support.</li>
                <li><strong className="text-gray-900 dark:text-white">Make a specific ask</strong>: End with a clear request: &quot;I urge you to vote yes on this ordinance&quot; or &quot;Please amend the bill to include X.&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">Bring written copies</strong>: Provide printed copies of your testimony to the clerk or committee staff so it enters the official record.</li>
              </ul>
            </div>
          </section>

          {/* Delivering Your Testimony */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </span>
              Delivering Your Testimony
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Speak slowly and clearly</strong>: You may be nervous, and that&apos;s normal. Take a breath before you start. Speak at a measured pace.</li>
                <li><strong className="text-gray-900 dark:text-white">Address the decision-makers</strong>: Look at the board, council, or committee members, not the audience. Use appropriate titles (e.g., &quot;Chair Smith,&quot; &quot;Members of the committee&quot;).</li>
                <li><strong className="text-gray-900 dark:text-white">Stay within your time</strong>: When the timer signals, wrap up your final point. Going over time may cause the chair to cut you off and reduces goodwill.</li>
                <li><strong className="text-gray-900 dark:text-white">Stay calm and respectful</strong>: Even if you feel strongly, a measured tone is more effective. Personal attacks or shouting can undermine your message and may result in removal.</li>
                <li><strong className="text-gray-900 dark:text-white">Don&apos;t repeat others</strong>: If someone before you made the same point, say &quot;I agree with the previous speaker&apos;s point about X&quot; and use your time for new arguments.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">Tell Your Story</Link></li>
              <li><Link href="/guides/how-to-organize-your-neighbors" className="text-purple-600 dark:text-purple-400 hover:underline">How to Organize Your Neighbors</Link></li>
              <li><Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">How to Get Involved in Local Politics</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Want to practice first?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Start by writing to your representatives. It&apos;s a great way to clarify your thinking before testifying.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Contact Your Reps
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
