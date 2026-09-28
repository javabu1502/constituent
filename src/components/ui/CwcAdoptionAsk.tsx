'use client';

import { useEffect, useState } from 'react';

/**
 * Shown on the send card of a senator whose office does NOT accept messages
 * through Communicating With Congress. Explains why this message opens in an
 * email app and offers (pre-checked where the platform speaks for itself)
 * to add the constituent's name to a request asking the office to join. The
 * message text itself is never changed (Jared, 2026-09-28).
 */
export function CwcAdoptionAsk({
  senatorLastName,
  participating,
  defaultChecked,
  onCheckedChange,
  signed,
}: {
  senatorLastName: string;
  /** Number of Senate offices currently on the CWC list. */
  participating: number;
  defaultChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** True once the send action fired with the box checked. */
  signed?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  useEffect(() => { onCheckedChange(checked); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [checked]);

  return (
    <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600">
      <p className="text-xs text-gray-600 dark:text-gray-300">
        Senator {senatorLastName}&apos;s office does not yet accept messages through Communicating with Congress, the delivery
        system used by the House and {participating} Senate offices. Your message opens in your email app instead.
      </p>
      <label className="mt-2 flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
        />
        <span className="text-xs text-gray-700 dark:text-gray-200">
          Add my name to a request asking this office to join.
        </span>
      </label>
      <p className="mt-1 pl-6 text-[11px] text-gray-500 dark:text-gray-400">
        {signed
          ? 'Your name was added to the request when you sent your message.'
          : 'Your name is added when you send your message. Your message text is not changed. We share the number of constituents who asked, and their names, with the office. Nothing else.'}
      </p>
    </div>
  );
}
