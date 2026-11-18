'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CopyLinkButton } from '@/components/campaign/CopyLinkButton';
import { EmbedCodeButton } from '@/components/campaign/EmbedCodeButton';
import { QrCodeButton } from '@/components/campaign/QrCodeButton';
import { DeleteCampaignButton } from '@/components/campaign/DeleteCampaignButton';
import { CloseCampaignButton } from '@/components/campaign/CloseCampaignButton';

/**
 * Everything a card used to carry across its face, in one menu.
 *
 * The 10-02 audit put the whole toolbar on every card because the page a card
 * linked to was an empty hop: there was nothing behind the click, so the
 * actions had to be in front of it. Eight controls on a card you are meant to
 * scan is the cost of that. The hub page now holds the campaign, so the
 * actions can go back behind one control.
 *
 * Nothing is removed. Share, Embed, QR, Edit, Close and Delete are all here,
 * and each keeps its own modal and confirmation.
 */
export function CampaignCardMenu({
  slug,
  headline,
  closed,
  stepCount,
  isStory,
}: {
  slug: string;
  headline: string;
  closed: boolean;
  stepCount: number;
  isStory: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape. A menu that traps the page is worse
  // than the toolbar it replaced.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${headline}`}
        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 w-56 p-1.5 rounded-xl border border-rule dark:border-gray-700 bg-surface dark:bg-gray-800 shadow-lg"
        >
          <Link
            href={`/campaign/${slug}`}
            role="menuitem"
            className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            View public page
          </Link>
          {!isStory && (
            <Link
              href={`/campaign/${slug}/manage`}
              role="menuitem"
              className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {stepCount > 0 ? 'Manage advocacy actions' : 'Add an advocacy action'}
            </Link>
          )}
          <Link
            href={`/campaign/${slug}/edit`}
            role="menuitem"
            className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Edit campaign
          </Link>
          {!isStory && (
            <Link
              href={`/campaign/${slug}/report`}
              role="menuitem"
              className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Impact report
            </Link>
          )}

          <div className="my-1.5 h-px bg-rule dark:bg-gray-700" />

          <CopyLinkButton slug={slug} menuItem />
          <EmbedCodeButton slug={slug} menuItem />
          <QrCodeButton slug={slug} menuItem />

          <div className="my-1.5 h-px bg-rule dark:bg-gray-700" />

          <CloseCampaignButton
            slug={slug}
            headline={headline}
            closed={closed}
            stepCount={stepCount}
            isStory={isStory}
            menuItem
          />
          <DeleteCampaignButton
            slug={slug}
            headline={headline}
            closed={closed}
            stepCount={stepCount}
            menuItem
          />
        </div>
      )}
    </div>
  );
}
