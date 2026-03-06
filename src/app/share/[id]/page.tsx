import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

async function getShareData(id: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('messages')
      .select('id, legislator_name, issue_area, issue_subtopic, advocate_city, advocate_state, created_at')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getShareData(id);

  if (!data) {
    return { title: 'Share | My Democracy' };
  }

  const title = `A citizen contacted ${data.legislator_name} about ${data.issue_subtopic || data.issue_area}`;
  const description = `A constituent from ${data.advocate_city}, ${data.advocate_state} contacted ${data.legislator_name}. Make your voice heard too. Write to your officials on My Democracy.`;

  return {
    title: `${title} | My Democracy`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://www.mydemocracy.app/share/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  const data = await getShareData(id);

  if (!data) {
    notFound();
  }

  const issue = data.issue_subtopic || data.issue_area;
  const date = new Date(data.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {/* Header accent */}
          <div className="h-2 bg-gradient-to-r from-purple-600 to-purple-400" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              A Citizen Took Action
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              A constituent from <strong>{data.advocate_city}, {data.advocate_state}</strong> contacted <strong>{data.legislator_name}</strong> about <strong>{issue}</strong> on {date}.
            </p>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl mb-6">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Every message to Congress matters. Your representatives work for you. Let them know what you care about.
              </p>
            </div>

            <Link
              href="/contact"
              className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-center"
            >
              Contact Your Representatives
            </Link>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Free, AI-powered messages to your elected officials in minutes.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Powered by{' '}
          <Link href="/" className="text-purple-600 dark:text-purple-400 hover:underline">
            My Democracy
          </Link>
        </p>
      </div>
    </div>
  );
}
