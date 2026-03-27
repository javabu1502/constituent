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
  distribution_plan?: string;
  created_at: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleAction = async (campaignId: string, action: 'approve' | 'reject') => {
    setActionLoading(campaignId);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId ? { ...c, status: data.status } : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pending = campaigns.filter((c) => c.status === 'pending');
  const others = campaigns.filter((c) => c.status !== 'pending');

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
                onApprove={() => handleAction(c.id, 'approve')}
                onReject={() => handleAction(c.id, 'reject')}
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
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  onApprove,
  onReject,
  isLoading,
}: {
  campaign: CampaignItem;
  onApprove?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    paused: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">{campaign.headline}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[campaign.status] || statusColors.paused}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{campaign.description}</p>
          {campaign.distribution_plan && (
            <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Distribution Plan</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{campaign.distribution_plan}</p>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{campaign.issue_area}</span>
            <span className="capitalize">{campaign.target_level}</span>
            <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        {onApprove && onReject && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={onApprove}
              isLoading={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onReject}
              isLoading={isLoading}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
