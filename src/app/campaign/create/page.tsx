import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CampaignForm } from '@/components/campaign/CampaignForm';

export const metadata: Metadata = {
  title: 'Start a Campaign | My Democracy',
  description: 'Create a shareable campaign page to rally others around an issue you care about.',
};

const COPY = {
  advocacy: {
    heading: 'Start an Advocacy Campaign',
    subtitle: 'Create a shareable page so others can contact their representatives about your issue.',
    what: 'Rally people to contact their elected officials about an issue you care about. You set the issue and talking points; each supporter gets an AI-personalized message to send to their own representatives.',
    points: [
      'Share one link — supporters take action in minutes.',
      'Every message is personalized and routed to the right officials.',
      'Track how many people have taken action.',
    ],
  },
  storytelling: {
    heading: 'Start a Storytelling Campaign',
    subtitle: 'Collect personal stories from your supporters. Each person is guided step by step, then emails their story to you.',
    what: 'Collect personal stories from your supporters. A guided chat helps each person write their story in their own words — then they choose how they’re credited and email it to you.',
    points: [
      'Share a private link — supporters write their story with guided help.',
      'They choose how they’re credited and how their story may be used.',
      'Finished stories come straight to your inbox.',
    ],
  },
};

export default async function CreateCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { type } = await searchParams;
  const isStory = type === 'storytelling';
  const copy = isStory ? COPY.storytelling : COPY.advocacy;
  const createPath = `/campaign/create${isStory ? '?type=storytelling' : '?type=advocacy'}`;

  // Logged-out visitors get a public explainer + sign-in CTA instead of a cold
  // redirect to the login box, so they understand what they clicked on.
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.heading}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{copy.subtitle}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
          <p className="text-gray-700 dark:text-gray-200">{copy.what}</p>
          <ul className="mt-4 space-y-2">
            {copy.points.map((pt) => (
              <li key={pt} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{pt}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              Creating a campaign is free — you just need an account so you can manage it and see responses.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/login?redirectTo=${encodeURIComponent(createPath)}`}
                className="flex-1 text-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Sign in to start
              </Link>
              <Link
                href={`/signup?redirectTo=${encodeURIComponent(createPath)}`}
                className="flex-1 text-center px-4 py-2.5 border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-medium rounded-lg transition-colors"
              >
                Create a free account
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Just want to take action?{' '}
          <Link href="/campaigns" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">Browse campaigns</Link>
          {' '}or{' '}
          <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">write to your officials</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{copy.heading}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{copy.subtitle}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        <CampaignForm initialType={isStory ? 'storytelling' : 'advocacy'} />
      </div>
    </div>
  );
}
