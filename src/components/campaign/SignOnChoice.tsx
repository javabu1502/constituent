'use client';

import { useState } from 'react';
import { SignOnFlow } from '@/components/campaign/SignOnFlow';
import { CampaignParticipate } from '@/components/campaign/CampaignParticipate';
import { CampaignTalkingPoints } from '@/components/campaign/CampaignTalkingPoints';
import type { Campaign } from '@/lib/types';

/**
 * Two ways to act on a sign-on letter, where the organization has set up
 * both.
 *
 * Signing is the default and the point of the instrument: a letter carrying
 * five hundred names says one thing five hundred times, which is what an
 * office reads when it discounts five hundred near-identical form letters.
 * It should take ten seconds.
 *
 * But an office also weighs a constituent writing in their own words more
 * heavily than any signature, and some people arrive willing to do that. If
 * the organization has supplied talking points, that door is open too, and it
 * runs the ordinary participate flow with the ordinary drafting help.
 *
 * Only offered when there are talking points. Without them there is nothing
 * for a person to write from, and a blank page is a worse offer than a letter
 * that is already written.
 */
export function SignOnChoice({
  campaign,
  parentCampaign,
}: {
  campaign: Campaign;
  parentCampaign: { slug: string; headline: string } | null;
}) {
  const [mode, setMode] = useState<'sign' | 'write'>('sign');
  const hasTalkingPoints = !!campaign.message_template;

  if (!hasTalkingPoints) return <SignOnFlow campaign={campaign} />;

  const tab = (value: typeof mode, title: string, blurb: string) => {
    const active = mode === value;
    return (
      <button
        type="button"
        onClick={() => setMode(value)}
        aria-pressed={active}
        className={`flex-1 text-left rounded-xl border p-4 transition-colors ${
          active
            ? 'border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <span className="block font-semibold text-gray-900 dark:text-white">{title}</span>
        <span className="mt-1 block text-sm text-gray-600 dark:text-gray-400">{blurb}</span>
      </button>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        {tab('sign', 'Add your name', 'Put your name to the letter above. It takes a few seconds.')}
        {tab('write', 'Write your own', 'Use the points below to write it in your own words.')}
      </div>

      <div className="mt-6">
        {mode === 'sign' ? (
          <SignOnFlow campaign={campaign} />
        ) : (
          <>
            <CampaignTalkingPoints
              template={campaign.message_template as string}
              orgName={campaign.org_name ?? null}
              subtitle="What this organization is asking people to raise."
            />
            <div className="mt-6">
              <CampaignParticipate campaign={campaign} parentCampaign={parentCampaign} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
