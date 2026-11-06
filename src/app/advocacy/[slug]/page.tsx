import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LOCAL_ACTIONS, localActionBySlug } from '@/data/local-actions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LOCAL_ACTIONS.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const action = localActionBySlug(slug);
  if (!action) return { title: 'Not found | My Democracy' };
  return {
    title: `${action.title} | My Democracy`,
    description: action.summary,
    alternates: { canonical: `https://www.mydemocracy.app/advocacy/${action.slug}` },
    openGraph: { title: action.title, description: action.summary },
  };
}

export default async function LocalActionPage({ params }: PageProps) {
  const { slug } = await params;
  const a = localActionBySlug(slug);
  if (!a) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/advocacy" className="text-sm text-purple-700 dark:text-purple-300 hover:underline">
        &larr; Advocacy
      </Link>

      <p className="label mt-6 mb-3">
        {a.jurisdiction} · Case {a.caseNumber}
      </p>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-[0.98] text-gray-900 dark:text-white mb-5">
        {a.title}
      </h1>
      <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 max-w-[62ch]">{a.summary}</p>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {a.projectName}. Applicant: {a.applicant}.
      </p>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-rule dark:border-gray-700">
        <p className="label mb-2">Where it stands</p>
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{a.status}</p>
      </div>

      {a.stance !== 'neutral' && a.stanceOwner && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-[62ch]">
          This page carries the position of {a.stanceOwner}. My Democracy does not take a side on local applications.
          The facts below come from the city record and the public notice for the case.
        </p>
      )}

      {a.campaignSlug && (
        <section className="mt-8 border border-gray-900 dark:border-gray-300 p-5">
          <p className="label mb-2">Write your comment</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-[62ch]">
            The guide asks what this means to you, drafts the comment in your words, and you edit every line before it
            goes anywhere. The same flow the campaigns on this site use.
          </p>
          <Link
            href={`/campaign/${a.campaignSlug}`}
            className="label-lg inline-block px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            Start writing
          </Link>
        </section>
      )}

      <section className="mt-12">
        <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">What is being asked for</h2>
        <ul className="space-y-2 mb-6">
          {a.requests.map((r) => (
            <li key={r} className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {r}
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{a.location}</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-600 text-left">
                <th className="py-2 pr-4 font-semibold text-gray-900 dark:text-white">Designation</th>
                <th className="py-2 pr-4 font-semibold text-gray-900 dark:text-white">Today</th>
                <th className="py-2 font-semibold text-gray-900 dark:text-white">Proposed</th>
              </tr>
            </thead>
            <tbody>
              {a.changes.map((c) => (
                <tr key={c.label} className="border-b border-gray-200 dark:border-gray-700 align-top">
                  <td className="py-2.5 pr-4 text-gray-900 dark:text-white">
                    {c.label}
                    {c.note && <span className="block text-xs text-gray-500 dark:text-gray-400">{c.note}</span>}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-gray-700 dark:text-gray-300">{c.from}</td>
                  <td className="py-2.5 tabular-nums text-gray-700 dark:text-gray-300">{c.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Assessor parcel numbers: {a.parcels.join(', ')}.
        </p>
      </section>

      {a.context && (
        <section className="mt-12">
          <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">{a.context.heading}</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-[62ch]">{a.context.body}</p>
          <a
            href={a.context.source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-xs text-purple-700 dark:text-purple-300 hover:underline"
          >
            {a.context.source.label}
          </a>
        </section>
      )}

      <section className="mt-12">
        <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">Who decides</h2>
        <div className="space-y-5">
          {a.deciders.map((d) => (
            <div key={d.body}>
              <p className="font-semibold text-gray-900 dark:text-white">{d.body}</p>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 max-w-[62ch]">{d.role}</p>
              {d.contact && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{d.contact}</p>}
              {d.contactUrl && (
                <a
                  href={d.contactUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-purple-700 dark:text-purple-300 hover:underline"
                >
                  Contact details
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">Other ways to be heard</h2>
        <ol className="space-y-3 list-decimal list-inside">
          {a.howToComment.slice(1).map((s) => (
            <li key={s} className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-[62ch]">
              {s}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/representatives"
            className="label-lg px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-center transition-colors"
          >
            Find your council member
          </Link>
          <a
            href={a.materials.url}
            target="_blank"
            rel="noreferrer"
            className="label-lg px-5 py-3 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 text-center hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900 transition-colors"
          >
            Read the application
          </a>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="label mb-3 border-t border-gray-900 dark:border-gray-600 pt-6">How it got here</h2>
        <ul className="space-y-2">
          {a.timeline.map((t) => (
            <li key={t.date + t.event} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-medium text-gray-900 dark:text-white">{t.date}.</span> {t.event}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-xs text-gray-500 dark:text-gray-400">
        Details taken from the public notice and the City of Reno record. Last checked {a.lastVerified}. Figures are
        the applicant&rsquo;s. Check the record for the current version before you write.
      </p>
    </div>
  );
}
