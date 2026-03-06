import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Register to Vote | Complete 2026 Guide | My Democracy',
  description: 'Step-by-step guide to voter registration in every US state. Learn about online registration, deadlines, ID requirements, and same-day registration options.',
  keywords: ['register to vote', 'voter registration', 'how to register to vote', 'voting registration deadline', 'same day voter registration', 'online voter registration'],
  openGraph: {
    title: 'How to Register to Vote | Complete 2026 Guide | My Democracy',
    description: 'Step-by-step guide to voter registration in every US state. Learn about online registration, deadlines, and ID requirements.',
    type: 'article',
  },
};

export default function RegisterToVotePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How to Register to Vote', href: '/guides/how-to-register-to-vote' }]} />
      <FaqJsonLd items={[
        { question: 'Can I register to vote if I\'m homeless?', answer: 'Yes. Every state allows homeless individuals to register. You can use a shelter address, a street corner description, or a general delivery address at a post office.' },
        { question: 'Can I register to vote if I have a felony conviction?', answer: 'It depends on your state. Most states restore voting rights after completing your sentence. Maine, Vermont, and DC allow voting from prison. Check your state\'s specific rules at the ACLU.' },
        { question: 'I\'m a college student - where should I register to vote?', answer: 'You can register at either your home address or your college address, but only one. Consider which races are more competitive or meaningful to you.' },
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
          How to Register to Vote
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Voter registration is the first step to making your voice heard. Most states make it easy to register online, but rules vary. Here&apos;s everything you need to know.
          </p>

          {/* Quick Check */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Am I Already Registered?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Before registering, check your current status. You may already be registered from a previous election. Visit <a href="https://www.vote.org/am-i-registered-to-vote/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Vote.org&apos;s registration checker</a> to verify.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">You need to re-register if:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>You moved to a new address</li>
                <li>You changed your name</li>
                <li>You want to change your party affiliation</li>
                <li>You haven&apos;t voted in several elections and may have been purged from rolls</li>
              </ul>
            </div>
          </section>

          {/* Registration Methods */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              How to Register
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Online Registration (Fastest)</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  41 states plus DC offer online voter registration. You&apos;ll need your state ID or driver&apos;s license number. The process takes about 2 minutes.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Start at <a href="https://www.vote.org/register-to-vote/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Vote.org</a>, which will redirect you to your state&apos;s official registration page.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. By Mail</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Download and print the <a href="https://www.eac.gov/voters/national-mail-voter-registration-form" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">National Voter Registration Form</a> from the EAC. Fill it out, sign it, and mail it to your state election office. Allow 2-4 weeks for processing.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. In Person</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Visit your county election office, DMV, or other designated voter registration agency. Bring a photo ID and proof of residency (utility bill, bank statement, etc.).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. Automatic Registration</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  23 states plus DC have automatic voter registration. You&apos;re registered when you interact with a government agency (usually the DMV) unless you opt out. Check if your state participates.
                </p>
              </div>
            </div>
          </section>

          {/* What You'll Need */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </span>
              What You&apos;ll Need
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">State-issued ID</strong>: Driver&apos;s license or state ID number (for online registration)</li>
                <li><strong className="text-gray-900 dark:text-white">Last 4 of SSN</strong>: Required if you don&apos;t have a state ID</li>
                <li><strong className="text-gray-900 dark:text-white">Current address</strong>: Must match your residential address</li>
                <li><strong className="text-gray-900 dark:text-white">Date of birth</strong>: You must be 18 by Election Day (some states allow 17-year-olds to register)</li>
                <li><strong className="text-gray-900 dark:text-white">US citizenship</strong>: You must be a US citizen to vote in federal elections</li>
              </ul>
            </div>
          </section>

          {/* Deadlines */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Registration Deadlines
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>Deadlines vary by state, typically 15-30 days before an election. Key facts:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Same-day registration</strong>: 21 states plus DC allow you to register and vote on the same day. Bring proof of residency.</li>
                <li><strong className="text-gray-900 dark:text-white">North Dakota</strong>: No registration required at all. Just show up with valid ID.</li>
                <li><strong className="text-gray-900 dark:text-white">Online deadlines</strong>: Usually earlier than mail or in-person deadlines.</li>
              </ul>
              <p>
                Find your exact deadline at <a href="https://www.vote.org/voter-registration-deadlines/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Vote.org</a> or check your <Link href="/states" className="text-purple-600 dark:text-purple-400 hover:underline">state info page</Link>.
              </p>
            </div>
          </section>

          {/* After Registering */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              After You Register
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Verify your registration</strong>: Check back in 2-4 weeks to confirm it was processed.</li>
                <li><strong className="text-gray-900 dark:text-white">Know your polling place</strong>: Find it before Election Day at <a href="https://www.vote.org/polling-place-locator/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Vote.org</a>.</li>
                <li><strong className="text-gray-900 dark:text-white">Understand voter ID laws</strong>: 36 states require some form of ID at the polls. Know what your state requires.</li>
                <li><strong className="text-gray-900 dark:text-white">Consider early voting</strong>: 46 states offer early voting or no-excuse mail ballots. Avoid Election Day lines.</li>
              </ul>
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
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I register if I&apos;m homeless?</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Yes. Every state allows homeless individuals to register. You can use a shelter address, a street corner description, or a general delivery address at a post office.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Can I register if I have a felony conviction?</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  It depends on your state. Most states restore voting rights after completing your sentence. Maine, Vermont, and DC allow voting from prison. Check your state&apos;s specific rules at the <a href="https://www.aclu.org/issues/voting-rights/voter-restoration" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">ACLU</a>.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">I&apos;m a college student - where should I register?</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  You can register at either your home address or your college address, but only one. Consider which races are more competitive or meaningful to you.
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
                  How to Contact Your Elected Officials
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Get Involved in Local Politics
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-attend-a-town-hall" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Attend a Town Hall
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Registered? Now make your voice heard.
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Contact your officials about the issues that matter to you.
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

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guides" className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
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
