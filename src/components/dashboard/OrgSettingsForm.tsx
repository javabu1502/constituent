'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface OrgSettings {
  org_name: string | null;
  org_url: string | null;
  org_logo_url: string | null;
  brand_color: string | null;
}

export function OrgSettingsForm({ initial }: { initial: OrgSettings }) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(initial.org_name ?? '');
  const [orgUrl, setOrgUrl] = useState(initial.org_url ?? '');
  const [logoUrl, setLogoUrl] = useState(initial.org_logo_url ?? '');
  const [brandColor, setBrandColor] = useState(initial.brand_color ?? '');
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/campaigns/logo', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setLogoUrl(data.url);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: orgName.trim() || null,
          org_url: orgUrl.trim() || null,
          org_logo_url: logoUrl || null,
          brand_color: brandColor || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Organization name</label>
        <input
          type="text"
          value={orgName}
          onChange={(e) => { setOrgName(e.target.value); setSaved(false); }}
          maxLength={120}
          placeholder="e.g. Nevada Housing Coalition"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
        <input
          type="url"
          value={orgUrl}
          onChange={(e) => { setOrgUrl(e.target.value); setSaved(false); }}
          maxLength={300}
          placeholder="https://yourorg.org"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Logo <span className="text-gray-400 dark:text-gray-500 font-normal">(PNG/JPEG/WebP, max 1 MB)</span>
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-sm file:font-medium hover:file:bg-purple-700 file:cursor-pointer"
          />
          {logoUploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
        </div>
        {logoUrl && (
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Organization logo" className="h-12 max-w-[160px] object-contain rounded border border-gray-200 dark:border-gray-600 bg-white p-1" />
            <button
              type="button"
              onClick={() => { setLogoUrl(''); setSaved(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={brandColor || '#6A39C9'}
            onChange={(e) => { setBrandColor(e.target.value); setSaved(false); }}
            className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent"
            aria-label="Brand color"
          />
          {brandColor && (
            <button
              type="button"
              onClick={() => { setBrandColor(''); setSaved(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={saving}>Save</Button>
        {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved</span>}
      </div>
    </form>
  );
}
