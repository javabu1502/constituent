import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CampaignForm } from '@/components/campaign/CampaignForm';

export const metadata: Metadata = {
  title: 'Start a Campaign — My Democracy',
  description: 'Create a shareable campaign page to rally others around an issue you care about.',
};

export default async function CreateCampaignPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/campaign/create');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Start a Campaign</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create a shareable page so others can contact their representatives about your issue.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        <CampaignForm />
      </div>
    </div>
  );
}
