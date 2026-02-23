import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { truncate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'My Messages — My Democracy',
  description: 'View your message history and track your advocacy.',
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

  // Use admin client to query messages (no RLS policies set up yet)
  const admin = createAdminClient();
  const { data: messages } = await admin
    .from('messages')
    .select('*')
    .or(`user_id.eq.${user.id},advocate_email.eq.${user.email}`)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Messages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your advocacy history</p>
        </div>
        <Link
          href="/contact"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          New Message
        </Link>
      </div>

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
    </div>
  );
}
