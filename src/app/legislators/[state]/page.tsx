import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { US_STATES } from '@/lib/constants';
import { PARTY_COLORS, DEFAULT_PARTY_COLOR } from '@/lib/constants';
import { getStateLegislators, toOfficial } from '@/lib/state-legislators';
import type { Official } from '@/lib/types';

// Slug → state code mapping
const STATES_BY_SLUG: Record<string, { code: string; name: string }> = {};
for (const s of US_STATES) {
  const slug = s.name.toLowerCase().replace(/\s+/g, '-');
  STATES_BY_SLUG[slug] = { code: s.code, name: s.name };
}

export function generateStaticParams() {
  return US_STATES.map((s) => ({
    state: s.name.toLowerCase().replace(/\s+/g, '-'),
  }));
}

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: slug } = await params;
  const stateInfo = STATES_BY_SLUG[slug];
  if (!stateInfo) return { title: 'State Legislators | My Democracy' };

  const title = `${stateInfo.name} State Legislators | My Democracy`;
  const description = `Browse all ${stateInfo.name} state senators and representatives. View their party, district, photo, and contact them directly on My Democracy.`;

  return {
    title,
    description,
    keywords: [
      `${stateInfo.name} state legislators`,
      `${stateInfo.name} state senate`,
      `${stateInfo.name} state representatives`,
      `contact ${stateInfo.name} legislators`,
      `${stateInfo.name} state government`,
    ],
    openGraph: {
      title,
      description,
      url: `https://www.mydemocracy.app/legislators/${slug}`,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.mydemocracy.app/legislators/${slug}`,
    },
  };
}

function LegislatorRow({ legislator }: { legislator: Official }) {
  const partyColor = PARTY_COLORS[legislator.party] ?? DEFAULT_PARTY_COLOR;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Photo */}
      {legislator.photoUrl ? (
        <img
          src={legislator.photoUrl}
          alt={legislator.name}
          className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-600"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
          <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            {legislator.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{legislator.name}</span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${partyColor.bg} ${partyColor.text}`}>
            {legislator.party}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{legislator.title}</p>
      </div>

      {/* Contact button */}
      <Link
        href={`/contact?repId=${legislator.id}`}
        className="shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
      >
        Contact
      </Link>
    </div>
  );
}

export default async function StateLegislatorsPage({ params }: StatePageProps) {
  const { state: slug } = await params;
  const stateInfo = STATES_BY_SLUG[slug];
  if (!stateInfo) notFound();

  const legislators = getStateLegislators(stateInfo.code);
  const officials = legislators.map((l) => toOfficial(l, stateInfo.code));
  const upper = officials.filter((o) => o.chamber === 'upper');
  const lower = officials.filter((o) => o.chamber === 'lower');

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.mydemocracy.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Legislators',
        item: 'https://www.mydemocracy.app/legislators',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: stateInfo.name,
        item: `https://www.mydemocracy.app/legislators/${slug}`,
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Home</Link>
        {' / '}
        <Link href="/legislators" className="hover:text-purple-600 dark:hover:text-purple-400">Legislators</Link>
        {' / '}
        <span className="text-gray-900 dark:text-white font-medium">{stateInfo.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {stateInfo.name} State Legislators
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse all {officials.length} state legislators in {stateInfo.name} and contact them directly.
        </p>
      </div>

      {officials.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No legislator data available for {stateInfo.name} yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* State Senate */}
          {upper.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                State Senate <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({upper.length})</span>
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
                {upper.map((leg) => (
                  <LegislatorRow key={leg.id} legislator={leg} />
                ))}
              </div>
            </section>
          )}

          {/* State House */}
          {lower.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                State House <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({lower.length})</span>
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
                {lower.map((leg) => (
                  <LegislatorRow key={leg.id} legislator={leg} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Can&apos;t find your official? Enter your address for an exact match.
        </p>
        <Link
          href="/contact"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          Find My Officials
        </Link>
      </div>
    </div>
  );
}
