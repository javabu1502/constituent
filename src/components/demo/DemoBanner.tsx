import Link from 'next/link';

/**
 * Banner shown on every page of the public org-backend demo. States what the
 * visitor is looking at and routes them to the pilot application.
 */
export function DemoBanner() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 px-4 py-3">
      <p className="text-sm text-purple-900 dark:text-purple-200">
        <span className="font-semibold">Live demo.</span> This is the organization dashboard with sample data from a
        fictional Nevada coalition. Explore everything. Editing is turned off.
      </p>
      <Link
        href="/campaigns#apply"
        className="shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
      >
        Apply for the pilot
      </Link>
    </div>
  );
}
