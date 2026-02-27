'use client';

import { useState } from 'react';

type DigestFrequency = 'none' | 'daily' | 'weekly';

export function EmailDigestToggle({ currentValue }: { currentValue: string }) {
  const [value, setValue] = useState<DigestFrequency>(
    (['none', 'daily', 'weekly'].includes(currentValue) ? currentValue : 'none') as DigestFrequency
  );
  const [saving, setSaving] = useState(false);

  const handleChange = async (newValue: DigestFrequency) => {
    setValue(newValue);
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_digest: newValue }),
      });
    } catch {
      // Revert on error
      setValue(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Email Digest</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Get a summary of your civic activity delivered to your inbox.
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-lg p-0.5">
          {(['none', 'daily', 'weekly'] as DigestFrequency[]).map((option) => (
            <button
              key={option}
              onClick={() => handleChange(option)}
              disabled={saving}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                value === option
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              } ${saving ? 'opacity-50' : ''}`}
            >
              {option === 'none' ? 'Off' : option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
