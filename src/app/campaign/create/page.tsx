import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CampaignForm } from '@/components/campaign/CampaignForm';

export const metadata: Metadata = {
  title: 'Start a Campaign | My Democracy',
  description: 'Create a shareable campaign page to rally others around an issue you care about.',
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

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/campaign/create${isStory ? '?type=storytelling' : ''}`)}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isStory ? 'Start a Storytelling Campaign' : 'Start an Advocacy Campaign'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isStory
            ? 'Collect personal stories from your supporters. Each person is guided step by step, then emails their story to you.'
            : 'Create a shareable page so others can contact their representatives about your issue.'}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        <CampaignForm />
      </div>
    </div>
  );
}
