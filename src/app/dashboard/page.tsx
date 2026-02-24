import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { truncate } from '@/lib/utils';
import { MyRepresentativesSection } from '@/components/dashboard/MyRepresentativesSection';
import { RepActivitySection } from '@/components/dashboard/RepActivitySection';
import { CopyLinkButton } from '@/components/campaign/CopyLinkButton';
import { DeleteCampaignButton } from '@/components/campaign/DeleteCampaignButton';

export const metadata: Metadata = {
  title: 'Dashboard — My Democracy',
  description: 'Your personalized civic hub. View your representatives, activity, and message history.',
};

function getPartyBadgeClass(party: string) {
  const p = party.toLowerCase();
  if (p.includes('democrat')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  if (p.includes('republican')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'email_opened':
      return { label: 'Email Sent', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
    case 'form_opened':
      return { label: 'Form Opened', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };
    case 'website_opened':
      return { label: 'Website Visited', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' };
    case 'called':
      return { label: 'Called', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
    default:
      return { label: status, class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const admin = createAdminClient();

  // Ensure profile exists (auto-create for users who signed up before this feature)
  let { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    const meta = user.user_metadata || {};
    const { data: newProfile } = await admin
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          name: meta.full_name || null,
          street: meta.street || null,
          city: meta.city || null,
          state: meta.state || null,
          zip: meta.zip || null,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    profile = newProfile;
  }

  // Query messages
  const { data: messages } = await admin
    .from('messages')
    .select('*')
    .or(`user_id.eq.${user.id},advocate_email.eq.${user.email}`)
    .order('created_at', { ascending: false });

  // Compute activity stats
  const totalMessages = messages?.length ?? 0;
  const emailsSent = messages?.filter((m: Record<string, string>) => m.delivery_method !== 'phone').length ?? 0;
  const callsMade = messages?.filter((m: Record<string, string>) => m.delivery_method === 'phone').length ?? 0;
  const uniqueIssues = new Set(messages?.map((m: Record<string, string>) => m.issue_area)).size;
  const uniqueOfficials = new Set(messages?.map((m: Record<string, string>) => m.legislator_name)).size;

  // Query campaigns
  const { data: campaigns } = await admin
    .from('campaigns')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  const hasAddress = !!(profile?.street && profile?.city && profile?.state && profile?.zip);
  const cachedReps = profile?.representatives ?? null;
  const savedAddress = hasAddress
    ? { street: profile.street, city: profile.city, state: profile.state, zip: profile.zip }
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back{profile?.name ? `, ${profile.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/campaign/create"
            className="px-4 py-2 border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-sm font-medium rounded-lg transition-colors"
          >
            Start a Campaign
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            New Message
          </Link>
        </div>
      </div>

      {/* My Representatives */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Representatives</h2>
        <MyRepresentativesSection cachedReps={cachedReps} hasAddress={hasAddress} savedAddress={savedAddress} />
      </section>

      {/* My Activity */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Activity</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{emailsSent}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Emails Sent</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{callsMade}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Calls Made</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{uniqueIssues}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Issues Raised</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{uniqueOfficials}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Officials Contacted</div>
          </div>
        </div>
      </section>

      {/* My Campaigns */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Campaigns</h2>
          <Link
            href="/campaign/create"
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            + New Campaign
          </Link>
        </div>
        {!campaigns || campaigns.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No campaigns yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Rally others around an issue you care about.</p>
            <Link
              href="/campaign/create"
              className="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Start a Campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campaigns.map((campaign: Record<string, string | number>) => (
              <div
                key={campaign.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    {campaign.issue_area}
                  </span>
                  <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-bold">{Number(campaign.action_count)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">action{Number(campaign.action_count) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                  {campaign.headline}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {campaign.description}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/campaign/${campaign.slug}`}
                    className="flex-1 text-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    View Campaign
                  </Link>
                  <CopyLinkButton slug={campaign.slug as string} />
                  <DeleteCampaignButton slug={campaign.slug as string} headline={campaign.headline as string} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Your Feed */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Feed</h2>
        <RepActivitySection />
      </section>

      {/* My Messages */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Messages</h2>
        {!messages || messages.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No messages yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Start contacting your representatives to see your history here.</p>
            <Link
              href="/contact"
              className="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Contact Officials
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg: Record<string, string>) => {
              const status = getStatusBadge(msg.delivery_status);
              const date = new Date(msg.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={msg.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {msg.legislator_name}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPartyBadgeClass(msg.legislator_party)}`}>
                        {msg.legislator_party}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{date}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{msg.issue_area}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.class}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {truncate(msg.message_body, 200)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
