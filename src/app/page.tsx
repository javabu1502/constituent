import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { HomeTrends } from '@/components/trends/HomeTrends';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-purple-50 via-purple-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Your voice matters.
            <br />
            <span className="text-purple-600 dark:text-purple-400">Make it heard.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your all-in-one civic engagement hub. Know your representatives,
            track legislation, and take action.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="text-lg px-8 py-4">
                Contact Your Reps
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                Explore Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Issues */}
      <HomeTrends />

      {/* Your Complete Civic Dashboard */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            Your Complete Civic Dashboard
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Everything you need to stay informed about your representatives
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Voting Records */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Voting Records
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                See how your representatives vote on the issues that matter to you.
              </p>
            </div>

            {/* Campaign Finance */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Campaign Finance
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Follow the money — see who funds your representatives&apos; campaigns.
              </p>
            </div>

            {/* Lobbying Activity */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Lobbying Activity
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                See which organizations are lobbying your representatives and on what issues.
              </p>
            </div>

            {/* Bill Tracking */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Bill Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Track legislation with AI-powered summaries so you always know what&apos;s at stake.
              </p>
            </div>

            {/* News Feed */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                News Feed
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Stay up to date with the latest news about each of your representatives.
              </p>
            </div>

            {/* Committee & Bio Profiles */}
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Committee &amp; Bio Profiles
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                AI-generated bios and committee assignments for every representative.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Start a Campaign CTA */}
      <section className="py-16 sm:py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Rally Others Around Your Issue
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto leading-relaxed">
            Create a shareable campaign page and let anyone contact their representatives
            about the issue you care about — with AI-personalized messages for each participant.
          </p>
          <Link href="/campaign/create">
            <Button size="lg" className="text-lg px-8 py-4">
              Start a Campaign
            </Button>
          </Link>
        </div>
      </section>

      {/* Learn & Take Action */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            Learn &amp; Take Action
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Guides to help you make the most of your civic engagement
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <Link href="/guides/write-effective-letter-to-congress" className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Write an Effective Letter
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Tips for writing messages that get noticed by your representatives.
              </p>
            </Link>

            <Link href="/guides/how-a-bill-becomes-law" className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                How a Bill Becomes Law
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Understand the legislative process from introduction to signing.
              </p>
            </Link>

            <Link href="/guides/tell-your-story" className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Tell Your Story
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Personal stories are what move legislators to act.
              </p>
            </Link>

            <Link href="/guides/how-to-run-a-successful-campaign" className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Run a Successful Campaign
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Rally others around your issue with a shareable campaign.
              </p>
            </Link>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/guides"
              className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
            >
              View All Guides
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-16 sm:py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Your Privacy, Protected
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            Your data is stored securely and never sold. Without an account,
            your address is used for lookup only. With an account, your
            information powers your personalized dashboard. You can delete
            your data anytime.
          </p>
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            Learn more about how we protect your data
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-purple-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to be heard?
          </h2>
          <p className="text-purple-100 mb-8 text-lg">
            Your representatives work for you. Let them know what matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-purple-600 hover:bg-purple-50 border-white text-lg px-8"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="secondary"
                size="lg"
                className="bg-transparent text-white hover:bg-purple-700 border-white text-lg px-8 border"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
