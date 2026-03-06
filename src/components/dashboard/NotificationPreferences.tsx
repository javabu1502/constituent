'use client';

import { useState, useEffect } from 'react';

interface Preferences {
  weekly_digest: boolean;
  email: string;
}

export function NotificationPreferences({ userEmail }: { userEmail: string }) {
  const [prefs, setPrefs] = useState<Preferences>({
    weekly_digest: false,
    email: userEmail,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) {
          setPrefs({
            weekly_digest: data.preferences.weekly_digest ?? false,
            email: data.preferences.email || userEmail,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userEmail]);

  const handleToggle = async () => {
    const newValue = !prefs.weekly_digest;
    setPrefs((p) => ({ ...p, weekly_digest: newValue }));
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekly_digest: newValue, email: prefs.email }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        // Revert on error
        setPrefs((p) => ({ ...p, weekly_digest: !newValue }));
      }
    } catch {
      setPrefs((p) => ({ ...p, weekly_digest: !newValue }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Weekly Digest
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Get a weekly email with what your officials have been up to
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 ${
            prefs.weekly_digest
              ? 'bg-purple-600'
              : 'bg-gray-200 dark:bg-gray-600'
          }`}
          role="switch"
          aria-checked={prefs.weekly_digest}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              prefs.weekly_digest ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {prefs.weekly_digest && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Email
          </label>
          <input
            type="email"
            value={prefs.email}
            onChange={(e) => setPrefs((p) => ({ ...p, email: e.target.value }))}
            onBlur={async () => {
              if (prefs.email.includes('@')) {
                await fetch('/api/notifications/preferences', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ weekly_digest: prefs.weekly_digest, email: prefs.email }),
                });
              }
            }}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            Sent Mondays at 9am ET. You can unsubscribe anytime.
          </p>
        </div>
      )}

      {saved && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
          Preferences saved!
        </p>
      )}
    </div>
  );
}
