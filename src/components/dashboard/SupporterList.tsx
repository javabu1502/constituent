import type { Supporter } from '@/lib/org-supporters';

/**
 * The people, by name.
 *
 * The supporters page showed a map and district counts and never once said
 * who anybody was. "Assembly District 1: 1 supporter" is not something an
 * organizer can act on. The point of a supporter list is to be able to call
 * someone, so this is the list.
 *
 * Owner-only by where it is rendered: /dashboard/supporters is the org's own
 * page and nothing here is reachable from the public org page or the embed.
 */
const SOURCE_LABEL: Record<string, string> = {
  joined: 'Joined',
  acted: 'Took action',
  shared: 'Shared a story',
};

const CAP = 500;

export function SupporterList({
  supporters,
  anonymousActions,
  anonymousStories,
}: {
  supporters: Supporter[];
  anonymousActions: number;
  anonymousStories: number;
}) {
  const sorted = [...supporters].sort((a, b) =>
    (a.name ?? a.email).localeCompare(b.name ?? b.email),
  );
  const shown = sorted.slice(0, CAP);
  const anonymous = anonymousActions + anonymousStories;

  if (supporters.length === 0) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Nobody yet. Share your join page, or run a campaign.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-rule dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60 text-left">
            <tr className="text-gray-600 dark:text-gray-400">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Where</th>
              <th className="px-4 py-2 font-medium">District</th>
              <th className="px-4 py-2 font-medium">How</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {shown.map((s) => {
              const districts = [
                s.upperDistrict ? `Senate ${s.upperDistrict}` : null,
                s.lowerDistrict ? `Assembly ${s.lowerDistrict}` : null,
              ].filter(Boolean);
              return (
                <tr key={s.email} className="text-gray-900 dark:text-gray-100">
                  <td className="px-4 py-2">{s.name || '(no name given)'}</td>
                  <td className="px-4 py-2">
                    <a href={`mailto:${s.email}`} className="text-purple-700 dark:text-purple-300 hover:underline">
                      {s.email}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {[s.city, s.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {districts.length ? districts.join(' · ') : 'Not placed'}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {[...s.sources].map((src) => SOURCE_LABEL[src] ?? src).join(', ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        {supporters.length} {supporters.length === 1 ? 'person' : 'people'}
        {shown.length < sorted.length ? `, showing the first ${shown.length}` : ''}.
        {anonymous > 0 && (
          <>
            {' '}
            {anonymous} more acted or shared without leaving an email, so there is no way to tie
            those to a person.
          </>
        )}
      </p>
    </div>
  );
}
