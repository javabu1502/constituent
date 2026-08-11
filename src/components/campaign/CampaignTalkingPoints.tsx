/**
 * The campaign's contributed language, out in the open — the visible half of
 * the two-block model. Participants see exactly what the org adds to every
 * message BEFORE they write; everything else is their own words. Rendered on
 * campaign/stage pages and (collapsed) on the review step.
 */
export function CampaignTalkingPoints({
  template,
  orgName,
  accent,
}: {
  template: string;
  orgName: string | null;
  accent?: string | null;
}) {
  const color = accent || '#7C3AED';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {orgName ? `${orgName}'s talking points` : 'Campaign talking points'}
        </h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        These points are woven into every message this campaign sends. The rest of your message is written in your own
        words — you review and edit everything before it goes anywhere.
      </p>
      <blockquote className="border-l-4 pl-4 py-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line" style={{ borderColor: color }}>
        {template}
      </blockquote>
    </div>
  );
}
