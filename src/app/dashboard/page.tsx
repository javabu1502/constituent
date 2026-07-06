import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { truncate } from '@/lib/utils';
import { MyRepresentativesSection } from '@/components/dashboard/MyRepresentativesSection';
import { LocalOfficialsSection } from '@/components/dashboard/LocalOfficialsSection';
import { RepActivitySection } from '@/components/dashboard/RepActivitySection';
import { VoterInfoCard } from '@/components/dashboard/VoterInfoCard';
import { CopyLinkButton } from '@/components/campaign/CopyLinkButton';
import { DeleteCampaignButton } from '@/components/campaign/DeleteCampaignButton';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { GettingStartedChecklist } from '@/components/dashboard/GettingStartedChecklist';
import { WelcomeTour } from '@/components/dashboard/WelcomeTour';
import { FollowUpButton } from '@/components/dashboard/FollowUpButton';
import { MyStoriesSection } from '@/components/dashboard/MyStoriesSection';

export const metadata: Metadata = {
  title: 'Dashboard | My Democracy',
  description: 'Your personalized civic hub. View your elected officials, activity, and message history.',
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
    case 'sent':
      return { label: 'Delivered to Congress', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
    case 'pending_review':
      return { label: 'Under Review', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
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

  // Fetch profile, messages, campaigns, and the user's own stories in parallel
  const [profileResult, messagesResult, campaignsResult, storiesResult] = await Promise.all([
    admin.from('profiles').select('*').eq('user_id', user.id).single(),
    admin.from('messages')
      .select('id,delivery_method,issue_area,issue_subtopic,legislator_name,legislator_party,delivery_status,created_at,message_body')
      .or(`user_id.eq.${user.id},advocate_email.eq.${user.email}`)
      .order('created_at', { ascending: false })
      .limit(100),
    admin.from('campaigns').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
    admin.from('stories')
      .select('id,created_at,attribution_level,title,body,campaigns(headline)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  let profile = profileResult.data;

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

  const messages = messagesResult.data;

  // Compute activity stats
  const totalMessages = messages?.length ?? 0;
  const emailsSent = messages?.filter((m: Record<string, string>) => m.delivery_method !== 'phone').length ?? 0;
  const callsMade = messages?.filter((m: Record<string, string>) => m.delivery_method === 'phone').length ?? 0;
  const uniqueIssues = new Set(messages?.map((m: Record<string, string>) => m.issue_area)).size;
  const uniqueOfficials = new Set(messages?.map((m: Record<string, string>) => m.legislator_name)).size;

  const campaigns = campaignsResult.data;

  const myStories = (storiesResult.data ?? []).map((s: Record<string, unknown>) => {
    const body = (s.body as string | null) ?? '';
    type CampRel = { headline?: string };
    const campaignRel = s.campaigns as CampRel | CampRel[] | null;
    const camp = Array.isArray(campaignRel) ? campaignRel[0] : campaignRel;
    return {
      id: s.id as string,
      created_at: s.created_at as string,
      attribution_level: s.attribution_level as 'named' | 'first_name_only' | 'anonymous',
      campaign_headline: camp?.headline ?? null,
      title: (s.title as string | null) ?? null,
      body,
    };
  });

  const hasAddress = !!(profile?.street && profile?.city && profile?.state && profile?.zip);
  const cachedReps = profile?.representatives ?? null;
  const cachedLocalOfficials = profile?.local_officials ?? null;
  const savedAddress = hasAddress
    ? { street: profile.street, city: profile.city, state: profile.state, zip: profile.zip }
    : null;

  const recentMessages = messages?.slice(0, 5) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <WelcomeTour />
      {/* Header with inline activity stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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

      {/* Getting Started checklist for new users */}
      <GettingStartedChecklist
        hasAddress={hasAddress}
        hasReps={!!cachedReps && Array.isArray(cachedReps) && cachedReps.length > 0}
        hasMessages={totalMessages > 0}
      />

      {/* Your Impact — jump-off points to your own activity */}
      {(totalMessages > 0 || myStories.length > 0 || (campaigns && campaigns.length > 0)) && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Your Impact</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">What you&rsquo;ve done so far — click through for the details.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="#messages" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
              <p className="text-sm text-gray-500 dark:text-gray-400">Messages Sent</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalMessages}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {emailsSent} email{emailsSent !== 1 ? 's' : ''} · {callsMade} call{callsMade !== 1 ? 's' : ''}
              </p>
            </a>
            <a href="#messages" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
              <p className="text-sm text-gray-500 dark:text-gray-400">Officials Reached</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{uniqueOfficials}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">across {uniqueIssues} issue{uniqueIssues !== 1 ? 's' : ''}</p>
            </a>
            <a href={myStories.length > 0 ? '#stories' : '/campaigns'} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
              <p className="text-sm text-gray-500 dark:text-gray-400">Stories Shared</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{myStories.length}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {myStories.length > 0 ? 'yours to change or revoke' : 'find a campaign to share with'}
              </p>
            </a>
            <a href={campaigns && campaigns.length > 0 ? '#campaigns' : '/campaign/create'} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
              <p className="text-sm text-gray-500 dark:text-gray-400">My Campaigns</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{campaigns?.length ?? 0}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {campaigns && campaigns.length > 0 ? 'created by you' : 'start your first one'}
              </p>
            </a>
          </div>
        </section>
      )}

      {/* PRIMARY: My Campaigns — creators check on their campaigns first */}
      {campaigns && campaigns.length > 0 && (
        <section id="campaigns" className="mb-10 scroll-mt-24">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Campaigns</h2>
            <Link href="/campaign/create" className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium">
              + New campaign
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Campaigns you&rsquo;re running — check analytics to see your reach.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campaigns.map((campaign: Record<string, string | number>) => (
              <div
                key={campaign.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5"
              >
                {(() => {
                  const isStory = campaign.campaign_type === 'storytelling';
                  const count = isStory ? Number(campaign.story_count) : Number(campaign.action_count);
                  const approval = String(campaign.approval_status || 'approved');
                  const approvalBadge: Record<string, { label: string; cls: string }> = {
                    pending: { label: 'Pending review', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
                    rejected: { label: 'Needs changes', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
                  };
                  const ab = approvalBadge[approval];
                  return (
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {campaign.issue_area && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            {campaign.issue_area}
                          </span>
                        )}
                        {isStory && (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            Storytelling
                          </span>
                        )}
                        {ab && (
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${ab.cls}`}>{ab.label}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-bold">{count}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {isStory ? `stor${count === 1 ? 'y' : 'ies'}` : `action${count !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                  );
                })()}
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
                  <Link
                    href={`/campaign/${campaign.slug}/analytics`}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    Analytics
                  </Link>
                  <CopyLinkButton slug={campaign.slug as string} />
                  <DeleteCampaignButton slug={campaign.slug as string} headline={campaign.headline as string} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRIMARY: My Representatives */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">My Elected Officials</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">The people who represent you at every level of government.</p>
        <MyRepresentativesSection cachedReps={cachedReps} hasAddress={hasAddress} savedAddress={savedAddress} />
      </section>

      {/* PRIMARY: Your Feed */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Activity Feed</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Recent bills, votes, and news from your officials.</p>
        <RepActivitySection />
      </section>

      {/* Notifications (Weekly Digest + Follow-Up Reminders) are hidden until
          Resend email delivery is configured. Restore this section and the
          NotificationPreferences import, and re-enable the crons in vercel.json,
          once RESEND_API_KEY is set. */}

      {/* Messages I've Sent */}
      <section id="messages" className="mb-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Messages I&rsquo;ve Sent{totalMessages > 0 ? ` (${totalMessages})` : ''}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your outreach history — follow up to keep the pressure on.</p>
        {!messages || messages.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg aria-hidden="true" className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No messages yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Send a message to your officials to see your history here.</p>
              <Link
                href="/contact"
                className="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Contact Officials
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMessages.map((msg: Record<string, string>) => {
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
                    <div className="mt-2">
                      <FollowUpButton
                        messageId={msg.id}
                        officialName={msg.legislator_name}
                        issueArea={msg.issue_area}
                        deliveryMethod={msg.delivery_method}
                        senderName={profile?.name || ''}
                      />
                    </div>
                  </div>
                );
              })}
              {totalMessages > 5 && (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Showing 5 of {totalMessages} messages
                </p>
              )}
            </div>
          )}
      </section>

      {/* My Stories */}
      {myStories.length > 0 && (
        <section id="stories" className="mb-10 scroll-mt-24">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">My Stories ({myStories.length})</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Stories you shared with a campaign. You can <strong>change</strong> or <strong>revoke</strong> yours anytime —
            the campaign is flagged either way.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <MyStoriesSection stories={myStories} />
          </div>
        </section>
      )}

      {/* SECONDARY sections */}
      <div className="mb-10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">More</h3>

        {/* Local Officials */}
        <CollapsibleSection title="Local Officials" defaultOpen={false}>
          <LocalOfficialsSection cachedLocalOfficials={cachedLocalOfficials} hasAddress={hasAddress} />
        </CollapsibleSection>

        {/* Voter Info */}
        <CollapsibleSection title="Voter Info" defaultOpen={false}>
          <VoterInfoCard userState={profile?.state || null} />
        </CollapsibleSection>
      </div>
    </div>
  );
}
