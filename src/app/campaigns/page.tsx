import type { Metadata } from 'next';
import Link from 'next/link';
import { OrgAccessForm } from '@/components/campaign/OrgAccessForm';

export const metadata: Metadata = {
  title: 'Advocacy Platform | My Democracy',
  description:
    'Grassroots advocacy software for legislative campaigns: individually written constituent messages, bill-stage targeting, whip counts, story collection, and impact reporting. Now onboarding pilot organizations.',
  alternates: { canonical: 'https://www.mydemocracy.app/campaigns' },
  openGraph: {
    title: 'Advocacy Platform | My Democracy',
    description:
      'Grassroots action, legislative tracking, and impact reporting in one platform. Now onboarding pilot organizations.',
  },
};

const PILLARS = [
  {
    title: 'Take Action',
    lead: 'Grassroots action, tied to the legislative calendar.',
    points: [
      'Add an action for each step: cosponsors, committee, floor votes, a thank-you after a win',
      'Committee actions only message that committee\u2019s members',
      'No two supporters send the same letter, and your talking points are in every one',
      'When the bill moves, past supporters get an email with the next action',
    ],
  },
  {
    title: 'Storytelling',
    lead: 'Story collection with consent management.',
    points: [
      'A guided chat helps each person write their story',
      'Storytellers choose how they are named and how you may use each story',
      'See which stories are cleared for press and who you may contact',
      'Read everything on your dashboard or export a spreadsheet',
    ],
  },
  {
    title: 'Intelligence',
    lead: 'Legislative tracking and reporting.',
    points: [
      'A whip board: mark where each member stands and see if you have the votes',
      'A profile per legislator: meeting notes, their positions on your bills, and how many constituents wrote them',
      'Log lobbying hours once and they appear in your reports',
      'Track which groups support and oppose your bill, and what they said',
    ],
  },
];

export default function CampaignsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3">
          Advocacy software for organizations
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
          Grassroots advocacy built for legislative campaigns
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
          My Democracy combines grassroots action, legislative tracking, and impact reporting in one platform.
          Supporters send individually written messages to their own legislators. Your team tracks positions,
          meetings, and outcomes, and reports results to funders.
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
          a paid service for advocacy groups. Pilot pricing is discounted, and you work directly with the founder on
          what gets built next.
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

      {/* Differentiation */}
      <div className="mb-14 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
          How My Democracy compares
        </h2>
        <div className="space-y-4">
          {[
            ['Individually written messages', 'Legacy advocacy platforms rotate a handful of templates, and legislative offices discount identical letters. Here, every supporter’s message is drafted from their own reasons, so it reads and gets counted as genuine constituent mail.'],
            ['Targeting that follows the bill', 'Most tools blast every office at once. Actions here aim at the people deciding the current step: the committee, one chamber, or the specific members you choose.'],
            ['Whip counts without the enterprise contract', 'Position tracking, meeting notes, and lobbying-hour logs are usually sold separately in enterprise public affairs suites. They are part of the same workspace as your grassroots actions.'],
            ['Launch in a day', 'No implementation fees, no per-module pricing, no sales cycle. Create a campaign, share the link, and your first constituent messages arrive the same day.'],
          ].map(([title, body]) => (
            <div key={title} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{body}</p>
            </div>
          ))}
        </div>
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

      {/* Founder trust */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
        My Democracy is independent and founder-led.{' '}
        <Link href="/team" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">
          Meet the founder and read why it exists →
        </Link>
      </p>

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
