import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How AI Tailors Your Message | My Democracy',
  description: 'How My Democracy uses AI to write personalized messages to your legislators. What data we use, what we don\'t, and where we\'re headed.',
};

export default function AITailoringPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-10">
          How AI Tailors Your Message
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          {/* What We Use Today */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What We Use Today
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                When you write to a legislator, the AI considers a few pieces of
                public information about them to make your message more relevant:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-gray-900 dark:text-white">Name, party, state, and chamber</strong> &mdash;
                  so the message is addressed correctly and uses appropriate framing
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Committee assignments</strong> &mdash;
                  if the legislator sits on a committee relevant to your issue, the AI can reference it
                </li>
              </ul>
              <p>
                This data comes from the public{' '}
                <a href="https://github.com/unitedstates/congress-legislators" className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  congress-legislators
                </a>{' '}
                repository on GitHub, maintained by the civic data community.
              </p>
            </div>
          </section>

          {/* How We Use It */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              How We Use It
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                The AI uses the legislator&apos;s party and committee assignments to adjust the
                tone and framing of your message. For example:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Referencing a relevant committee the legislator serves on
                </li>
                <li>
                  Adjusting whether the message thanks them for past support or
                  respectfully asks them to reconsider their position
                </li>
              </ul>
              <p>
                The goal is a message that feels like you wrote it &mdash; not a
                generic form letter.
              </p>
            </div>
          </section>

          {/* What We Don't Do */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </span>
              What We Don&apos;t Do
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We don&apos;t track individual legislators&apos; voting records</li>
                <li>We don&apos;t make assumptions about their personal positions beyond party affiliation</li>
                <li>We don&apos;t use any private or non-public data</li>
              </ul>
              <p className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-blue-800 dark:text-blue-300">
                <strong>You always review and can edit the message before sending.</strong> The
                AI drafts it, you own it.
              </p>
            </div>
          </section>

          {/* Where We're Headed */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
              Where We&apos;re Headed
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                We&apos;re working to make AI-generated messages even more relevant and
                effective. Here&apos;s what&apos;s on our roadmap:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-gray-900 dark:text-white">Voting history</strong> &mdash;
                  incorporating how legislators voted on related bills so the AI can reference specific past votes
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Sponsored legislation</strong> &mdash;
                  tracking which bills a legislator has sponsored or cosponsored to understand their policy priorities
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Active legislation</strong> &mdash;
                  using the official Congress.gov API to surface bills related to your issue, so your message can reference specific bill numbers
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Trending issues</strong> &mdash;
                  showing what topics other constituents in your district are writing about
                </li>
              </ul>
              <p className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 text-purple-800 dark:text-purple-300">
                All data we use will always come from public, official government sources.
                We&apos;ll update this page as we add new features.
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
