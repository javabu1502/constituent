import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Run a Campaign | My Democracy',
  description:
    'Mobilize your community: run an advocacy campaign that turns supporters into constituent messages, or a storytelling campaign that collects consented personal stories — with white-label branding for organizations.',
  alternates: {
    canonical: 'https://www.mydemocracy.app/campaigns',
  },
  openGraph: {
    title: 'Run a Campaign | My Democracy',
    description:
      'Mobilize your community: advocacy campaigns that turn supporters into constituent messages, and storytelling campaigns that collect consented personal stories.',
  },
};

export default function CampaignsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Run a Campaign</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
          Campaigns are for organizers — advocacy groups, community leaders, and anyone rallying people
          around a cause. Turn your supporters into constituent voices, or collect the stories that move
          decision-makers.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Just want to weigh in on national issues yourself?{' '}
          <Link href="/issues" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
            Head to Weigh In &rarr;
          </Link>
        </p>
      </div>

      {/* The two campaign types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Advocacy Campaign</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
            Mobilize supporters into action. Each participant states their own position, gets a unique
            AI-drafted message to their own representatives, and sends it in minutes. You see live
            analytics: actions, momentum, which officials heard from constituents, and where your
            supporters are.
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-5">
            <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">✓</span> Every message unique — no form letters</li>
            <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">✓</span> Officials-contacted and momentum analytics</li>
            <li className="flex items-start gap-2"><span className="text-purple-500 mt-0.5">✓</span> Public, or private and shared by link</li>
          </ul>
          <Link
            href="/campaign/create?type=advocacy"
            className="block text-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Start an Advocacy Campaign
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col">
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Storytelling Campaign</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
            Collect the personal stories that move decision-makers and the press. A guided,
            trauma-informed interview helps people tell their story in their own words; each storyteller
            controls their attribution and exactly how their story may be used.
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-5">
            <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> Consent-first: storytellers choose attribution and permitted uses</li>
            <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> Search stories by city, state, or elected official; CSV export</li>
            <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> Always private — shared by link only</li>
          </ul>
          <Link
            href="/campaign/create?type=storytelling"
            className="block text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Start a Storytelling Campaign
          </Link>
        </div>
      </div>

      {/* White label */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-white mb-10">
        <h2 className="text-lg font-semibold mb-2">Your brand, your domain</h2>
        <p className="text-sm text-purple-100 max-w-2xl">
          Private campaigns can carry your organization&rsquo;s identity: your logo, your colors, your
          website — and even your own domain, so supporters take action at{' '}
          <span className="font-semibold text-white">action.yourorg.org</span> without ever leaving your
          brand. Set it up when you create a private campaign.
        </p>
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link href="/dashboard#campaigns" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
          Manage my campaigns &rarr;
        </Link>
        <Link href="/guides/how-to-run-a-successful-campaign" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
          Guide: running a successful campaign &rarr;
        </Link>
      </div>
    </div>
  );
}
