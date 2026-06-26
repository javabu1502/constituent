'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface CampaignItem {
  id: string;
  slug: string;
  headline: string;
  description: string;
  issue_area: string;
  target_level: string;
  status: string;
  approval_status: string;
  campaign_type: string;
  visibility: string;
  story_prompt?: string | null;
  usage_statement?: string | null;
  distribution_plan?: string | null;
  recipient_email?: string | null;
  review_note?: string | null;
  creator_email?: string | null;
  created_at: string;
}

interface ActionResult {
  action: 'approve' | 'reject';
  creator_email: string | null;
  slug: string;
  headline: string;
  note: string;
}

const SITE = 'https://www.mydemocracy.app';

function buildCreatorMailto(r: ActionResult): string {
  const to = r.creator_email ?? '';
  const link = `${SITE}/campaign/${r.slug}`;
  let subject: string;
  let body: string;
  if (r.action === 'approve') {
    subject = `Your My Democracy campaign is live: ${r.headline}`;
    body =
      `Hi,\n\nGood news — your campaign "${r.headline}" has been approved and is now live.\n\n` +
      `Share this link to start collecting support:\n${link}\n\n` +
      (r.note ? `A note from our team:\n${r.note}\n\n` : '') +
      `Thanks for using My Democracy.\n`;
  } else {
    subject = `About your My Democracy campaign: ${r.headline}`;
    body =
      `Hi,\n\nThanks for submitting "${r.headline}". We weren't able to approve it as-is.\n\n` +
      (r.note ? `Reason / what to change:\n${r.note}\n\n` : `Please review our campaign guidelines and feel free to resubmit.\n\n`) +
      `You're welcome to make changes and submit again.\n\nThanks,\nThe My Democracy team\n`;
  }
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ActionResult>>({});

  useEffect(() => {
    fetch('/api/admin/campaigns')
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Error ${res.status}`);
        }
        return res.json();
      })
      .then(setCampaigns)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (campaign: CampaignItem, action: 'approve' | 'reject') => {
    setActionLoading(campaign.id);
    try {
      const note = notes[campaign.id] ?? '';
      const res = await fetch('/api/admin/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, action, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaign.id ? { ...c, status: data.status, approval_status: data.approval_status, review_note: data.review_note } : c
        )
      );
      setResults((prev) => ({
        ...prev,
        [campaign.id]: {
          action,
          creator_email: data.creator_email ?? null,
          slug: campaign.slug,
          headline: campaign.headline,
          note,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pending = campaigns.filter((c) => c.approval_status === 'pending');
  const others = campaigns.filter((c) => c.approval_status !== 'pending');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Campaign Review</h1>

      {pending.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 mb-8">No campaigns pending review.</p>
      )}

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pending Review ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                note={notes[c.id] ?? ''}
                onNoteChange={(v) => setNotes((prev) => ({ ...prev, [c.id]: v }))}
                result={results[c.id]}
                onApprove={() => handleAction(c, 'approve')}
                onReject={() => handleAction(c, 'reject')}
                isLoading={actionLoading === c.id}
              />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            All Campaigns ({others.length})
          </h2>
          <div className="space-y-4">
            {others.map((c) => (
              <CampaignCard key={c.id} campaign={c} result={results[c.id]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  note,
  onNoteChange,
  result,
  onApprove,
  onReject,
  isLoading,
}: {
  campaign: CampaignItem;
  note?: string;
  onNoteChange?: (v: string) => void;
  result?: ActionResult;
  onApprove?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  const isStory = campaign.campaign_type === 'storytelling';

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">{campaign.headline}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[campaign.approval_status] || statusColors.pending}`}>
              {campaign.approval_status}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isStory ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
              {isStory ? 'storytelling' : 'advocacy'}
            </span>
            {campaign.visibility === 'unlisted' && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">unlisted</span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{campaign.description}</p>

          {isStory ? (
            <div className="space-y-2 mb-2">
              {campaign.story_prompt && (
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Story Prompt</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{campaign.story_prompt}</p>
                </div>
              )}
              {campaign.usage_statement && (
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Usage Statement</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{campaign.usage_statement}</p>
                </div>
              )}
              {campaign.recipient_email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Stories sent to: <span className="font-medium">{campaign.recipient_email}</span></p>
              )}
            </div>
          ) : (
            campaign.distribution_plan && (
              <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Distribution Plan</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{campaign.distribution_plan}</p>
              </div>
            )
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span>{campaign.issue_area}</span>
            {!isStory && <span className="capitalize">{campaign.target_level}</span>}
            {campaign.creator_email && <span>by {campaign.creator_email}</span>}
            <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        {onApprove && onReject && (
          <div className="flex flex-col gap-2 flex-shrink-0 w-28">
            <Button size="sm" onClick={onApprove} isLoading={isLoading} className="bg-green-600 hover:bg-green-700">
              Approve
            </Button>
            <Button size="sm" variant="secondary" onClick={onReject} isLoading={isLoading}>
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Review note (pending only) */}
      {onNoteChange && (
        <div className="mt-3">
          <textarea
            value={note ?? ''}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Optional note to the creator (included in your email — e.g. a reason for rejection or a welcome message)"
            rows={2}
            className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
          />
        </div>
      )}

      {/* After a decision: prompt to email the creator */}
      {result && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
            {result.action === 'approve' ? 'Approved.' : 'Rejected.'} Send the creator a personal note
            {result.creator_email ? ` (${result.creator_email})` : ' (no email on file)'}:
          </p>
          <a
            href={buildCreatorMailto(result)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            ✉️ Email the creator
          </a>
        </div>
      )}
    </div>
  );
}
