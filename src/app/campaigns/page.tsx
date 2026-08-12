import type { Metadata } from 'next';
import Link from 'next/link';
import { OrgAccessForm } from '@/components/campaign/OrgAccessForm';

export const metadata: Metadata = {
  title: 'Advocacy Platform | My Democracy',
  description:
    'Run your whole legislative campaign in one place: authentic constituent messages, stage-by-stage bill tracking, whip counts, story collection, and funder-ready impact reports. Now onboarding pilot organizations.',
  alternates: { canonical: 'https://www.mydemocracy.app/campaigns' },
  openGraph: {
    title: 'Advocacy Platform | My Democracy',
    description:
      'Authentic constituent voice, legislative intelligence, and impact reporting in one platform. Now onboarding pilot organizations.',
  },
};

const PILLARS = [
  {
    title: 'Take Action',
    lead: 'Campaigns that follow the bill.',
    points: [
      'Stages for each step: cosponsors, committee, floor votes, thank-yous',
      'Committee-true targeting: messages only reach the officials who actually decide',
      'Every message unique, in the constituent’s own voice; your talking points woven in, visibly',
      'Supporters re-engaged automatically when the bill moves',
    ],
  },
  {
    title: 'Storytelling',
    lead: 'The stories that move votes, collected with consent.',
    points: [
      'Guided story collection with attribution and usage consent built in',
      'AI themes what people actually say, with verbatim de-identified quotes',
      'Press-ready and follow-up-ready flags on every story',
      'Stories feed your hearings, your reports, and your campaigns',
    ],
  },
  {
    title: 'Intelligence',
    lead: 'The org side nobody else has.',
    points: [
      'Whip counts per bill with committee pass projections',
      'Legislator profiles: committees, positions across your bills, meeting notes, constituent pressure',
      'Lobbying hours logged once, reported everywhere',
      'Coalition tracking: who supports, who opposes, what they said',
    ],
  },
];

export default function CampaignsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3">
          The My Democracy Advocacy Platform
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
          Run your whole legislative campaign in one place
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
          Constituents write authentic messages. You whip the votes and log the meetings. The impact report writes
          itself. Grassroots tools don&apos;t have the lobbying layer; lobbying tools don&apos;t have real grassroots.
          This has both, feeding each other.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <a href="#apply" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Apply for the pilot
          </a>
          <a href="#demo" className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold rounded-lg transition-colors">
            See it working
          </a>
        </div>
      </div>

      {/* Pilot + pricing signal */}
      <div className="mb-12 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-center">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          <span className="font-semibold">Now onboarding a limited group of pilot organizations.</span> The platform is
          a paid service for advocacy groups. Pilot partners receive discounted founding-member pricing and shape the
          roadmap directly with us.
        </p>
      </div>

      {/* Three pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
        {PILLARS.map((p) => (
          <div key={p.title} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{p.title}</h2>
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-3">{p.lead}</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              {p.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5 shrink-0">✓</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Demo walkthrough */}
      <div id="demo" className="mb-14 scroll-mt-24">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">See a campaign run start to finish</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto mb-6">
          We ran a full demonstration campaign, a school-meals bill through the Nevada legislature, from cosponsor
          push to the governor&apos;s desk. The public side is live right now; the org side is what we walk you
          through on a pilot call.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Explore the live demo campaign</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              What constituents see: the bill&apos;s journey tracker, the organization&apos;s talking points in the
              open, and the two-minute action flow that produces a unique message to their own legislators.
            </p>
            <Link
              href="/campaign/demo-ab156-parent"
              className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Open the demo campaign →
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">The org side (pilot walkthrough)</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 mb-4">
              <li>• A whip board reading &ldquo;8 of 13 committee members supportive, passes if it holds&rdquo;</li>
              <li>• A legislator profile with meetings, positions across bills, and constituent pressure</li>
              <li>• AI-themed &ldquo;what constituents are saying&rdquo; with verbatim quotes</li>
              <li>• A one-page funder report: 255 constituents, 22 lobbying hours, bill passed</li>
            </ul>
            <a href="#apply" className="inline-block px-4 py-2 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-medium rounded-lg transition-colors">
              Request a live walkthrough
            </a>
          </div>
        </div>
      </div>

      {/* Application */}
      <div id="apply" className="mb-10 scroll-mt-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Apply for the pilot</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          We onboard a handful of organizations at a time and work closely with each. Tell us what you&apos;re working
          on and we&apos;ll set up a walkthrough.
        </p>
        <OrgAccessForm />
      </div>

      {/* Constituent redirect */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Just want to contact your own officials or weigh in on an issue? That&apos;s free, always.{' '}
        <Link href="/issues" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
          Weigh in →
        </Link>
      </p>
    </div>
  );
}
