import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { US_STATES } from '@/lib/constants';
import { findBySlug, slugsForState } from '@/lib/state-legislator-slug';
import { lowerChamberName } from '@/lib/chambers';
import { committeesForPerson } from '@/lib/state-committees';
import { StateLegislatorActivity } from '@/components/legislators/StateLegislatorActivity';
import { LegislatorBio } from '@/components/legislators/LegislatorBio';
import type { Official } from '@/lib/types';

const STATES_BY_SLUG: Record<string, { code: string; name: string }> = {};
for (const s of US_STATES) {
  STATES_BY_SLUG[s.name.toLowerCase().replace(/\s+/g, '-')] = { code: s.code, name: s.name };
}

/*
 * Every legislator page is generated, and nothing else is allowed.
 *
 * notFound() was not enough here. On a dynamic segment the miss still came
 * back 200 with the not-found page rendered inside it, in production as well
 * as dev: a soft 404, the one status search engines actively punish. Listing
 * the real slugs and refusing the rest hands the 404 to the router, which
 * gets it right.
 *
 * The cost is 7,359 pages at build time. They are cheap: every field comes
 * from local JSON, and bills and news arrive from the client afterwards, so
 * no page waits on an API while it builds.
 */
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ state: string; person: string }>;
}

/**
 * One page per state legislator.
 *
 * Congress has had /rep/<bioguide> for a long time. The 7,359 people in the
 * statehouses had nothing, despite being the ones a small group can actually
 * move and the ones no one else covers well. /legislators/<state> listed them
 * and linked straight into a letter form, so there was no address to send
 * anyone to, and nothing for a search for "who is my state senator" to find.
 *
 * Rendered on demand rather than built 7,359 times: the identity half comes
 * from local data and is instant, and bills, votes and news arrive from the
 * client so a cold page is never waiting on OpenStates.
 */
export function generateStaticParams(): { state: string; person: string }[] {
  return US_STATES.flatMap((s) => {
    const state = s.name.toLowerCase().replace(/\s+/g, '-');
    return slugsForState(s.code).map((e) => ({ state, person: e.slug }));
  });
}

function resolve(stateSlug: string, personSlug: string): { official: Official; state: { code: string; name: string } } | null {
  const state = STATES_BY_SLUG[stateSlug];
  if (!state) return null;
  const official = findBySlug(state.code, personSlug);
  return official ? { official, state } : null;
}

/** "Assemblymember, District 24" reads better split into its two halves. */
function districtLine(o: Official, stateName: string): string {
  const chamber = o.chamber === 'upper' ? 'Senate' : lowerChamberName(o.state);
  return o.district ? `${stateName} ${chamber}, District ${o.district}` : `${stateName} ${chamber}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug, person } = await params;
  const hit = resolve(stateSlug, person);
  if (!hit) return { title: 'Legislator not found' };
  const { official, state } = hit;
  const line = districtLine(official, state.name);
  return {
    title: `${official.name} — ${line} | My Democracy`,
    description: `Contact ${official.name}, ${line}. Phone, email, office address, the bills they have sponsored, and a way to write to them in your own words.`,
    alternates: { canonical: `https://www.mydemocracy.app/legislators/${stateSlug}/${person}` },
    openGraph: {
      title: `${official.name} — ${line}`,
      description: `Contact information and recent bills for ${official.name}.`,
      type: 'profile',
    },
  };
}

export default async function StateLegislatorPage({ params }: PageProps) {
  const { state: stateSlug, person } = await params;
  const hit = resolve(stateSlug, person);
  if (!hit) notFound();
  const { official, state } = hit;
  const line = districtLine(official, state.name);
  const partyRule = /democrat/i.test(official.party) ? '#2B5CA8' : /republican/i.test(official.party) ? '#A8352B' : '#6E685C';

  const seats = committeesForPerson(state.code, official.id);
  const record = slugsForState(state.code).find((e) => e.slug === person)?.legislator;
  const sameChamber = slugsForState(state.code)
    .filter((e) => e.legislator.chamber === official.chamber && e.legislator.name !== official.name)
    .slice(0, 12);

  // Person markup, so a search engine reads this as someone holding office
  // rather than a page that happens to mention a name.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: official.name,
    jobTitle: line,
    affiliation: { '@type': 'GovernmentOrganization', name: `${state.name} Legislature` },
    ...(official.email ? { email: official.email } : {}),
    ...(official.phone ? { telephone: official.phone } : {}),
    ...(official.website ? { url: official.website } : {}),
    ...(official.party ? { memberOf: { '@type': 'Organization', name: official.party } } : {}),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="label mb-5">
        <Link href="/legislators" className="hover:underline">Legislators</Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/legislators/${stateSlug}`} className="hover:underline">{state.name}</Link>
      </nav>

      <div className="h-1 mb-5" style={{ background: partyRule }} aria-hidden="true" />

      <div className="flex flex-wrap gap-8 items-start mb-10">
        <div className="flex-1 min-w-[280px]">
          <p className="label mb-3">{line}</p>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter leading-[0.96] text-gray-900 dark:text-white mb-4">
            {official.name}
          </h1>
          <p className="label-lg text-gray-600 dark:text-gray-400">{official.party}</p>
        </div>

        <div className="w-full sm:w-72">
          <h2 className="label mb-3">Contact</h2>
          <dl className="text-sm space-y-2.5 border-t border-gray-900 dark:border-gray-600 pt-3">
            {official.phone && (
              <div className="flex gap-3">
                <dt className="label w-16 shrink-0">Phone</dt>
                <dd><a className="hover:underline" href={`tel:${official.phone.replace(/[^\d+]/g, '')}`}>{official.phone}</a></dd>
              </div>
            )}
            {official.email && (
              <div className="flex gap-3">
                <dt className="label w-16 shrink-0">Email</dt>
                <dd className="min-w-0 break-words"><a className="hover:underline" href={`mailto:${official.email}`}>{official.email}</a></dd>
              </div>
            )}
            {official.office && (
              <div className="flex gap-3">
                <dt className="label w-16 shrink-0">Office</dt>
                <dd className="text-gray-700 dark:text-gray-300">{official.office}</dd>
              </div>
            )}
            {record?.districtOffice && (
              <div className="flex gap-3">
                <dt className="label w-16 shrink-0">District</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {record.districtOffice}
                  {record.districtPhone ? ` · ${record.districtPhone}` : ''}
                </dd>
              </div>
            )}
            {official.website && (
              <div className="flex gap-3">
                <dt className="label w-16 shrink-0">Official</dt>
                <dd><a className="hover:underline" href={official.website} target="_blank" rel="noopener noreferrer">Legislature page</a></dd>
              </div>
            )}
          </dl>

          <Link
            href="/contact"
            className="label-lg mt-5 block w-full text-center px-4 py-3.5 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            Write to {official.lastName || official.name.split(/\s+/).slice(-1)[0]}
          </Link>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            We check that you live in their district before sending.
          </p>

          {(record?.wikipediaUrl || record?.ballotpediaUrl || record?.twitter) && (
            <div className="mt-5">
              <h3 className="label mb-2">Elsewhere</h3>
              <ul className="text-sm space-y-1.5">
                {record.wikipediaUrl && (
                  <li><a className="hover:underline" href={record.wikipediaUrl} target="_blank" rel="noopener noreferrer">Wikipedia</a></li>
                )}
                {record.ballotpediaUrl && (
                  <li><a className="hover:underline" href={record.ballotpediaUrl} target="_blank" rel="noopener noreferrer">Ballotpedia</a></li>
                )}
                {record.twitter && (
                  <li><a className="hover:underline" href={`https://x.com/${record.twitter}`} target="_blank" rel="noopener noreferrer">@{record.twitter}</a></li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {record?.wikipediaUrl && <LegislatorBio wikipediaUrl={record.wikipediaUrl} name={official.name} />}

      {seats.length > 0 && (
        <section className="mb-12">
          <h2 className="label mb-4 border-t border-gray-900 dark:border-gray-600 pt-6">
            Committees
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-[62ch]">
            Committees are where most bills live or die, so a letter to a member of the committee hearing a bill
            carries further than one to the floor at large.
          </p>
          <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {seats.map(({ committee, role }) => (
              <li key={committee.id} className="flex items-baseline gap-3">
                {role ? (
                  <span className="label-lg shrink-0 text-purple-700 dark:text-purple-300">{role}</span>
                ) : (
                  <span className="label shrink-0">Member</span>
                )}
                <span className="text-[15px] text-gray-900 dark:text-gray-100">{committee.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <StateLegislatorActivity
        personId={official.id}
        stateCode={state.code}
        chamber={official.chamber === 'upper' ? 'upper' : 'lower'}
        name={official.name}
        title={official.title}
      />

      {sameChamber.length > 0 && (
        <section className="mt-14">
          <h2 className="label mb-4 border-t border-gray-900 dark:border-gray-600 pt-6">
            Others in the {state.name} {official.chamber === 'upper' ? 'Senate' : lowerChamberName(official.state)}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {sameChamber.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/legislators/${stateSlug}/${e.slug}`}
                  className="inline-block px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-300 transition-colors"
                >
                  {e.legislator.name}
                  <span className="label ml-2">D{e.legislator.district}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`/legislators/${stateSlug}`} className="label-lg inline-block mt-4 text-purple-700 dark:text-purple-300 hover:underline">
            All {state.name} legislators
          </Link>
        </section>
      )}
    </div>
  );
}
