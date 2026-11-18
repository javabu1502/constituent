'use client';

import { useState, type ReactNode } from 'react';

export interface HubTab {
  id: string;
  label: string;
  panel: ReactNode;
}

/**
 * The campaign hub's tabs.
 *
 * The page this replaces stacked six blocks, one of which held seven more
 * sections of its own: bill status, whip board, coalition, talking points,
 * the actions, then reachable storytellers, stories, messages, where
 * participants stand, outcomes, delivery methods and recent activity. All of
 * it true, none of it findable, and an organiser works on a laptop where the
 * width was going unused while the page ran on for screens.
 *
 * Tabs are rendered eagerly and hidden with CSS rather than unmounted, so
 * switching never refetches and a panel's own state survives.
 */
export function CampaignHubTabs({ tabs }: { tabs: HubTab[] }) {
  const usable = tabs.filter((t) => t.panel);
  const [active, setActive] = useState(usable[0]?.id ?? '');
  if (usable.length === 0) return null;
  if (usable.length === 1) return <>{usable[0].panel}</>;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Campaign sections"
        className="flex flex-wrap gap-0.5 border-b border-rule dark:border-gray-700 mb-6"
      >
        {usable.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`hubtab-${t.id}`}
              aria-selected={on}
              aria-controls={`hubpanel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={`-mb-px px-4 py-2.5 text-sm border-b-2 transition-colors ${
                on
                  ? 'border-purple-600 text-purple-700 dark:text-purple-300 font-semibold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {usable.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`hubpanel-${t.id}`}
          aria-labelledby={`hubtab-${t.id}`}
          hidden={t.id !== active}
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
