'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { IssuePicker } from '@/components/ui/IssuePicker';

export function CampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [headline, setHeadline] = useState(searchParams.get('ask') || '');
  const [description, setDescription] = useState('');
  const [issueArea, setIssueArea] = useState(searchParams.get('issue') || '');
  const [issueCategory, setIssueCategory] = useState(searchParams.get('category') || '');
  const [targetLevel, setTargetLevel] = useState<'federal' | 'state' | 'both'>('federal');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!headline.trim() || headline.trim().length < 3) {
      setError('Headline must be at least 3 characters');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    if (!issueArea.trim()) {
      setError('Please select an issue area');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headline.trim(),
          description: description.trim(),
          issue_area: issueCategory || issueArea,
          issue_subtopic: issueCategory ? issueArea : null,
          target_level: targetLevel,
          message_template: messageTemplate.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      router.push(`/campaign/${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          New to campaigns?{' '}
          <Link href="/guides/how-to-run-a-successful-campaign" className="font-medium underline hover:text-purple-900 dark:hover:text-purple-100">
            Tips for a successful campaign
          </Link>
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Campaign Headline <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g., Protect our local parks funding"
          maxLength={100}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{headline.length}/100 characters</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain the issue and why people should take action..."
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description.length}/500 characters</p>
      </div>

      {/* Issue Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Issue Area <span className="text-red-500">*</span>
        </label>
        <IssuePicker
          value={issueArea}
          category={issueCategory}
          onChange={(issue, category) => {
            setIssueArea(issue);
            setIssueCategory(category);
          }}
        />
      </div>

      {/* Target Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Representatives <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {(['federal', 'state', 'both'] as const).map((level) => (
            <label
              key={level}
              className={`flex-1 text-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                targetLevel === level
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="targetLevel"
                value={level}
                checked={targetLevel === level}
                onChange={() => setTargetLevel(level)}
                className="sr-only"
              />
              <span className="text-sm font-medium capitalize">{level === 'both' ? 'Both' : level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Message Template (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Message Template <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          placeholder="Provide talking points or a template for participants' messages..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This message will be woven into every participant&apos;s personalized letter, combined with their own personal story. The AI will make each letter unique.
        </p>
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
        Create Campaign
      </Button>
    </form>
  );
}
