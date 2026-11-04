import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';
import { POLICY_TOPICS, topicBySlug, topicFor } from '@/lib/policy-topics';
import { TOPIC_CONTENT } from '@/lib/policy-topic-content';

interface PageProps {
  params: Promise<{ topic: string }>;
}

/**
 * One page per policy topic.
 *
 * /issues is a single page carrying every weigh-in behind a client-side
 * filter, so a search engine sees one URL for seventeen subjects and a
 * person arriving from a search for "gun bills in congress" lands on a list
 * about everything. These pages give each subject its own address, its own
 * title, and a sentence that says what belongs in it.
 */
export function generateStaticParams() {
  return POLICY_TOPICS.filter((t) => t.slug !== 'other').map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) return { title: 'Topic not found' };
  return {
    title: `${topic.label}: bills before Congress and the states | My Democracy`,
    description: `${topic.blurb} See what is being decided, read both sides, and tell the people who represent you where you stand.`,
    alternates: { canonical: `https://www.mydemocracy.app/issues/${topic.slug}` },
    openGraph: {
      title: `${topic.label} | My Democracy`,
      description: topic.blurb,
      type: 'website',
    },
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { topic: slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic || topic.slug === 'other') notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from('campaigns')
    .select('slug, headline, description, issue_area, bill_ref, bill_state, target_level, action_count, created_at')
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .eq('visibility', 'public')
    .eq('campaign_type', 'advocacy')
    .is('is_official', true)
    .order('created_at', { ascending: false });

  // Matching happens here rather than in the query: issue_area is free text,
  // and a topic owns several spellings of itself.
  const all = data ?? [];
  const inTopic = all.filter((c) => topicFor(c.issue_area as string | null).slug === topic.slug);

  const others = POLICY_TOPICS.filter((t) => t.slug !== 'other' && t.slug !== topic.slug);
  const content = TOPIC_CONTENT[topic.slug];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <nav aria-label="Breadcrumb" className="label mb-4">
        <Link href="/issues" className="hover:underline">Weigh in</Link>
        <span aria-hidden="true"> / </span>
        <span>{topic.label}</span>
      </nav>

      <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter leading-[0.96] text-gray-900 dark:text-white mb-5">
        {topic.label}
      </h1>
      <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 max-w-[62ch] mb-4">{topic.blurb}</p>
      {content?.intro && (
        <p className="text-[17px] leading-relaxed text-gray-700 dark:text-gray-300 max-w-[66ch] mb-10">
          {content.intro}
        </p>
      )}

      {/* Who holds the lever. This is the part of the page no one else
          writes, and the mistake that sends letters to the wrong desk. */}
      {content && content.deciders.length > 0 && (
        <section className="mb-12">
          <h2 className="label mb-4 border-t border-gray-900 dark:border-gray-600 pt-6">Who decides this</h2>
          <dl className="grid gap-5 sm:grid-cols-3">
            {content.deciders.map((d) => (
              <div key={d.level}>
                <dt className="label-lg text-gray-900 dark:text-white mb-1.5">{d.level}</dt>
                <dd className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{d.what}</dd>
              </div>
            ))}
          </dl>
          {content.committees && content.committees.length > 0 && (
            <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
              <span className="label">In Congress</span>{' '}
              {content.committees.join(' \u00b7 ')}
            </p>
          )}
        </section>
      )}

      {inTopic.length === 0 ? (
        <div className="border border-rule dark:border-gray-700 bg-surface dark:bg-gray-800 p-6 mb-12">
          <p className="text-gray-700 dark:text-gray-300">
            Nothing open on {topic.label.toLowerCase()} right now.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            You do not have to wait for one.{' '}
            <Link href="/contact" className="text-purple-700 dark:text-purple-300 hover:underline">
              Write to your own officials
            </Link>{' '}
            about it instead.
          </p>
        </div>
      ) : (
        <>
          <p className="label mb-4">{inTopic.length} open {inTopic.length === 1 ? 'question' : 'questions'}</p>
          <ul className="grid gap-4 sm:grid-cols-2 mb-14">
            {inTopic.map((c) => (
              <li key={c.slug as string} className="border border-rule dark:border-gray-700 bg-surface dark:bg-gray-800">
                <Link href={`/campaign/${c.slug}`} className="block p-5 h-full">
                  <p className="label mb-2">
                    {(c.bill_ref as string | null) ?? (c.target_level === 'state' ? 'State policy' : 'Federal policy')}
                    {c.bill_state ? ` · ${c.bill_state}` : ''}
                  </p>
                  <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                    {c.headline as string}
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3">
                    {c.description as string}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {content && content.questions.length > 0 && (
        <section className="mb-14">
          <h2 className="label mb-5 border-t border-gray-900 dark:border-gray-600 pt-6">Common questions</h2>
          <dl className="space-y-5 max-w-[66ch]">
            {content.questions.map((qa) => (
              <div key={qa.q}>
                <dt className="font-bold tracking-tight text-gray-900 dark:text-white mb-1">{qa.q}</dt>
                <dd className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">{qa.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <h2 className="label mb-4 border-t border-gray-900 dark:border-gray-600 pt-6">Other topics</h2>
      <ul className="flex flex-wrap gap-2">
        {others.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/issues/${t.slug}`}
              className="label-lg inline-block px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-300 transition-colors"
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
