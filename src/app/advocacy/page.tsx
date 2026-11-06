import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCAL_ACTIONS } from '@/data/local-actions';

export const metadata: Metadata = {
  title: 'Advocacy | My Democracy',
  description:
    'Local decisions still open to comment. What is proposed, who votes on it, and how to get your position into the record.',
  alternates: { canonical: 'https://www.mydemocracy.app/advocacy' },
  openGraph: {
    title: 'Advocacy | My Democracy',
    description: 'Local decisions still open to comment, and how to get your position into the record.',
  },
};

/**
 * Local decisions, kept apart from Weigh In.
 *
 * A weigh-in turns into a letter to a member of Congress or a state
 * legislator. A city rezoning is decided by a planning commission and a
 * council, so the useful thing is the case record and the hearing, not a
 * generated letter. These pages inform and point at the body that votes.
 */
export default function AdvocacyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <p className="label mb-3">Advocacy</p>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-[0.98] text-gray-900 dark:text-white mb-5">
        Decisions being made where you live.
      </h1>
      <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 max-w-[62ch] mb-10">
        Zoning, land use and other local decisions, while they are still open to comment. Each one lays out what is
        proposed, what each side says, and who takes the vote. We do not take a position.
      </p>

      {LOCAL_ACTIONS.length === 0 ? (
        <div className="p-12 text-center border border-rule dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nothing open right now</h2>
          <p className="text-gray-600 dark:text-gray-400">Check back as new applications are filed.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {LOCAL_ACTIONS.map((a) => (
            <Link
              key={a.slug}
              href={`/advocacy/${a.slug}`}
              className="block p-5 border border-rule dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 transition-colors"
            >
              <p className="label mb-2">
                {a.jurisdiction} · Case {a.caseNumber}
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{a.title}</h2>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 max-w-[70ch]">{a.summary}</p>
              <p className="mt-3 text-sm text-purple-700 dark:text-purple-300">Read it and weigh in &rarr;</p>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-10 text-sm text-gray-600 dark:text-gray-400 max-w-[62ch]">
        Looking for bills in Congress or your state legislature?{' '}
        <Link href="/issues" className="text-purple-700 dark:text-purple-300 hover:underline">
          Weigh In
        </Link>{' '}
        covers those.
      </p>
    </div>
  );
}
