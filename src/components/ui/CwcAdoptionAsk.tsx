'use client';

import { useEffect, useState } from 'react';
import { CWC_ADOPTION_SENTENCE, withAdoptionSentence } from '@/lib/cwc-client';

/**
 * Shown on the send card of a senator whose office does NOT accept messages
 * through Communicating With Congress. Explains why this message opens in an
 * email app, and offers (pre-checked where the platform speaks for itself)
 * to add the constituent's name to a request asking the office to join. When
 * checked, one sentence is added to the message body so the ask reaches the
 * office directly as well.
 */
export function CwcAdoptionAsk({
  senatorLastName,
  participating,
  defaultChecked,
  body,
  onBodyChange,
  onCheckedChange,
  signed,
}: {
  senatorLastName: string;
  /** Number of Senate offices currently on the CWC list. */
  participating: number;
  defaultChecked: boolean;
  body: string;
  onBodyChange: (body: string) => void;
  onCheckedChange: (checked: boolean) => void;
  /** True once the send action fired with the box checked. */
  signed?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  // Keep the body in step with the box: pre-checked adds the sentence once.
  useEffect(() => {
    const has = body.includes(CWC_ADOPTION_SENTENCE);
    if (checked && !has) onBodyChange(withAdoptionSentence(body, true));
    if (!checked && has) onBodyChange(withAdoptionSentence(body, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

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
          Add my name to a request asking this office to join, and add one sentence to my message asking the same.
        </span>
      </label>
      <p className="mt-1 pl-6 text-[11px] text-gray-500 dark:text-gray-400">
        {signed
          ? 'Your name was added to the request when you sent your message.'
          : 'Your name is added when you send your message. We share the number of constituents who asked, and their names, with the office. Nothing else.'}
      </p>
    </div>
  );
}
