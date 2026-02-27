import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | My Democracy',
  description: 'How My Democracy handles your data. What we store when you send a message, how we use it, and how to request deletion. We never sell your data.',
};

export default function PrivacyPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">
          Last updated: February 2026
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          {/* How We Find Your Representatives */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              How We Find Your Representatives
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                <strong className="text-gray-900 dark:text-white">You enter your address.</strong> This
                is the only way we can figure out which congressional district and state
                legislative districts you live in.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">We send it to the US Census Bureau.</strong> Their
                free geocoding API determines your districts. This is the same data the
                government uses.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">We match districts to legislators.</strong> Using
                public data from the{' '}
                <a href="https://github.com/unitedstates/congress-legislators" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  congress-legislators
                </a>{' '}
                project and{' '}
                <a href="https://openstates.org" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Open States
                </a>, we find your federal and state representatives.
              </p>
              <p className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-blue-800 dark:text-blue-300">
                <strong>Without an account:</strong> your address is used for lookup only
                and then discarded. <strong>With an account:</strong> your address is stored
                securely in your profile so you can access your dashboard and matched
                representatives. You can update or delete it anytime.
              </p>
            </div>
          </section>

          {/* What the AI Sees */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              What the AI Sees
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>When we generate your personalized email or phone script, representative bios, or bill summaries, the AI receives:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-gray-900 dark:text-white">Your name</strong> — so it can personalize the message</li>
                <li><strong className="text-gray-900 dark:text-white">Your city and state</strong> — so it can say &quot;as your constituent from Reno, Nevada&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">The issue you care about</strong> — what you wrote in your own words</li>
                <li><strong className="text-gray-900 dark:text-white">Your representative&apos;s info</strong> — name, party, position, so it can tailor the message</li>
              </ul>
              <p className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-blue-800 dark:text-blue-300">
                <strong>The AI does NOT see your full street address</strong> or any
                other personal information beyond what&apos;s needed to write the message.
              </p>
            </div>
          </section>

          {/* What We Store When You Send a Message */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </span>
              What We Store When You Send a Message
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                When you use My Democracy to contact your elected officials, we store:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your <strong className="text-gray-900 dark:text-white">name</strong> and <strong className="text-gray-900 dark:text-white">email</strong> (if provided)</li>
                <li>Your <strong className="text-gray-900 dark:text-white">city, state, and legislative district</strong></li>
                <li>The <strong className="text-gray-900 dark:text-white">name, party, and chamber</strong> of the legislator(s) you contacted</li>
                <li>The <strong className="text-gray-900 dark:text-white">issue area</strong> you selected</li>
                <li>The <strong className="text-gray-900 dark:text-white">full text</strong> of the message sent on your behalf</li>
                <li>The <strong className="text-gray-900 dark:text-white">date and time</strong></li>
                <li>The <strong className="text-gray-900 dark:text-white">delivery method and status</strong></li>
              </ul>
              <p>
                We store this so you can view your message history when you create an account.
              </p>
              <p className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 text-green-800 dark:text-green-300">
                <strong>We never share, sell, or provide your messages or personal information to any third party</strong> — including legislators, political organizations, or advertisers.
              </p>
            </div>
          </section>

          {/* What We Store When You Create an Account */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              What We Store When You Create an Account
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                When you create an account, we store the following to power your personalized dashboard:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your <strong className="text-gray-900 dark:text-white">name</strong> and <strong className="text-gray-900 dark:text-white">email address</strong></li>
                <li>Your <strong className="text-gray-900 dark:text-white">street address, city, state, and ZIP code</strong></li>
                <li>Your <strong className="text-gray-900 dark:text-white">matched representatives</strong> — federal, state, and local officials</li>
                <li><strong className="text-gray-900 dark:text-white">Dashboard data</strong> — cached voting records, campaign finance, lobbying activity, committee assignments, and bill tracking preferences</li>
              </ul>
              <p>
                You can update or delete your account data at any time from your profile settings.
              </p>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              How We Use Your Data
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <ul className="space-y-3">
                <li>
                  <strong className="text-gray-900 dark:text-white">To deliver your message:</strong> your name, city, state, and message are included in correspondence sent to your elected officials, as you direct.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">To show your message history:</strong> if you create an account, you can view every message you&apos;ve sent.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">To track issue trends:</strong> we use anonymized, aggregated data (such as how many messages were sent about &quot;Health&quot; or &quot;Education&quot;) to show what issues constituents care about — this data is never tied to your identity.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">To improve the platform:</strong> we may review anonymized message patterns to improve AI message generation.
                </li>
              </ul>
              <p className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-blue-800 dark:text-blue-300">
                <strong>We do NOT use your data for advertising, marketing, or profiling.</strong>
              </p>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </span>
              Third-Party Services
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 pl-10">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">US Census Bureau API</p>
                <p className="text-sm">Address lookup and district matching. A free US government service.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">Anthropic Claude API</p>
                <p className="text-sm">
                  Our AI provider for message generation, representative bios, and bill summaries. Per their{' '}
                  <a href="https://www.anthropic.com/policies/privacy" className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
                    API terms
                  </a>, data sent through the API is not stored or used for training.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">Supabase</p>
                <p className="text-sm">Database and authentication provider. Stores account data, messages, and dashboard data with encryption at rest and in transit.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">Open States</p>
                <p className="text-sm">Open source civic data for state legislator information.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">Congress.gov API</p>
                <p className="text-sm">Official congressional data for bill tracking, voting records, and committee information.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">FEC API</p>
                <p className="text-sm">Federal Election Commission data for campaign finance information.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">Senate LDA Reports</p>
                <p className="text-sm">Lobbying Disclosure Act data for lobbying activity disclosures.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">LegiScan</p>
                <p className="text-sm">State and federal legislation tracking data.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">Google News RSS</p>
                <p className="text-sm">Public news feeds for per-representative news aggregation.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">Google Civic Information API</p>
                <p className="text-sm">Local official and election information lookup.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">Vercel</p>
                <p className="text-sm">Website hosting. Standard web server logs only.</p>
              </div>
            </div>
          </section>

          {/* Our Commitment */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Our Commitment
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                We have added user accounts, personalized dashboards, and expanded
                civic data features. This policy reflects those additions and will
                continue to be updated as the platform evolves.
              </p>
              <p className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 text-purple-800 dark:text-purple-300 font-semibold">
                We will never sell your data. Ever.
              </p>
            </div>
          </section>

          {/* How AI Tailors Your Message */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              How AI Tailors Your Message
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                My Democracy uses AI (powered by Anthropic&apos;s Claude) to draft personalized messages.
                The AI uses the legislator&apos;s name, party, state, chamber, and committee assignments
                (from the public{' '}
                <a href="https://github.com/unitedstates/congress-legislators" className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  congress-legislators
                </a>{' '}
                GitHub repository), plus the issue area and details you provide.
              </p>
              <p>
                For <strong className="text-gray-900 dark:text-white">representative bios</strong>, the AI uses publicly available data (name, party, state, committees, legislative history) to generate biographical narratives. For <strong className="text-gray-900 dark:text-white">bill summaries</strong>, the AI summarizes publicly available bill text. No personal user data is used for bios or summaries.
              </p>
              <p>
                You always review and can edit messages before sending.
              </p>
              <p>
                <Link href="/about/ai-tailoring" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
                  Learn more about how AI tailors your message &rarr;
                </Link>
              </p>
            </div>
          </section>

          {/* Data Retention & Deletion */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </span>
              Data Retention &amp; Deletion
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                <strong className="text-gray-900 dark:text-white">Account data</strong> (profile, address, matched representatives, dashboard preferences) is retained as long as your account is active.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Message history</strong> is retained so you can view it in your dashboard.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Cached representative data</strong> (voting records, campaign finance, lobbying, committees) is refreshed periodically from public sources and is not personal data.
              </p>
              <p>
                You may request deletion of all your personal data at any time by emailing{' '}
                <a href="mailto:info@mydemocracy.app" className="text-purple-600 dark:text-purple-400 hover:underline">
                  info@mydemocracy.app
                </a>.
                We will delete your account and all associated personal information within 30 days of your request.
              </p>
            </div>
          </section>

          {/* Security */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Security
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                Your data is stored securely using{' '}
                <a href="https://supabase.com" className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  Supabase
                </a>, a trusted cloud database provider with encryption at rest and in transit.
                Access to your data is restricted to essential platform operations only.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Contact
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                Questions about this policy? Concerns about your privacy?
              </p>
              <p>
                Email us at{' '}
                <a href="mailto:info@mydemocracy.app" className="text-purple-600 dark:text-purple-400 hover:underline">
                  info@mydemocracy.app
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
