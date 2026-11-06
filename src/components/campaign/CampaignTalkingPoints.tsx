/**
 * The campaign's contributed language, out in the open — the visible half of
 * the two-block model. Participants see exactly what the org adds to every
 * message BEFORE they write; everything else is their own words. Rendered on
 * campaign/stage pages and (collapsed) on the review step.
 */
export function CampaignTalkingPoints({
  template,
  accent,
  subtitle,
}: {
  template: string;
  accent?: string | null;
  subtitle?: string;
}) {
  const color = accent || '#7C3AED';
  return (
    <div className="bg-surface dark:bg-gray-800 rounded-2xl border border-rule dark:border-gray-700 p-6 sm:p-8 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        {/* Just "Talking points". The byline above already says whose
            campaign this is, so possessive-ing the heading repeated the org
            name twice on one screen. */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Talking points</h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        {subtitle ??
          'Your message includes these points plus your own reasons, in your own words. You edit the draft before sending.'}
      </p>
      <blockquote className="border-l-4 pl-4 py-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line" style={{ borderColor: color }}>
        {template}
      </blockquote>
    </div>
  );
}
